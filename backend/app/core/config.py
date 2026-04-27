from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str
    DATABASE_URL_SYNC: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS — acepta JSON list o string separado por comas
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            # Si es JSON, intenta parsearlo; si no, divide por comas
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()