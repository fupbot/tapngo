from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = f"sqlite:///{BACKEND_DIR / 'tapngo.db'}"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost"]

    # Kiosk timing (seconds) — mirrors ARCHITECTURE_DECISIONS.md
    order_preparing_after_seconds: float = 4
    order_completed_after_seconds: float = 8


settings = Settings()
