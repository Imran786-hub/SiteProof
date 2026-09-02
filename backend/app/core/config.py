import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "SiteProof AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "siteproof_ai_super_secret_jwt_key_2026_change_in_prod")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours for dev ease
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./siteproof_ai.db")
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

settings = Settings()
