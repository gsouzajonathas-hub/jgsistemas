import os
import uuid

from fastapi import HTTPException, UploadFile

MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB

# Extensões e MIME types aceitos (bloqueia HTML/SVG/JS => XSS)
ALLOWED_MIMES = {
    ".png": {"image/png"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".gif": {"image/gif"},
    ".webp": {"image/webp"},
    ".pdf": {"application/pdf"},
    ".doc": {"application/msword"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".xls": {"application/vnd.ms-excel"},
    ".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
    ".csv": {"text/csv"},
}

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}

# Assinaturas (magic bytes) para verificação de conteúdo real
_MAGIC = {
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".jpg": (b"\xff\xd8\xff",),
    ".jpeg": (b"\xff\xd8\xff",),
    ".gif": (b"GIF8",),
    ".pdf": (b"%PDF",),
}


def _content_matches(ext: str, content: bytes) -> bool:
    magic_list = _MAGIC.get(ext)
    if not magic_list:
        return True  # sem assinatura confiável (office/csv), validado por extensão/MIME
    return content[:16].startswith(magic_list[0]) or content[:16] in magic_list


async def validate_and_save(file: UploadFile, allowed_exts: set = None) -> tuple:
    """Valida extensão, MIME, tamanho e conteúdo; retorna (nome_arquivo, conteúdo)."""
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower() or ".bin"
    allowed_exts = allowed_exts or set(ALLOWED_MIMES.keys())

    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Tipo de arquivo não permitido: {ext}")

    declared_mime = (file.content_type or "").lower().split(";")[0].strip()
    if ext in ALLOWED_MIMES and declared_mime not in ALLOWED_MIMES[ext]:
        raise HTTPException(
            status_code=400,
            detail=f"Conteúdo do arquivo não corresponde à extensão ({declared_mime or 'desconhecido'})",
        )

    content = await file.read(MAX_UPLOAD_SIZE + 1)
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Arquivo excede o tamanho máximo de 5 MB")

    if not _content_matches(ext, content):
        raise HTTPException(status_code=400, detail="Conteúdo do arquivo inválido ou corrompido")

    safe_name = f"{uuid.uuid4().hex}{ext}"
    return safe_name, content
