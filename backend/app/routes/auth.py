from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.user import User
from app.utils.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_role, decode_token,
    generate_reset_token, validate_password,
)
from app.utils.security import (
    is_rate_limited, client_ip,
    is_account_locked, register_failed_login, reset_login_attempts,
)
from app.utils.audit import log_audit
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import json
import os
import secrets
import httpx

router = APIRouter()

RESET_TOKEN_TTL_MINUTES = 30


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "secretary"
    permissions: list[str] | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr = ""
    token: str
    new_password: str


class UpdateUserRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None
    permissions: list[str] | None = None
    is_active: bool | None = None


def _hash_reset_token(token: str) -> str:
    return sha256(token.encode()).hexdigest()


async def _optional_admin_user(request: Request, db: AsyncSession):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    try:
        payload = decode_token(auth_header[7:])
        result = await db.execute(select(User).where(User.id == int(payload.get("sub", "0"))))
        user = result.scalar_one_or_none()
        return user if user and user.is_active and user.role == "admin" else None
    except Exception:
        return None


def _reset_link(email: str, token: str) -> str:
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    return f"{frontend_url}/login?token={token}&email={email}"


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip = client_ip(request)
    if is_rate_limited(f"login:{ip}", limit=10, window_seconds=300):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde alguns minutos.")

    if is_account_locked(req.email):
        # Resposta idêntica à falha normal: não revela existência nem bloqueio da conta.
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        # Conta inexistente não entra no lockout (evita DoS bloqueando contas de terceiros).
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if not verify_password(req.password, user.password_hash):
        register_failed_login(req.email)
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Conta desativada")

    reset_login_attempts(req.email)
    user.last_login = datetime.now(timezone.utc)
    await log_audit(db, user, "login", "user", user.id, ip_address=ip)
    await db.commit()

    token = create_access_token({"sub": str(user.id), "role": user.role})
    permissions = json.loads(user.permissions) if user.permissions else None
    return LoginResponse(
        access_token=token,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "permissions": permissions,
            "avatar_url": user.avatar_url,
            "school_id": user.school_id
        }
    )


@router.post("/register")
async def register(req: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Cadastro aberto apenas no bootstrap (sem usuários). Depois, exige admin autenticado."""
    ip = client_ip(request)
    if is_rate_limited(f"register:{ip}", limit=5, window_seconds=300):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde alguns minutos.")

    validate_password(req.password)

    admin = None
    total = await db.execute(select(func.count()).select_from(User))
    if (total.scalar() or 0) > 0:
        admin = await _optional_admin_user(request, db)
        if not admin:
            raise HTTPException(status_code=403, detail="Apenas administradores podem criar usuários")

    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    role = req.role if req.role in ("admin", "secretary", "teacher") else "secretary"
    perms_json = json.dumps(req.permissions) if req.permissions else None
    user = User(
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
        role=role,
        permissions=perms_json
    )
    db.add(user)
    await log_audit(db, admin or user, "user.create",
                    "user", None, f"email={req.email} role={role}", ip_address=ip)
    await db.commit()
    return {"message": "Usuário criado com sucesso"}


@router.post("/supabase-sync")
async def supabase_sync(request: Request, db: AsyncSession = Depends(get_db)):
    """Cria/sincroniza usuário local a partir de uma sessão Supabase (ex.: login Google).

    Recebe o access_token do Supabase no header Authorization e valida direto
    com o servidor do Supabase antes de criar o usuário.
    """
    ip = client_ip(request)
    auth_header = request.headers.get("authorization", "")
    token = auth_header[7:].strip() if auth_header.lower().startswith("bearer ") else ""
    sb_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    sb_key = os.getenv("SUPABASE_ANON_KEY", "")
    if not token or not sb_url:
        raise HTTPException(status_code=503, detail="Autenticação Supabase não configurada neste servidor")

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{sb_url}/auth/v1/user",
            headers={"apikey": sb_key, "Authorization": f"Bearer {token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Sessão Supabase inválida ou expirada")
    info = resp.json()
    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Conta sem e-mail válido")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        meta = info.get("user_metadata") or {}
        name = meta.get("full_name") or meta.get("name") or email.split("@")[0]
        avatar = meta.get("avatar_url") or meta.get("picture") or None
        total = await db.execute(select(func.count()).select_from(User))
        first_user = (total.scalar() or 0) == 0
        unusable_password = hash_password(secrets.token_urlsafe(24))
        user = User(
            name=name,
            email=email,
            password_hash=unusable_password,
            role="admin" if first_user else "secretary",
            avatar_url=avatar,
        )
        db.add(user)
        await log_audit(db, user, "user.create_oauth", "user", None, f"email={email} provider=supabase", ip_address=ip)
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuário desativado. Contate o administrador.")

    user.last_login = datetime.now(timezone.utc)
    await log_audit(db, user, "login", "user", user.id, ip_address=ip)
    await db.commit()

    permissions = json.loads(user.permissions) if user.permissions else None
    t = create_access_token({"sub": str(user.id), "role": user.role})
    return LoginResponse(
        access_token=t,
        user={
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "permissions": permissions,
            "avatar_url": user.avatar_url,
            "school_id": user.school_id
        }
    )


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Resposta idêntica para e-mail existente/inexistente (não enumera usuários)."""
    ip = client_ip(request)
    if is_rate_limited(f"forgot:{ip}", limit=5, window_seconds=900):
        raise HTTPException(status_code=429, detail="Muitas solicitações. Aguarde.")

    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if user:
        token = generate_reset_token()
        user.reset_token_hash = _hash_reset_token(token)
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)
        await log_audit(db, user, "auth.forgot_password", "user", user.id, ip_address=ip)
        await db.commit()

        link = _reset_link(req.email, token)
        from app.services.email_service import send_email
        result_email = await send_email(
            to=req.email,
            subject="Recuperação de senha",
            body=f"Clique no link abaixo para redefinir sua senha (válido por 30 minutos):\n\n{link}",
        )
        if not result_email["success"]:
            import os
            detalhe = result_email.get("error") or "erro desconhecido"
            if os.getenv("ENVIRONMENT") != "production":
                print(f"[password-reset] Falha ao enviar e-mail para {req.email}: {detalhe}")
                print("[password-reset] Configure SMTP_HOST/SMTP_USER/SMTP_PASS no .env para entrega de e-mails.")
            else:
                print(f"[password-reset] Falha no envio de e-mail: {detalhe}", flush=True)

    return {"message": "Se o e-mail existir, você receberá as instruções."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    ip = client_ip(request)
    if is_rate_limited(f"reset:{ip}", limit=5, window_seconds=900):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde.")

    validate_password(req.new_password)

    token_hash = _hash_reset_token(req.token)
    result = await db.execute(select(User).where(User.reset_token_hash == token_hash))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Link inválido ou já utilizado")

    expires = user.reset_token_expires
    if expires is not None and expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if not expires or expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Link expirado. Solicite um novo.")

    user.password_hash = hash_password(req.new_password)
    user.reset_token_hash = None
    user.reset_token_expires = None
    await log_audit(db, user, "auth.reset_password", "user", user.id, ip_address=ip)
    await db.commit()
    return {"message": "Senha redefinida com sucesso"}


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    validate_password(req.new_password)
    current_user.password_hash = hash_password(req.new_password)
    await log_audit(db, current_user, "auth.change_password", "user", current_user.id, ip_address=client_ip(request))
    await db.commit()
    return {"message": "Senha alterada com sucesso"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "avatar_url": current_user.avatar_url
    }


@router.get("/users")
async def list_users(
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).order_by(User.name))
    users = result.scalars().all()
    return [
        {
            "id": u.id, "name": u.name, "email": u.email,
            "role": u.role, "is_active": u.is_active,
            "permissions": json.loads(u.permissions) if u.permissions else None,
            "created_at": u.created_at.isoformat() if u.created_at else None
        }
        for u in users
    ]


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Você não pode excluir a própria conta")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    await log_audit(db, current_user, "user.delete", "user", user_id,
                    f"email={user.email}", ip_address=client_ip(request))
    await db.delete(user)
    await db.commit()
    return {"message": "Usuário excluído com sucesso"}


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    req: UpdateUserRequest,
    request: Request,
    current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if req.name is not None:
        user.name = req.name
    if req.email is not None:
        existing = await db.execute(select(User).where(User.email == req.email, User.id != user_id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        user.email = req.email
    if req.role is not None:
        user.role = req.role if req.role in ("admin", "secretary", "teacher") else "secretary"
    if req.permissions is not None:
        user.permissions = json.dumps(req.permissions)
    if req.is_active is not None:
        user.is_active = req.is_active

    await log_audit(db, current_user, "user.update", "user", user_id,
                    f"email={user.email}", ip_address=client_ip(request))
    await db.commit()
    return {"message": "Usuário atualizado com sucesso"}
