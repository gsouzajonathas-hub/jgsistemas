from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.database import engine, Base
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

@asynccontextmanager
async def lifespan(app):
    from app.database import async_session, engine, Base
    from sqlalchemy import select, text
    from app.models.school import School

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if engine.dialect.name == "sqlite":
        async with engine.begin() as conn:
            def add_missing_columns(sync_conn):
                cols = {row[1] for row in sync_conn.execute(text("PRAGMA table_info(students)")).fetchall()}
                if "monthly_fee" not in cols:
                    sync_conn.execute(text("ALTER TABLE students ADD COLUMN monthly_fee FLOAT"))
                if "due_day" not in cols:
                    sync_conn.execute(text("ALTER TABLE students ADD COLUMN due_day INTEGER"))

                user_cols = {row[1] for row in sync_conn.execute(text("PRAGMA table_info(users)")).fetchall()}
                if "reset_token_hash" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(64)"))
                if "reset_token_expires" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME"))
                if "permissions" not in user_cols:
                    sync_conn.execute(text("ALTER TABLE users ADD COLUMN permissions TEXT"))

                inst_cols = {row[1] for row in sync_conn.execute(text("PRAGMA table_info(installments)")).fetchall()}
                if "carnet_id" not in inst_cols:
                    sync_conn.execute(text("ALTER TABLE installments ADD COLUMN carnet_id INTEGER"))
                if "installment_number" not in inst_cols:
                    sync_conn.execute(text("ALTER TABLE installments ADD COLUMN installment_number INTEGER"))
                if "discount" not in inst_cols:
                    sync_conn.execute(text("ALTER TABLE installments ADD COLUMN discount FLOAT DEFAULT 0"))
                if "late_fee" not in inst_cols:
                    sync_conn.execute(text("ALTER TABLE installments ADD COLUMN late_fee FLOAT DEFAULT 0"))
                if "interest" not in inst_cols:
                    sync_conn.execute(text("ALTER TABLE installments ADD COLUMN interest FLOAT DEFAULT 0"))
                if "total_paid" not in inst_cols:
                    sync_conn.execute(text("ALTER TABLE installments ADD COLUMN total_paid FLOAT DEFAULT 0"))
                if "contract_id" not in inst_cols:
                    sync_conn.execute(text("ALTER TABLE installments ADD COLUMN contract_id INTEGER"))

                plan_cols = {row[1] for row in sync_conn.execute(text("PRAGMA table_info(financial_plans)")).fetchall()}
                if "course_id" not in plan_cols:
                    sync_conn.execute(text("ALTER TABLE financial_plans ADD COLUMN course_id INTEGER"))
                if "duration_months" not in plan_cols:
                    sync_conn.execute(text("ALTER TABLE financial_plans ADD COLUMN duration_months INTEGER DEFAULT 1"))
                if "discount_type" not in plan_cols:
                    sync_conn.execute(text("ALTER TABLE financial_plans ADD COLUMN discount_type VARCHAR(20) DEFAULT 'percent'"))
                if "discount_value" not in plan_cols:
                    sync_conn.execute(text("ALTER TABLE financial_plans ADD COLUMN discount_value FLOAT DEFAULT 0"))
                if "upfront_discount_pct" not in plan_cols:
                    sync_conn.execute(text("ALTER TABLE financial_plans ADD COLUMN upfront_discount_pct FLOAT DEFAULT 0"))

                settings_cols = {row[1] for row in sync_conn.execute(text("PRAGMA table_info(school_settings)")).fetchall()}
                if "pix_key" not in settings_cols:
                    sync_conn.execute(text("ALTER TABLE school_settings ADD COLUMN pix_key VARCHAR(200)"))
                if "slogan" not in settings_cols:
                    sync_conn.execute(text("ALTER TABLE school_settings ADD COLUMN slogan VARCHAR(300)"))
                if "social_media" not in settings_cols:
                    sync_conn.execute(text("ALTER TABLE school_settings ADD COLUMN social_media VARCHAR(200)"))
                if "payment_methods" not in settings_cols:
                    sync_conn.execute(text("ALTER TABLE school_settings ADD COLUMN payment_methods VARCHAR(200) DEFAULT 'PIX,Dinheiro,Débito,Crédito'"))
            await conn.run_sync(add_missing_columns)

    async with async_session() as db:
        result = await db.execute(select(School).limit(1))
        school = result.scalar_one_or_none()
        if not school:
            school = School(name="Gestão Escolar")
            db.add(school)
            await db.commit()

    # Ativa buckets do Supabase Storage se configurado (senão, no-op de disco local)
    from app.utils import storage
    if storage.is_supabase_enabled():
        await conn.run_sync(lambda _: storage.ensure_buckets())

    # Diagnóstico: status do envio de e-mail no boot (sem expor a chave/PII).
    _has_resend = bool(os.getenv("RESEND_API_KEY", "").strip()) and bool(os.getenv("RESEND_FROM", "").strip())
    _has_smtp = bool(os.getenv("SMTP_HOST", "").strip())
    _email_backend = "resend" if _has_resend else ("smtp" if _has_smtp else "desabilitado")
    print(f"[startup] E-mail transacional via {_email_backend}", flush=True)

    yield


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
    if full_path and os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse(_INDEX_HTML)
