import re
import unicodedata


def crc16(payload: str) -> str:
    crc = 0xFFFF
    for ch in payload.encode("utf-8"):
        crc ^= ch << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return f"{crc:04X}"


def _field(fid: str, value: str) -> str:
    return f"{fid}{len(value):02d}{value}"


def _clean(text: str, limit: int) -> str:
    text = unicodedata.normalize("NFKD", str(text or "")).encode("ascii", "ignore").decode()
    text = re.sub(r"[^A-Za-z0-9 ]", "", text).strip().upper()
    return text[:limit]


def build_pix_payload(key: str, merchant_name: str, merchant_city: str,
                      amount=None, txid: str = "***") -> str:
    key = (key or "").strip()[:77]
    gui = _field("00", "br.gov.bcb.pix") + _field("01", key)
    payload = (
        _field("00", "01")
        + _field("26", gui)
        + _field("52", "0000")
        + _field("53", "986")
    )
    if amount is not None and float(amount) > 0:
        payload += _field("54", f"{float(amount):.2f}")
    payload += (
        _field("58", "BR")
        + _field("59", _clean(merchant_name, 25) or "ESCOLA")
        + _field("60", _clean(merchant_city, 15) or "BRASIL")
        + _field("62", _field("05", (txid or "***")[:25]))
        + "6304"
    )
    return payload + crc16(payload)


def pix_city_from_address(address: str) -> str:
    addr = (address or "").strip()
    if not addr:
        return ""
    parts = [p.strip() for p in addr.split(",")]
    city = parts[-1]
    city = re.sub(r"-\s*[A-Z]{2}\s*$", "", city).strip()
    if not city or len(city) > 15 or "/" in city or "@" in city:
        return ""
    return city
