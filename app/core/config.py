from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://app_user:changeme@localhost:5432/template_app"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    CORS_ORIGINS: Annotated[list[str], NoDecode] = ["http://localhost:3000"]

    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    API_BASE_URL: str = "http://localhost:8000"
    AUTH_RATE_LIMIT: str = "20/minute"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            stripped = v.strip()
            if stripped.startswith("["):
                import json

                parsed: list[str] = json.loads(stripped)
                return parsed
            return [item.strip() for item in stripped.split(",") if item.strip()]
        return v

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


settings = Settings()
