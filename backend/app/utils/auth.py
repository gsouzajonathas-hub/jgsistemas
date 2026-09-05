from datetime import datetime, timedelta, timezone
import secrets

from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.config import load_env

load_env()
import os

DEFAULT_SECRET_KEYS = {
    "super-secret-key-change-in-production",
    "changeme",
    "",
}

SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
if SECRET_KEY in DEFAULT_SECRET_KEYS:
    raise RuntimeError(
        "SECRET_KEY inválida ou padrão. Defina uma chave forte (ex.: 'python -c \"import secrets; print(secrets.token_urlsafe(48))\"') no .env ou variável de ambiente."
    )

ALGORITHM = "HS256"
# Padrão: 8h (480 min) para reduzir quedas de sessão em uso real.
# Pode ser sobrescrito via variável de ambiente ACCESS_TOKEN_EXPIRE_MINUTES.
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def validate_password(password: str):
    if len(password or "") < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 8 caracteres")


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou inativo")
    return user


def require_role(*roles):
    async def role_checker(current_user: User = Depends(get_current_user)):
        # Super admin (D-08) tem acesso total: passa em qualquer restrição de role.
        if current_user.role == "super_admin":
            return current_user
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Acesso negado")
        return current_user
    return role_checker
