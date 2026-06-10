from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status

from ..config import settings
from ..models.auth import AuthStatus, LoginIn
from ..rate_limit import limiter
from ..security import (
    COOKIE_NAME,
    clear_auth_cookie,
    create_token,
    decode_token,
    get_current_admin,
    set_auth_cookie,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=AuthStatus)
@limiter.limit("5/minute")
async def login(request: Request, response: Response, payload: LoginIn):
    valid = (
        payload.email.lower() == settings.admin_email.lower()
        and verify_password(payload.password, settings.admin_password_hash)
    )
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    token = create_token(settings.admin_email)
    set_auth_cookie(response, token)
    return AuthStatus(authenticated=True, email=settings.admin_email)


@router.post("/logout")
async def logout(response: Response, _admin: str = Depends(get_current_admin)):
    clear_auth_cookie(response)
    return {"ok": True}


@router.get("/me", response_model=AuthStatus)
async def me(session: str | None = Cookie(default=None, alias=COOKIE_NAME)):
    """Report current auth status without raising (for the admin UI gate)."""
    if session:
        payload = decode_token(session)
        if payload and payload.get("sub") == settings.admin_email:
            return AuthStatus(authenticated=True, email=payload["sub"])
    return AuthStatus(authenticated=False)
