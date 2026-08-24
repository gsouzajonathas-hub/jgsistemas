import os
from app.config import load_env

load_env()

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))


def get_data_dir() -> str:
    data_dir = os.getenv("DATA_DIR", "").strip()
    if data_dir:
        return os.path.abspath(data_dir)
    return os.path.abspath(_BACKEND_DIR)


def get_upload_dir() -> str:
    upload_dir = os.getenv("UPLOAD_DIR", "").strip()
    if upload_dir:
        return os.path.abspath(upload_dir)
    return os.path.abspath(os.path.join(_BACKEND_DIR, "uploads"))


def get_upload_path(url: str) -> str:
    """Converte uma URL /uploads/arquivo.png no caminho físico do arquivo."""
    name = url.lstrip("/").replace("uploads/", "", 1)
    return os.path.join(get_upload_dir(), os.path.basename(name))


def get_student_files_dir() -> str:
    """Diretório privado (fora do StaticFiles público) para documentos de alunos."""
    return os.path.abspath(os.path.join(get_data_dir(), "student_files"))
