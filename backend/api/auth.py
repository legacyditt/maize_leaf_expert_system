"""Autentikasi Admin berbasis HMAC-SHA256 Bearer token untuk FastAPI."""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time

from fastapi import Header, HTTPException, status

_DEFAULT_USERNAME = "admin"
_DEFAULT_PASSWORD = "admin123"
_TOKEN_TTL_SECONDS = 60 * 60 * 12  # 12 jam
_SIGNING_SECRET = os.environ.get("MAIZE_AUTH_SECRET", secrets.token_hex(32)).encode("utf-8")


def get_admin_username() -> str:
    """Mengembalikan username Admin dari env `MAIZE_ADMIN_USERNAME` atau default lokal."""
    return os.environ.get("MAIZE_ADMIN_USERNAME", _DEFAULT_USERNAME)


def get_admin_password() -> str:
    """Mengembalikan password Admin dari env `MAIZE_ADMIN_PASSWORD` atau default lokal."""
    return os.environ.get("MAIZE_ADMIN_PASSWORD", _DEFAULT_PASSWORD)


def verify_admin_password(password: str) -> bool:
    """Memverifikasi password dengan perbandingan konstan waktu."""
    expected = get_admin_password().encode("utf-8")
    return hmac.compare_digest(password.encode("utf-8"), expected)


def verify_admin_credentials(username: str, password: str) -> bool:
    """Memverifikasi username dan password Admin dengan perbandingan konstan waktu."""
    expected_user = get_admin_username().encode("utf-8")
    user_ok = hmac.compare_digest(username.strip().encode("utf-8"), expected_user)
    pass_ok = verify_admin_password(password)
    return user_ok and pass_ok


def create_access_token(role: str = "admin") -> str:
    """Membuat token Bearer bertanda tangan HMAC dengan waktu kedaluwarsa."""
    payload = {"role": role, "exp": int(time.time()) + _TOKEN_TTL_SECONDS}
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("ascii")
    sig = hmac.new(_SIGNING_SECRET, encoded.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{encoded}.{sig}"


def verify_access_token(token: str) -> dict[str, object]:
    """Memvalidasi tanda tangan dan masa berlaku token Bearer."""
    if "." not in token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid")

    encoded, sig = token.split(".", 1)
    expected_sig = hmac.new(_SIGNING_SECRET, encoded.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected_sig):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tanda tangan token tidak valid")

    try:
        payload = json.loads(base64.urlsafe_b64decode(encoded.encode("ascii")).decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Payload token rusak") from exc

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesi login berakhir")
    return payload


def require_admin(authorization: str | None = Header(default=None)) -> dict[str, object]:
    """Dependency FastAPI untuk melindungi endpoint Admin."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autentikasi Admin diperlukan",
        )
    token = authorization.removeprefix("Bearer ").strip()
    payload = verify_access_token(token)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Akses ditolak")
    return payload

