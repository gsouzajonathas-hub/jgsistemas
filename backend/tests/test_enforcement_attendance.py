"""T-03.06 (super-admin-master, D-03): enforcement real do modulo attendance."""


async def test_teacher_sem_attendance_recebe_403(client, headers_com_permissoes):
    headers = await headers_com_permissoes("teacher", [])
    resp = client.get("/api/attendance", headers=headers)
    assert resp.status_code == 403, resp.text


async def test_teacher_com_attendance_acessa_get(client, headers_com_permissoes):
    headers = await headers_com_permissoes("teacher", ["attendance"])
    resp = client.get("/api/attendance", headers=headers)
    assert resp.status_code == 200, resp.text


def test_super_admin_sempre_acessa_attendance(client, super_admin_headers):
    resp = client.get("/api/attendance", headers=super_admin_headers)
    assert resp.status_code == 200, resp.text


async def test_teacher_sem_attendance_recebe_403_no_bulk(client, headers_com_permissoes):
    headers = await headers_com_permissoes("teacher", [])
    resp = client.post("/api/attendance/bulk", json={"class_group_id": 1, "date": "2026-09-05", "records": []}, headers=headers)
    assert resp.status_code == 403, resp.text
