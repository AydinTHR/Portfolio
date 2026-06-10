from pydantic import BaseModel, EmailStr


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthStatus(BaseModel):
    authenticated: bool
    email: str | None = None
