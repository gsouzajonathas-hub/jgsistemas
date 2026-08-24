import os
import httpx


async def send_whatsapp(phone: str, message: str) -> dict:
    instance_url = os.getenv("ZAPI_INSTANCE_URL", "")
    token = os.getenv("ZAPI_TOKEN", "")

    if not instance_url or not token:
        return {"success": False, "error": "Configuração Z-API não encontrada. Verifique ZAPI_INSTANCE_URL e ZAPI_TOKEN no .env"}

    clean_phone = "".join(c for c in phone if c.isdigit())

    if clean_phone.startswith("55") and len(clean_phone) > 12:
        pass
    elif len(clean_phone) <= 11:
        clean_phone = "55" + clean_phone

    url = f"{instance_url.rstrip('/')}/send-text"
    headers = {"Client-Token": token, "Content-Type": "application/json"}
    payload = {"phone": clean_phone, "message": message}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload, headers=headers)
            data = resp.json()

            if resp.status_code in (200, 201) and data.get("status") != "error":
                return {"success": True, "error": None, "provider_id": data.get("id")}
            else:
                error_msg = data.get("message") or data.get("error") or str(data)
                return {"success": False, "error": f"Z-API: {error_msg}"}
    except Exception as e:
        return {"success": False, "error": str(e)}
