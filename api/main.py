"""Entry point server FastAPI untuk MaizeCare AI."""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from api.auth import create_access_token, verify_admin_password
from api.routes_admin import router as admin_router
from api.routes_diagnosis import router as diagnosis_router
from api.schemas import LoginRequest, LoginResponse


def create_app() -> FastAPI:
    """Factory FastAPI app dengan CORS, healthcheck, auth, dan router domain."""
    app = FastAPI(
        title="MaizeCare AI API",
        version="1.0.0",
        description="Backend FastAPI untuk klasifikasi CNN daun jagung dan sistem pakar CF.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/api/auth/login", response_model=LoginResponse, tags=["auth"])
    def admin_login(payload: LoginRequest) -> LoginResponse:
        if not verify_admin_password(payload.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password Admin salah",
            )
        return LoginResponse(access_token=create_access_token(role="admin"))

    app.include_router(diagnosis_router)
    app.include_router(admin_router)
    return app


app = create_app()

