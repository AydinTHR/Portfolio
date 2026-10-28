import logging
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger("portfolio.config")

# Placeholder secrets that ship with the code or .env.example. Anyone can read
# them, so a production server must never sign sessions with one.
_PLACEHOLDER_JWT_SECRETS = {"dev-insecure-secret-change-me", "change-me-to-a-long-random-string"}
_PLACEHOLDER_SALTS = {"dev-salt-change-me", "change-me-to-a-random-string"}
# HS256 keys should be at least 256 bits (RFC 7518, section 3.2).
_MIN_JWT_SECRET_LENGTH = 32


class Settings(BaseSettings):
    """Application settings, loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        # Settings carry secrets; keep their values out of startup errors and logs.
        hide_input_in_errors=True,
    )

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    db_name: str = "portfolio"

    # Admin auth (single admin)
    admin_email: str = "admin@example.com"
    admin_password_hash: str = ""
    jwt_secret: str = "dev-insecure-secret-change-me"
    jwt_expire_hours: int = 12

    # Environment / cookies
    environment: str = "development"
    cookie_domain: str = ""
    cookie_samesite: str = "lax"  # "lax" | "strict" | "none" (none requires HTTPS)

    # CORS
    frontend_origin: str = "http://localhost:5173"

    # Header holding the visitor's IP, set by the proxy in front of the API
    # (e.g. "CF-Connecting-IP" on Render). Blank uses the connecting address.
    client_ip_header: str = ""

    # Resend email
    resend_api_key: str = ""
    contact_from_email: str = "Portfolio <onboarding@resend.dev>"
    contact_to_email: str = ""

    # Analytics
    analytics_salt: str = "dev-salt-change-me"

    @model_validator(mode="after")
    def _refuse_insecure_production(self) -> "Settings":
        if not self.is_production:
            return self
        if (
            self.jwt_secret in _PLACEHOLDER_JWT_SECRETS
            or len(self.jwt_secret) < _MIN_JWT_SECRET_LENGTH
        ):
            raise ValueError(
                "JWT_SECRET must be set to a random string of at least "
                f"{_MIN_JWT_SECRET_LENGTH} characters in production; a known or short "
                "secret lets anyone forge an admin session."
            )
        if self.analytics_salt in _PLACEHOLDER_SALTS:
            logger.warning("ANALYTICS_SALT is a placeholder; set a random value.")
        return self

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
