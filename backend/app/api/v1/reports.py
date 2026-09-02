from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.all_models import User, DailyReport, Project
from app.core.security import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/daily")
def get_daily_reports(
    projectId: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DailyReport).filter(
        DailyReport.organization_id == current_user.organization_id
    )
    if projectId:
        query = query.filter(DailyReport.project_id == projectId)

    reports = query.order_by(DailyReport.report_date.desc()).all()

    result = []
    for r in reports:
        project = db.query(Project).filter(Project.id == r.project_id).first()
        engineer = db.query(User).filter(User.id == r.engineer_id).first()
        result.append({
            "id": r.id,
            "projectId": r.project_id,
            "projectName": project.name if project else "Unknown",
            "projectType": project.project_type if project else "BUILDING",
            "engineerName": engineer.name if engineer else "Unknown",
            "reportDate": r.report_date,
            "totalSubmitted": r.total_submitted,
            "totalRequired": r.total_required,
            "averageQuality": r.average_quality,
            "averageGpsAccuracy": r.average_gps_accuracy,
            "photoDiversity": r.photo_diversity,
            "duplicateCount": r.duplicate_count,
            "trustScore": r.trust_score,
            "trustStatus": r.trust_status,
            "aiPredictedStage": r.ai_predicted_stage,
            "aiConfidence": r.ai_confidence,
            "createdAt": r.created_at
        })

    return {"reports": result}
