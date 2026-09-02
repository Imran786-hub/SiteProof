import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.database.session import engine, Base
from app.api.v1 import (
    auth as auth_router,
    engineers as engineers_router,
    projects as projects_router,
    evidence as evidence_router,
    suspicious as suspicious_router,
    reports as reports_router,
    dashboard as dashboard_router
)

# Auto-create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SiteProof AI — AI-Powered Construction Site Evidence Verification Platform"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static Uploads directory for image serving
uploads_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Health check
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "SiteProof AI FastAPI Backend", "version": settings.VERSION}

# Register API Routers under /api/v1 and /api/auth
app.include_router(auth_router.router, prefix="/api/auth")
app.include_router(auth_router.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api/v1/auth")

app.include_router(engineers_router.router, prefix="/api/v1")
app.include_router(projects_router.router, prefix="/api/v1")
app.include_router(evidence_router.router, prefix="/api/v1")
app.include_router(suspicious_router.router, prefix="/api/v1")
app.include_router(reports_router.router, prefix="/api/v1")
app.include_router(dashboard_router.router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
