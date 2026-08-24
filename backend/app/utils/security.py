import time
from collections import defaultdict

_requests = defaultdict(list)


def _cleanup(now: float):
    for key in list(_requests.keys()):
        _requests[key] = [t for t in _requests[key] if t > now - 3600]
        if not _requests[key]:
            del _requests[key]


def is_rate_limited(key: str, limit: int, window_seconds: float) -> bool:
    """Sliding-window limiter em memória por chave (ex.: IP)."""
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
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"
