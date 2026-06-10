import datetime as dt

import jwt
from argon2 import PasswordHasher
from fastapi import Cookie, HTTPException, Response, status

from .config import settings

_ph = PasswordHasher()

COOKIE_NAME = "portfolio_session"
_ALGORITHM = "HS256"


# ---- Password hashing ----
def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return _ph.verify(hashed, password)
    except Exception:
        # Any verification error (mismatch, malformed hash) => auth fails.
        return False


# ---- JWT ----
def create_token(email: str) -> str:
    now = dt.datetime.now(dt.UTC)
    payload = {
        "sub": email,
        "iat": now,
        "exp": now + dt.timedelta(hours=settings.jwt_expire_hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        return None


# ---- Cookies ----
def _cookie_secure() -> bool:
    # SameSite=None requires Secure; production should always be Secure.
    return settings.is_production or settings.cookie_samesite.lower() == "none"


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=_cookie_secure(),
        samesite=settings.cookie_samesite.lower(),
        max_age=settings.jwt_expire_hours * 3600,
        domain=settings.cookie_domain or None,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        COOKIE_NAME,
        domain=settings.cookie_domain or None,
        path="/",
    )


# ---- Dependency ----
def get_current_admin(
    session: str | None = Cookie(default=None, alias=COOKIE_NAME),
) -> str:
    """Guard admin-only routes. Returns the admin email or raises 401."""
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )
    payload = decode_token(session)
    if not payload or payload.get("sub") != settings.admin_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session"
        )
    return payload["sub"]
