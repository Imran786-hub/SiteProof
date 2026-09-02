from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.all_models import User, SuspiciousEvent, SiteEvidence, Project
from app.schemas.all_schemas import SuspiciousActionRequest
from app.core.security import require_admin

router = APIRouter(prefix="/suspicious", tags=["Suspicious Evidence Center"])

@router.get("")
def get_suspicious_events(
    status: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(SuspiciousEvent).filter(
        SuspiciousEvent.organization_id == admin.organization_id
    )
    if status:
        query = query.filter(SuspiciousEvent.status == status)
    
    events = query.order_by(SuspiciousEvent.created_at.desc()).all()

    result = []
    for ev in events:
        evidence = db.query(SiteEvidence).filter(SiteEvidence.id == ev.evidence_id).first()
        project = db.query(Project).filter(Project.id == ev.project_id).first()
        engineer = db.query(User).filter(User.id == ev.engineer_id).first()

        result.append({
            "id": ev.id,
            "evidenceId": ev.evidence_id,
            "projectId": ev.project_id,
            "projectName": project.name if project else "Unknown",
            "engineerName": engineer.name if engineer else "Unknown",
            "issueType": ev.issue_type,
            "description": ev.description,
            "riskScore": ev.risk_score,
            "status": ev.status,
            "recaptureReason": ev.recapture_reason,
            "imageUrl": evidence.image_path if evidence else None,
            "category": evidence.evidence_category if evidence else None,
            "createdAt": ev.created_at
        })

    return {"suspiciousEvents": result}

@router.post("/{event_id}/action")
def resolve_suspicious_event(
    event_id: str,
    request: SuspiciousActionRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    event = db.query(SuspiciousEvent).filter(
        SuspiciousEvent.id == event_id,
        SuspiciousEvent.organization_id == admin.organization_id
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Suspicious event not found")

    event.status = request.action
    event.recapture_reason = request.recaptureReason
    event.resolved_by = admin.id
    event.resolved_at = datetime.utcnow()

    # Also update the related evidence status
    evidence = db.query(SiteEvidence).filter(SiteEvidence.id == event.evidence_id).first()
    if evidence:
        evidence.verification_status = request.action

    db.commit()
    return {"message": f"Event marked as {request.action}"}
