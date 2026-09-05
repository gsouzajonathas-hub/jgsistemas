"""Testes de fumaça das fixtures compartilhadas (T-01.01).

Garantem que as três fixtures exportadas por tests/fixtures.py produzem
objetos/valores no formato esperado pelos handlers:
- settings_com_pix: SchoolSettings com .pix_key preenchida
- material_sale_ctx: contexto com MaterialSale com .id e material/student vinculados
- valores_super_admin: dict de credenciais do Super Admin suporte

`client` é declarado para disparar o lifespan (create_all) do banco temporário,
mesmo padrão de test_fixtures_demo.py.
"""
import pytest

from tests.fixtures import settings_com_pix, material_sale_ctx, valores_super_admin  # noqa: F401


@pytest.mark.asyncio
async def test_fixture_settings_com_pix(client, settings_com_pix):
    assert settings_com_pix.pix_key
    assert settings_com_pix.id is not None


@pytest.mark.asyncio
async def test_fixture_material_sale_ctx(client, material_sale_ctx):
    assert material_sale_ctx.sale.id is not None
    assert material_sale_ctx.material.id is not None
    assert material_sale_ctx.student.id is not None


def test_fixture_valores_super_admin(client, valores_super_admin):
    assert valores_super_admin["email"]
    assert valores_super_admin["password"]
    assert valores_super_admin["name"]