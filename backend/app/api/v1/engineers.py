import secrets
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.all_models import User, AccountToken, ProjectEngineer, AuditLog
from app.schemas.all_schemas import CreateEngineerRequest, EngineerResponse
from app.core.security import require_admin

router = APIRouter(prefix="/engineers", tags=["Engineers"])

@router.get("", response_model=List[EngineerResponse])
def get_engineers(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    engineers = db.query(User).filter(
        User.organization_id == admin.organization_id,
        User.role == "ENGINEER"
    ).all()

    result = []
    for eng in engineers:
        count = db.query(ProjectEngineer).filter(
            ProjectEngineer.engineer_id == eng.id,
            ProjectEngineer.is_active == True
        ).count()
        result.append(EngineerResponse(
            id=eng.id,
            name=eng.name,
            email=eng.email,
            phone=eng.phone,
            employeeId=eng.employee_id,
            designation=eng.designation,
            isActive=eng.is_active,
            emailVerified=eng.email_verified,
            assignedProjectCount=count,
            createdAt=eng.created_at
        ))
    return result

@router.post("", status_code=status.HTTP_201_CREATED)
def create_engineer(
    request: CreateEngineerRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Check if engineer email already exists in org
    existing = db.query(User).filter(
        User.organization_id == admin.organization_id,
        User.email == request.email
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Engineer with this email already exists in your organization")

    engineer = User(
        organization_id=admin.organization_id,
        name=request.name,
        email=request.email,
        phone=request.phone,
        employee_id=request.employeeId,
        designation=request.designation,
        role="ENGINEER",
        is_active=False,
        email_verified=False
    )
    db.add(engineer)
    db.flush()

    # Generate single-use activation token
    token = secrets.token_urlsafe(32)
    token_record = AccountToken(
        user_id=engineer.id,
        token_hash=token,
        token_type="ACCOUNT_ACTIVATION",
        expires_at=datetime.utcnow() + timedelta(days=2)
    )
    db.add(token_record)

    # Log action
    db.add(AuditLog(
        organization_id=admin.organization_id,
        user_id=admin.id,
        action="ENGINEER_CREATED",
        resource_type="USER",
        resource_id=engineer.id,
        extra_metadata={"name": engineer.name, "email": engineer.email}
    ))

    db.commit()

    activation_url = f"http://localhost:3000/activate?token={token}"

    return {
        "message": "Engineer created successfully",
        "engineerId": engineer.id,
        "activationToken": token,
        "activationUrl": activation_url
    }

@router.put("/{engineer_id}/toggle-status")
def toggle_engineer_status(
    engineer_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    engineer = db.query(User).filter(
        User.id == engineer_id,
        User.organization_id == admin.organization_id
    ).first()
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")

    engineer.is_active = not engineer.is_active
    db.commit()
    return {"message": "Status updated", "isActive": engineer.is_active}
