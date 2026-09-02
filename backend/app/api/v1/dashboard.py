from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.all_models import (
    User,
    Project,
    SiteEvidence,
    SuspiciousEvent,
    ProjectEngineer
)
from app.core.security import get_current_user, require_admin, require_engineer

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard/stats")
def get_admin_dashboard_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_projects = db.query(Project).filter(Project.organization_id == admin.organization_id).count()
    active_projects = db.query(Project).filter(
        Project.organization_id == admin.organization_id,
        Project.status == "ACTIVE"
    ).count()

    total_engineers = db.query(User).filter(
        User.organization_id == admin.organization_id,
        User.role == "ENGINEER"
    ).count()
    active_engineers = db.query(User).filter(
        User.organization_id == admin.organization_id,
        User.role == "ENGINEER",
        User.is_active == True
    ).count()

    total_evidence = db.query(SiteEvidence).filter(SiteEvidence.organization_id == admin.organization_id).count()
    suspicious_count = db.query(SuspiciousEvent).filter(
        SuspiciousEvent.organization_id == admin.organization_id,
        SuspiciousEvent.status == "NEEDS_REVIEW"
    ).count()

    # Recent submissions
    recent_evidence = db.query(SiteEvidence).filter(
        SiteEvidence.organization_id == admin.organization_id
    ).order_by(SiteEvidence.created_at.desc()).limit(6).all()

    recent_list = []
    for ev in recent_evidence:
        recent_list.append({
            "id": ev.id,
            "projectName": ev.project.name if ev.project else "Unknown",
            "engineerName": ev.engineer.name if ev.engineer else "Unknown",
            "category": ev.evidence_category,
            "imageUrl": ev.image_path,
            "trustScore": ev.analysis.trust_score if ev.analysis else 85,
            "trustStatus": ev.analysis.trust_status if ev.analysis else "HIGH CONFIDENCE",
            "createdAt": ev.created_at
        })

    return {
        "totalProjects": total_projects,
        "activeProjects": active_projects,
        "totalEngineers": total_engineers,
        "activeEngineers": active_engineers,
        "totalEvidence": total_evidence,
        "suspiciousCount": suspicious_count,
        "recentEvidence": recent_list
    }

@router.get("/engineer/dashboard")
def get_engineer_dashboard_data(
    engineer: User = Depends(require_engineer),
    db: Session = Depends(get_db)
):
    assignments = db.query(ProjectEngineer).filter(
        ProjectEngineer.engineer_id == engineer.id,
        ProjectEngineer.is_active == True
    ).all()

    project_ids = [a.project_id for a in assignments]
    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()

    projects_data = []
    today = datetime.utcnow().date()
    today_start = datetime(today.year, today.month, today.day)

    for p in projects:
        today_submissions = db.query(SiteEvidence).filter(
            SiteEvidence.project_id == p.id,
            SiteEvidence.engineer_id == engineer.id,
            SiteEvidence.submission_timestamp >= today_start
        ).count()

        min_req = p.policy.minimum_images if p.policy else 5

        projects_data.append({
            "id": p.id,
            "name": p.name,
            "projectType": p.project_type,
            "status": p.status,
            "address": p.location.address if p.location else "Site Location",
            "latitude": p.location.latitude if p.location else None,
            "longitude": p.location.longitude if p.location else None,
            "geofenceRadiusMeters": p.location.geofence_radius_meters if p.location else 100,
            "todaySubmissions": today_submissions,
            "minimumRequired": min_req,
            "isCompletedToday": today_submissions >= min_req
        })

    # Active Recapture Requests for this engineer
    recaptures = db.query(SuspiciousEvent).filter(
        SuspiciousEvent.engineer_id == engineer.id,
        SuspiciousEvent.status == "RECAPTURE_REQUESTED"
    ).order_by(SuspiciousEvent.created_at.desc()).all()

    recapture_list = []
    for r in recaptures:
        recapture_list.append({
            "id": r.id,
            "projectId": r.project_id,
            "projectName": r.evidence.project.name if r.evidence and r.evidence.project else "Assigned Project",
            "evidenceId": r.evidence_id,
            "category": r.evidence.evidence_category if r.evidence else "ACTIVE_WORK_AREA",
            "reason": r.recapture_reason or r.description,
            "createdAt": r.created_at
        })

    return {
        "assignedProjects": projects_data,
        "recaptureRequests": recapture_list
    }
