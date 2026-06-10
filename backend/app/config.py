from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
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

    # Resend email
    resend_api_key: str = ""
    contact_from_email: str = "Portfolio <onboarding@resend.dev>"
    contact_to_email: str = ""

    # Analytics
    analytics_salt: str = "dev-salt-change-me"

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
