"""Harness de teste do backend — banco SQLite temporário isolado.

DATABASE_URL e SECRET_KEY de teste são definidos ANTES de qualquer import do app,
para que `app.database` crie o engine sobre o banco temporário e nunca toque
no banco real (escola.db) nem nas credenciais do .env.
"""
import os
import tempfile
from pathlib import Path

_TMP_DIR = Path(tempfile.mkdtemp(prefix="gestao_escolar_test_"))
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DIR / 'test.db'}"
os.environ["SECRET_KEY"] = "chave-de-teste-sprintx-9f8e7d6c5b4a321098"
os.environ["ENVIRONMENT"] = "test"
os.environ["CORS_ORIGINS"] = "http://testserver"
os.environ["RATE_LIMIT_PER_MINUTE"] = "0"  # rate limit global desligado na suíte (testado isoladamente)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

pytest_plugins = ["tests.fixtures"]


@pytest.fixture()
def client():
    """TestClient com lifespan (create_all + seed) sobre o banco temporário."""
    with TestClient(app) as c:
        yield c