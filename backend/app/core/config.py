from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve to backend/.env regardless of the working directory uvicorn is
# launched from.  __file__ → core/config.py → parent² = backend/
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    app_name: str = "NagarSetu API"
    environment: str = "development"
    frontend_origin: str = "http://localhost:5173"
    database_url: str
    gemini_api_key: str | None = None

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
