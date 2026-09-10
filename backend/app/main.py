from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.utils.paths import get_upload_dir
from app.config import load_env
from app.utils.security import global_rate_limited

load_env()
from app.routes import (
    auth, students, enrollments,
    financial, carnes, schedule, communication,
    reports, search, settings, students_profile, materials,
    courses, audit, leads, backup,
    teachers, classes, attendance, evaluations, boletins, certificates, weight_config,
)
import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
ENABLE_DOCS = ENVIRONMENT != "production"

async def _run_alembic_migrations():
    """Aplica o schema via Alembic (fonte única de verdade — ver alembic/versions/).

    Roda como subprocesso (`python -m alembic`) para não misturar o event loop
    do lifespan com o `asyncio.run()` interno do alembic/env.py, e para isolar
    a engine síncrona de migração da engine assíncrona da aplicação.

    Primeira execução contra um banco que já tinha o schema criado pelo antigo
    mecanismo (`create_all` + `ALTER TABLE` manuais, usado até esta versão):
    detecta que as tabelas já existem mas `alembic_version` não, e roda
    `stamp head` (marca como já aplicado) em vez de `upgrade head` (que
    tentaria recriar tabelas existentes e falharia). Banco novo/vazio roda
    `upgrade head` normalmente.

    Se o banco já está na revisão mais recente, não spawna o subprocesso —
    evita o custo de um novo interpretador Python a cada boot (relevante nos
    testes, que recriam o TestClient/lifespan a cada teste sobre o mesmo
    banco temporário).
    """
    import sys
    import asyncio as _asyncio
    from pathlib import Path
    from sqlalchemy import inspect, text
    from alembic.config import Config
    from alembic.script import ScriptDirectory
    from app.database import engine

    backend_dir = Path(__file__).resolve().parent.parent
    head_rev = ScriptDirectory.from_config(Config(str(backend_dir / "alembic.ini"))).get_current_head()

    async with engine.begin() as conn:
        existing_tables = await conn.run_sync(lambda c: set(inspect(c).get_table_names()))
        current_rev = None
        if "alembic_version" in existing_tables:
            row = (await conn.execute(text("SELECT version_num FROM alembic_version"))).first()
            current_rev = row[0] if row else None

    if current_rev is not None and current_rev == head_rev:
        return

    import logging
    _logger = logging.getLogger(__name__)
    subcommand = "stamp" if existing_tables and "alembic_version" not in existing_tables else "upgrade"
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        proc = await _asyncio.create_subprocess_exec(
            sys.executable, "-m", "alembic", "-c", str(backend_dir / "alembic.ini"), subcommand, "head",
            cwd=str(backend_dir),
            stdout=_asyncio.subprocess.PIPE,
            stderr=_asyncio.subprocess.STDOUT,
        )
        output = (await proc.stdout.read()).decode(errors="replace")
        await proc.wait()
        if proc.returncode == 0:
            return
        if attempt < max_attempts:
            _logger.warning("Alembic falhou (tentativa %d/%d), retry em 5s...", attempt, max_attempts)
            await _asyncio.sleep(5)
    _logger.warning("Alembic falhou após %d tentativas. App iniciando em modo degradado (sem migrações). Erro: %s", max_attempts, output)


@asynccontextmanager
async def lifespan(app):
    from app.database import async_session
    from sqlalchemy import select
    from app.models.school import School

    await _run_alembic_migrations()

    async with async_session() as db:
        result = await db.execute(select(School).limit(1))
        school = result.scalar_one_or_none()
        if not school:
            school = School(name="Gestão Escolar")
            db.add(school)
            await db.commit()

    # Seed do Super Admin de suporte (D-13): conta de suporte criada/atualizada no
    # startup a partir de SUPPORT_ADMIN_EMAIL/SUPPORT_ADMIN_PASSWORD (+ SUPPORT_ADMIN_NAME
    # opcional, default "Suporte JG Sistemas"). Sem env vars → no-op silencioso.
    # NUNCA imprimir a senha (nem em log nem em artefato).
    from app.models.user import User
    from app.utils.auth import hash_password
    from app.utils.audit import log_audit

    _support_email = os.getenv("SUPPORT_ADMIN_EMAIL", "").strip()
    _support_password = os.getenv("SUPPORT_ADMIN_PASSWORD", "").strip()
    if _support_email and _support_password:
        async with async_session() as db:
            result = await db.execute(select(User).where(User.email == _support_email))
            support = result.scalar_one_or_none()
            support_name = os.getenv("SUPPORT_ADMIN_NAME", "Suporte JG Sistemas").strip() or "Suporte JG Sistemas"
            if support:
                # Conta de suporte já existe: sincronizamos papel/nome/status, mas NÃO
                # sobrescrevemos a senha. A senha SÓ muda quando o usuário solicita
                # ("esqueci minha senha") — antigamente o seed resetava a hash a cada
                # boot e o login parava de funcionar após logout/reinício.
                support.role = "super_admin"
                support.name = support_name
                support.is_active = True
            else:
                support = User(
                    name=support_name,
                    email=_support_email,
                    password_hash=hash_password(_support_password),
                    role="super_admin",
                    is_active=True,
                )
                db.add(support)
            await db.flush()  # garante support.id sem depender de commit
            await log_audit(db, None, "superadmin.seed", "user", support.id,
                            details=f"email={_support_email}")
            await db.commit()
        print(f"[startup] Super Admin de suporte pronto ({_support_email})", flush=True)

    # Ativa buckets do Supabase Storage se configurado (senão, no-op de disco local)
    from app.utils import storage
    if storage.is_supabase_enabled():
        storage.ensure_buckets()

    # Diagnóstico: status do envio de e-mail no boot (sem expor a chave/PII).
    _has_resend = bool(os.getenv("RESEND_API_KEY", "").strip()) and bool(os.getenv("RESEND_FROM", "").strip())
    _has_smtp = bool(os.getenv("SMTP_HOST", "").strip())
    _email_backend = "resend" if _has_resend else ("smtp" if _has_smtp else "desabilitado")
    print(f"[startup] E-mail transacional via {_email_backend}", flush=True)

    yield

    from app.database import engine
    await engine.dispose()


app = FastAPI(
    title="Gestão Escolar - Sistema de Gestão",
    description="API completa para gerenciamento escolar",
    version="1.0.0",
    docs_url="/docs" if ENABLE_DOCS else None,
    redoc_url="/redoc" if ENABLE_DOCS else None,
    lifespan=lifespan,
)

# CORS restrito a origens explicitamente configuradas (nunca "*" com credentials).
# Registrado APÓS os middlewares decorados (add_middleware usa insert(0)) para ficar
# EXTERNO a eles: respostas curtas do rate limit (429) também recebem headers CORS.
_cors_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _cors_env.split(",") if o.strip()]


@app.middleware("http")
async def public_api_rate_limit(request: Request, call_next):
    """Rate limit global para /api/* sem token (mitiga brute-force e DoS em endpoints públicos).

    Config: RATE_LIMIT_PER_MINUTE (0 desliga, usado nos testes). Autenticados não são limitados.
    Registrado por primeiro para ficar INTERNO ao security_headers (que adiciona headers ao 429).
    """
    if request.url.path.startswith("/api/"):
        auth_header = request.headers.get("authorization", "")
        if not auth_header.lower().startswith("bearer "):
            if global_rate_limited(request):
                return JSONResponse(status_code=429, content={"detail": "Muitas requisições. Aguarde um minuto."})
    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """Headers de segurança globais (clickjacking, MIME-sniffing, referrer e fingerprinting)."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    is_https = request.url.scheme == "https" or request.headers.get("x-forwarded-proto", "") == "https"
    if ENVIRONMENT == "production" or is_https:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    if request.url.path.startswith("/api/"):
        # Respostas da API são JSON: CSP rígido de defesa em profundidade.
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
    return response


@app.middleware("http")
async def uploads_security_headers(request: Request, call_next):
    """Força download e bloqueia MIME-sniffing em /uploads (mitiga XSS por upload)."""
    response = await call_next(request)
    if request.url.path.startswith("/uploads"):
        response.headers["X-Content-Type-Options"] = "nosniff"
        content_type = response.headers.get("content-type", "").lower()
        if not content_type.startswith("image/"):
            response.headers["Content-Disposition"] = "attachment"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'none'"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


UPLOAD_DIR = get_upload_dir()
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend_dist")
if os.path.isdir(os.path.join(FRONTEND_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="frontend_assets")

app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(students.router, prefix="/api/students", tags=["Alunos"])
app.include_router(courses.router, prefix="/api/courses", tags=["Cursos"])
app.include_router(enrollments.router, prefix="/api/enrollments", tags=["Matrículas"])
app.include_router(financial.router, prefix="/api/financial", tags=["Financeiro"])
app.include_router(carnes.router, prefix="/api/carnes", tags=["Carnês"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["Agenda"])
app.include_router(reports.router, prefix="/api/reports", tags=["Relatórios"])
app.include_router(search.router, prefix="/api/search", tags=["Pesquisa"])
app.include_router(settings.router, prefix="/api/settings", tags=["Configurações"])
app.include_router(students_profile.router, prefix="/api/student-profile", tags=["Perfil do Aluno"])
app.include_router(materials.router, prefix="/api/materials", tags=["Materiais Didáticos"])
app.include_router(audit.router, prefix="/api/audit", tags=["Auditoria"])
app.include_router(backup.router, prefix="/api/backup", tags=["Backup"])
app.include_router(communication.router, prefix="/api/communication", tags=["Comunicação"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["Professores"])
app.include_router(classes.router, prefix="/api/classes", tags=["Turmas"])
app.include_router(attendance.router, prefix="/api/attendance", tags=["Frequência"])
app.include_router(evaluations.router, prefix="/api/evaluations", tags=["Avaliações"])
app.include_router(boletins.router, prefix="/api/boletins", tags=["Boletins"])
app.include_router(certificates.router, prefix="/api/certificates", tags=["Certificados"])
app.include_router(weight_config.router, prefix="/api/weight-config", tags=["Pesos de Avaliação"])
app.include_router(leads.router, prefix="/api/leads", tags=["Leads"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "message": "Sistema de gestão escolar"}


_INDEX_HTML = os.path.join(FRONTEND_DIR, "index.html")

# O backend é servido como API-only (frontend publicado na Vercel). O build SPA
# (frontend_dist/) NÃO é versionado no git, então não existe na imagem do Render.
# Quando presente (dev local), serve o SPA; quando ausente, responde 404 limpo.
_FRONTEND_AVAILABLE = os.path.isfile(_INDEX_HTML)


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Rota não encontrada")
    if not _FRONTEND_AVAILABLE:
        return JSONResponse(
            status_code=404,
            content={
                "detail": "Backend API-only em produção. A interface é servida pela Vercel "
                          "(https://jgsistemas.vercel.app), não por este servidor."
            },
        )
    file_path = os.path.join(FRONTEND_DIR, full_path)
    file_path = os.path.normpath(file_path)
    if not file_path.startswith(os.path.normpath(FRONTEND_DIR)):
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse(_INDEX_HTML)
