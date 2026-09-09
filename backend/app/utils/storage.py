"""Abstração de armazenamento de arquivos.

Dois backends selecionados via variáveis de ambiente:

  * **Supabase Storage** — ativado quando ``SUPABASE_URL`` e
    ``SUPABASE_SERVICE_ROLE_KEY`` estão definidas (ambas). Usa a service_role key
    no servidor para criar buckets e fazer upload/download/remoção. Referências
    ficam no formato ``supabase://<bucket>/<object_path>``.

  * **Disco local** — backend padrão (fallback seguro). Quando o Supabase não
    está configurado, o comportamento é **byte-idêntico ao anterior**: a logo vai
    para ``UPLOAD_DIR`` e os documentos de alunos para ``get_student_files_dir()``.
    Referências mantêm os formatos legados (``/uploads/<file>`` e ``private:<file>``).

As referências persistidas no banco são **estáveis e resolvidas em tempo de
leitura conforme o backend ativo**, então linhas existentes não precisam de
migração de dados. Exceção: novas escritas no modo Supabase gravam
``supabase://<bucket>/<object_path>`` para serem localizáveis; no modo local
gravam o formato legado para manter compatibilidade total com o que já está no
banco e com checks de diretório existentes.
"""
import os

from app.config import load_env

load_env()


def supabase_url() -> str:
    return (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")


def service_role_key() -> str:
    return (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()


def is_supabase_enabled() -> bool:
    return bool(supabase_url() and service_role_key())


# ---------------------------------------------------------------------------
# Buckets
# ---------------------------------------------------------------------------
BUCKET_LOGOS = "logos"                 # público — logo da escola
BUCKET_UPLOADS = "uploads"             # público — conteúdo de /uploads (carnês etc.)
BUCKET_STUDENT_FILES = "student-files" # privado — documentos de alunos


# ---------------------------------------------------------------------------
# Cliente lazy
# ---------------------------------------------------------------------------
_client = None


def get_client():
    global _client
    if _client is None:
        from supabase import create_client
        _client = create_client(supabase_url(), service_role_key())
    return _client


def _storage():
    return get_client().storage


# ---------------------------------------------------------------------------
# Buckets idempotentes
# ---------------------------------------------------------------------------
def ensure_buckets() -> dict:
    if not is_supabase_enabled():
        return {"enabled": False, "note": "Supabase Storage não configurado; usando disco local"}
    storage = _storage()
    result = {}
    for name, opts in {
        BUCKET_LOGOS: {"public": True},
        BUCKET_UPLOADS: {"public": True},
        BUCKET_STUDENT_FILES: {"public": False},
    }.items():
        try:
            storage.create_bucket(name, options=opts)
            result[name] = "created"
        except Exception as e:
            import logging
            if getattr(e, "statusCode", None) == 409:
                result[name] = "exists"
            else:
                logging.getLogger(__name__).warning("Falha ao criar bucket '%s': %s", name, e)
                result[name] = "exists"
    return {"enabled": True, "buckets": result}


# ---------------------------------------------------------------------------
# Referências
# ---------------------------------------------------------------------------
def supabase_ref(bucket: str, object_path: str) -> str:
    return f"supabase://{bucket}/{object_path.lstrip('/')}"


def is_supabase_ref(ref: str) -> bool:
    return bool(ref) and ref.startswith("supabase://")


def parse_ref(ref: str):
    """Retorna (bucket, object_path) para refs do Supabase; senão (None, path legado)."""
    if is_supabase_ref(ref):
        rest = ref[len("supabase://"):]
        bucket, _, path = rest.partition("/")
        return bucket, path
    return None, (ref or "")


def _safe_local_path_for(relative_path: str) -> str:
    from app.utils.paths import get_upload_dir
    base = os.path.abspath(get_upload_dir())
    path = os.path.abspath(os.path.join(base, relative_path.lstrip("/").replace("\\", "/")))
    if not (path.startswith(base + os.sep) or path == base):
        raise ValueError("Caminho de arquivo inválido (fora do diretório de uploads)")
    return path


# ---------------------------------------------------------------------------
# Funções de escrita/leitura/remoção
# ---------------------------------------------------------------------------
def save_bytes_legacy(content: bytes, filename: str, content_type: str = "application/octet-stream") -> str:
    """Salva em disco (UPLOAD_DIR) e retorna a referência legada ``/uploads/<file>``.

    Usado no modo local — mantém 100% do comportamento anterior do `/logo`.
    """
    from app.utils.paths import get_upload_dir
    filepath = os.path.join(get_upload_dir(), filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(content)
    return f"/uploads/{filename}"


def save_bytes(bucket: str, object_path: str, content: bytes, content_type: str = "application/octet-stream") -> str:
    """Persiste bytes no backend ativo e retorna a referência estável armazenada."""
    object_path = object_path.lstrip("/")
    if is_supabase_enabled():
        try:
            _storage().from_(bucket).upload(
                file=content,
                path=object_path,
                file_options={"content-type": content_type, "cache-control": "3600", "upsert": "true"},
            )
        except Exception:
            try:
                _storage().from_(bucket).remove([object_path])
            except Exception:
                pass
            _storage().from_(bucket).upload(
                file=content,
                path=object_path,
                file_options={"content-type": content_type, "cache-control": "3600", "upsert": "true"},
            )
        return supabase_ref(bucket, object_path)

    # Disco local: mantém o comportamento legado de escrita.
    if bucket == BUCKET_STUDENT_FILES:
        from app.utils.paths import get_student_files_dir
        filepath = os.path.join(get_student_files_dir(), object_path)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "wb") as f:
            f.write(content)
        return f"private:{object_path}"
    return save_bytes_legacy(content, object_path, content_type)


def read_bytes(ref: str) -> bytes:
    """Lê bytes a partir de qualquer formato de referência (Supabase ou legado local)."""
    bucket, path = parse_ref(ref)
    if is_supabase_ref(ref):
        return _storage().from_(bucket).download(path)
    filepath = _local_path_for_legacy(ref)
    with open(filepath, "rb") as f:
        return f.read()


def _local_path_for_legacy(ref: str) -> str:
    """Converte referência legada (``/uploads/x``, ``private:x`` ou caminho simples)
    para o caminho físico atual no disco."""
    from app.utils.paths import get_upload_dir, get_student_files_dir, get_upload_path
    if ref.startswith("private:"):
        name = ref[len("private:"):]
        return os.path.join(get_student_files_dir(), os.path.basename(name))
    if ref.startswith("/uploads/"):
        return get_upload_path(ref)
    if ref.startswith("uploads/"):
        return os.path.join(get_upload_dir(), os.path.basename(ref))
    return _safe_local_path_for(ref)


def exists(ref: str) -> bool:
    if is_supabase_ref(ref):
        bucket, path = parse_ref(ref)
        try:
            _storage().from_(bucket).download(path)
            return True
        except Exception:
            return False
    return os.path.exists(_local_path_for_legacy(ref))


def delete(ref: str) -> None:
    bucket, path = parse_ref(ref)
    if is_supabase_ref(ref):
        try:
            _storage().from_(bucket).remove([path])
        except Exception:
            pass
        return
    filepath = _local_path_for_legacy(ref)
    if os.path.exists(filepath):
        os.remove(filepath)


def public_url(bucket: str, object_path: str):
    if is_supabase_enabled():
        try:
            return _storage().from_(bucket).get_public_url(object_path.lstrip("/"), {})
        except Exception:
            return None
    return None


def resolve_public_url(ref: str):
    if is_supabase_ref(ref):
        bucket, path = parse_ref(ref)
        return public_url(bucket, path)
    return None


def download_to_tempfile(ref: str, suffix: str = ".tmp") -> str:
    """Baixa para arquivo temporário para libs que exigem caminho (reportlab/Pillow)."""
    import tempfile
    content = read_bytes(ref)
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(content)
    return path


# ---------------------------------------------------------------------------
# Logo (fluentes entre frontend e PDFs)
# ---------------------------------------------------------------------------
def display_url(ref: str) -> str:
    """URL utilizável pelo navegador para exibir um arquivo.

    * Local: devolve a própria referência (ex.: ``/uploads/x.png``), servida pelo
      StaticFiles local e pelo proxy Vercel -> Render.
    * Supabase (bucket público): devolve a URL pública do CDN.
    """
    if is_supabase_ref(ref):
        bucket, path = parse_ref(ref)
        url = public_url(bucket, path)
        if url:
            return url
    return ref


def download_logo(logo_url: str) -> str:
    """Baixa a logo da escola para um arquivo temporário, pronta para
    reportlab/Pillow. Aceita referência local (``/uploads/x``), ref Supabase
    (``supabase://...``) ou URL pública (https:// do CDN). Retorna caminho
    temporário — o chamador deve removê-lo com ``os.remove``. Retorna None se
    não houver logo ou falhar."""
    if not logo_url:
        return None
    import tempfile
    try:
        if is_supabase_ref(logo_url):
            content = _storage().from_("logos").download(logo_url[len("supabase://logos/"):])
        elif logo_url.startswith(("http://", "https://")):
            import httpx
            content = httpx.get(logo_url, timeout=15).content
        else:
            content = read_bytes(logo_url)
        fd, path = tempfile.mkstemp(suffix=".png")
        with os.fdopen(fd, "wb") as f:
            f.write(content)
        return path
    except Exception:
        return None
