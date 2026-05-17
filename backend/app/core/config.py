from functools import lru_cache
from typing import Literal, Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Nexus LearnAI API"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    jwt_secret_key: str = Field(
        default="dev-only-change-me-16chars",
        min_length=16,
        alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14

    database_url: str = Field(
        default="postgresql+asyncpg://nexus:nexus@localhost:5432/nexus_learnai",
        alias="DATABASE_URL",
    )

    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    celery_broker_url: str | None = Field(default=None, alias="CELERY_BROKER_URL")
    celery_result_backend: str | None = Field(default=None, alias="CELERY_RESULT_BACKEND")

    cors_origins: Any = Field(default=["http://localhost:3000"], alias="CORS_ORIGINS")

    sqlite_fallback_url: str | None = Field(default=None, alias="SQLITE_FALLBACK_URL")

    nexus_cpp_module_enabled: bool = Field(default=False, alias="NEXUS_CPP_MODULE_ENABLED")
    onnx_models_path: str = Field(default="../ai-models/onnx", alias="ONNX_MODELS_PATH")
    embeddings_dim: int = Field(default=384, alias="EMBEDDINGS_DIM")

    # Gemini AI
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.0-flash", alias="GEMINI_MODEL")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_cors(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @property
    def celery_broker(self) -> str:
        return self.celery_broker_url or self.redis_url

    @property
    def celery_backend(self) -> str:
        return self.celery_result_backend or self.redis_url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
