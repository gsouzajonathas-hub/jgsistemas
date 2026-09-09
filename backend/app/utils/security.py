import os
import time
from collections import defaultdict

_requests = defaultdict(list)

# Lockout de conta: {email_normalizado: {"count": int, "locked_until": float}}
_login_attempts: dict[str, dict] = {}


def _login_max_attempts() -> int:
    try:
        return max(1, int(os.getenv("LOGIN_MAX_ATTEMPTS", "5")))
    except ValueError:
        return 5


def _login_lock_seconds() -> int:
    try:
        return max(1, int(os.getenv("LOGIN_LOCK_MINUTES", "15"))) * 60
    except ValueError:
        return 15 * 60


def _login_key(email: str) -> str:
    return email.strip().lower()


def register_failed_login(email: str) -> bool:
    """Registra uma tentativa falha de login por conta. Retorna True se acabou de bloquear."""
    if not email:
        return False
    key = _login_key(email)
    now = time.monotonic()
    entry = _login_attempts.setdefault(key, {"count": 0, "locked_until": 0.0})
    if entry["locked_until"] > now:
        return False
    if entry["locked_until"]:  # janela expirou: reinicia o contador
        entry["count"] = 0
    entry["count"] += 1
    if entry["count"] >= _login_max_attempts():
        entry["locked_until"] = now + _login_lock_seconds()
        return True
    return False


def is_account_locked(email: str) -> bool:
    """True se a conta está temporariamente bloqueada por excesso de tentativas falhas."""
    if not email:
        return False
    key = _login_key(email)
    entry = _login_attempts.get(key)
    if not entry:
        return False
    now = time.monotonic()
    if entry["locked_until"] > now:
        return True
    if entry["locked_until"]:  # expirou: limpa a entrada
        _login_attempts.pop(key, None)
    return False


def reset_login_attempts(email: str) -> None:
    """Zera o contador de tentativas (login bem-sucedido ou redefinição de senha)."""
    if email:
        _login_attempts.pop(_login_key(email), None)


def _cleanup(now: float):
    for key in list(_requests.keys()):
        _requests[key] = [t for t in _requests[key] if t > now - 3600]
        if not _requests[key]:
            del _requests[key]


def is_rate_limited(key: str, limit: int, window_seconds: float) -> bool:
    """Sliding-window limiter em memória por chave (ex.: IP).

    RATE_LIMIT_PER_MINUTE <= 0 desliga o rate limit em toda a aplicação (ambiente de teste).
    """
    try:
        if int(os.getenv("RATE_LIMIT_PER_MINUTE", "60")) <= 0:
            return False
    except ValueError:
        pass
    now = time.monotonic()
    _cleanup(now)
    bucket = _requests[key]
    bucket[:] = [t for t in bucket if t > now - window_seconds]
    if len(bucket) >= limit:
        return True
    bucket.append(now)
    return False


def client_ip(request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded and os.getenv("ENVIRONMENT", "development").lower() == "production":
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def global_rate_limited(request) -> bool:
    """Limite global por IP para requisições /api/* sem token (mitiga brute-force e DoS).

    Configurável via RATE_LIMIT_PER_MINUTE (0 desliga o limite, ex.: ambiente de teste).
    """
    try:
        limit = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    except ValueError:
        limit = 60
    if limit <= 0:
        return False
    return is_rate_limited(f"global:{client_ip(request)}", limit=limit, window_seconds=60)
