from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    message: str = Field(min_length=1, max_length=5000)
    # Honeypot: real users never see/fill this. Non-empty => treat as spam.
    website: str = ""


class MessageOut(BaseModel):
    id: str
    name: str
    email: str
    message: str
    created_at: datetime
    read: bool = False


class MessageUpdate(BaseModel):
    read: bool
