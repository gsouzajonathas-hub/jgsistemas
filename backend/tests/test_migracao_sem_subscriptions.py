"""D-13 + auditoria: "subscriptions" não aparece na migração e as 4 tabelas
reativadas (agora com model) são migradas normalmente."""

from pathlib import Path
import importlib.util

_MIGRATE = Path(__file__).resolve().parents[1] / "scripts" / "migrate_sqlite_to_postgres.py"


def _load_migrate_module():
    spec = importlib.util.spec_from_file_location("migrate_sqlite_to_postgres", _MIGRATE)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_migracao_nao_cita_subscriptions():
    content = _MIGRATE.read_text(encoding="utf-8")
    assert "subscriptions" not in content.lower()


def test_tabelas_reativadas_sao_migradas():
    mod = _load_migrate_module()
    for table in ["attendances", "evaluations", "certificates", "grade_weight_configs"]:
        assert table in mod.TABELAS_COM_MODELO, f"{table} deveria estar entre as tabelas com modelo"
    assert "subscriptions" not in mod.TABELAS_COM_MODELO
    assert "subscriptions" not in mod.TABELAS_ORFAS