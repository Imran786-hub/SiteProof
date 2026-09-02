import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.all_models import User, Organization, AccountToken, AuditLog
from app.schemas.all_schemas import (
    LoginRequest,
    TokenResponse,
    InitAdminRequest,
    ActivateAccountRequest
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)

router = APIRouter(tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not activated. Please activate via your setup link."
        )

    claims = {
        "sub": user.id,
        "userId": user.id,
        "email": user.email,
        "role": user.role,
        "organizationId": user.organization_id,
        "name": user.name
    }

    access_token = create_access_token(claims)
    refresh_token = create_refresh_token(claims)

    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "organizationId": user.organization_id
        }
    }

@router.post("/refresh")
def refresh_token(refreshToken: str, db: Session = Depends(get_db)):
    payload = decode_token(refreshToken)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    
    user_id = payload.get("sub") or payload.get("userId")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found")

    claims = {
        "sub": user.id,
        "userId": user.id,
        "email": user.email,
        "role": user.role,
        "organizationId": user.organization_id,
        "name": user.name
    }
    new_access = create_access_token(claims)
    return {"accessToken": new_access}

@router.post("/admin/init")
def init_admin(request: InitAdminRequest, db: Session = Depends(get_db)):
    # Check if admin already exists
    existing_org = db.query(Organization).filter(Organization.email == request.adminEmail).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="Organization or Admin email already initialized")

    org = Organization(
        name=request.orgName,
        email=request.adminEmail,
        organization_type="DEPARTMENT",
        is_active=True
    )
    db.add(org)
    db.flush()

    admin = User(
        organization_id=org.id,
        name=request.adminName,
        email=request.adminEmail,
        password_hash=get_password_hash(request.adminPassword),
        role="DEPARTMENT_ADMIN",
        is_active=True,
        email_verified=True
    )
    db.add(admin)
    db.commit()

    return {
        "message": "Organization and Admin account initialized successfully",
        "organizationId": org.id,
        "adminId": admin.id
    }

@router.post("/activate")
def activate_account(request: ActivateAccountRequest, db: Session = Depends(get_db)):
    # Find valid token
    token_record = db.query(AccountToken).filter(
        AccountToken.token_hash == request.token,
        AccountToken.token_type == "ACCOUNT_ACTIVATION",
        AccountToken.used_at == None,
        AccountToken.expires_at > datetime.utcnow()
    ).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid, expired, or used activation token")

    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = get_password_hash(request.password)
    user.is_active = True
    user.email_verified = True
    token_record.used_at = datetime.utcnow()

    db.commit()
    return {"message": "Account activated successfully. You can now login."}
