from dotenv import load_dotenv
from pathlib import Path

_BACKEND_DIR = Path(__file__).resolve().parent.parent


def load_env():
    """Carrega o .env do backend antes de qualquer leitura de variáveis de ambiente."""
    load_dotenv(_BACKEND_DIR / ".env")
