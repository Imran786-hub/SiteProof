import os
import base64
import math
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.all_models import (
    User,
    Project,
    ProjectEngineer,
    ProjectLocation,
    SiteEvidence,
    EvidenceAnalysis,
    SuspiciousEvent,
    DailyReport,
    AuditLog
)
from app.schemas.all_schemas import SubmitEvidenceRequest, ReviewEvidenceRequest
from app.core.security import get_current_user, require_engineer, require_admin
from app.ai.image_quality import analyze_image_quality
from app.ai.duplicate_detection import (
    compute_sha256,
    compute_perceptual_hash,
    calculate_hamming_distance
)
from app.ai.classifier import classify_stage_and_objects
from app.ai.trust_score import calculate_evidence_trust_score

router = APIRouter(prefix="/evidence", tags=["Evidence"])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in meters between two GPS coordinates."""
    R = 6371000 # Earth radius in meters
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_evidence(
    request: SubmitEvidenceRequest,
    engineer: User = Depends(require_engineer),
    db: Session = Depends(get_db)
):
    # 1. Verify engineer assigned to project
    assignment = db.query(ProjectEngineer).filter(
        ProjectEngineer.project_id == request.projectId,
        ProjectEngineer.engineer_id == engineer.id,
        ProjectEngineer.is_active == True
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="You are not assigned to this project")

    project = db.query(Project).filter(Project.id == request.projectId).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # 2. Location & Geofence Verification
    distance = None
    location_verified = False
    if project.location and request.latitude is not None and request.longitude is not None:
        distance = haversine_distance(
            request.latitude,
            request.longitude,
            project.location.latitude,
            project.location.longitude
        )
        location_verified = distance <= project.location.geofence_radius_meters

    # 3. Decode image & persist to storage
    try:
        clean_base64 = request.imageBase64.split(",")[-1]
        image_bytes = base64.b64decode(clean_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    # Save to disk
    rel_dir = os.path.join("uploads", "evidence", engineer.organization_id, request.projectId)
    abs_dir = os.path.join(os.getcwd(), rel_dir)
    os.makedirs(abs_dir, exist_ok=True)
    
    filename = f"{engineer.id}_{int(datetime.utcnow().timestamp())}.jpg"
    abs_file_path = os.path.join(abs_dir, filename)
    with open(abs_file_path, "wb") as f:
        f.write(image_bytes)

    public_image_url = f"/{rel_dir.replace(os.sep, '/')}/{filename}"

    # 4. SHA-256 and Perceptual Hashing
    image_hash = compute_sha256(image_bytes)
    p_hash = compute_perceptual_hash(image_bytes)

    # 5. Duplicate Detection against DB
    existing_exact = db.query(SiteEvidence).filter(
        SiteEvidence.project_id == request.projectId,
        SiteEvidence.image_hash == image_hash
    ).first()
    is_exact_dup = existing_exact is not None

    # Check near duplicates via Hamming distance
    recent_evidence = db.query(SiteEvidence).filter(
        SiteEvidence.project_id == request.projectId
    ).order_by(SiteEvidence.created_at.desc()).limit(20).all()

    min_hamming = 64
    for ev in recent_evidence:
        if ev.perceptual_hash:
            d = calculate_hamming_distance(p_hash, ev.perceptual_hash)
            if d < min_hamming:
                min_hamming = d
    is_near_dup = min_hamming < 10

    # 6. Computer Vision Image Quality Analysis
    quality_result = analyze_image_quality(image_bytes)

    # 7. Dual-Model AI Stage Classifier (OpenCV + Multi-Feature Computer Vision)
    stage_ai = classify_stage_and_objects(
        project_type=project.project_type,
        evidence_category=request.evidenceCategory,
        image_bytes=image_bytes,
        image_hash=image_hash
    )

    # 8. Evidence Trust Score Engine (0-100)
    trust_calc = calculate_evidence_trust_score(
        location_verified=location_verified,
        gps_accuracy=request.gpsAccuracy,
        quality_score=quality_result["quality_score"],
        quality_issues=quality_result["issues"],
        is_exact_duplicate=is_exact_dup,
        is_near_duplicate=is_near_dup,
        ai_confidence=stage_ai["confidence"],
        has_category=bool(request.evidenceCategory)
    )

    # 9. Store Site Evidence record
    new_evidence = SiteEvidence(
        organization_id=engineer.organization_id,
        project_id=request.projectId,
        engineer_id=engineer.id,
        evidence_category=request.evidenceCategory,
        image_path=public_image_url,
        image_hash=image_hash,
        perceptual_hash=p_hash,
        capture_timestamp=datetime.utcnow(),
        submission_timestamp=datetime.utcnow(),
        latitude=request.latitude,
        longitude=request.longitude,
        gps_accuracy=request.gpsAccuracy,
        distance_from_site=round(distance, 2) if distance is not None else None,
        location_verified=location_verified,
        verification_status="VERIFIED" if trust_calc["trust_status"] == "HIGH CONFIDENCE" else "NEEDS_REVIEW"
    )
    db.add(new_evidence)
    db.flush()

    # 10. Store Evidence Analysis record
    analysis = EvidenceAnalysis(
        evidence_id=new_evidence.id,
        model_type=stage_ai["model_type"],
        model_version=stage_ai["model_version"],
        predicted_stage=stage_ai["predicted_stage"],
        confidence=stage_ai["confidence"],
        detected_objects=stage_ai["detected_objects"],
        quality_score=quality_result["quality_score"],
        duplicate_score=1.0 if is_exact_dup else (0.8 if is_near_dup else 0.0),
        similarity_score=0.92 if is_near_dup else 0.15,
        trust_score=trust_calc["trust_score"],
        trust_status=trust_calc["trust_status"]
    )
    db.add(analysis)

    # 11. Flag Anomaly into Suspicious Events if applicable
    if trust_calc["trust_status"] != "HIGH CONFIDENCE" or is_exact_dup or not location_verified:
        issue_type = "DUPLICATE_IMAGE" if is_exact_dup else ("LOCATION_MISMATCH" if not location_verified else "POOR_QUALITY")
        desc = "; ".join(trust_calc["issues"]) if trust_calc["issues"] else "Evidence flagged for manual admin review."
        
        suspicious_event = SuspiciousEvent(
            organization_id=engineer.organization_id,
            project_id=request.projectId,
            evidence_id=new_evidence.id,
            engineer_id=engineer.id,
            issue_type=issue_type,
            description=desc,
            risk_score=100 - trust_calc["trust_score"],
            status="NEEDS_REVIEW"
        )
        db.add(suspicious_event)

    # 12. Aggregate Daily Report
    today = datetime.utcnow().date()
    report = db.query(DailyReport).filter(
        DailyReport.project_id == request.projectId,
        DailyReport.engineer_id == engineer.id,
        DailyReport.report_date >= datetime(today.year, today.month, today.day)
    ).first()

    if not report:
        report = DailyReport(
            organization_id=engineer.organization_id,
            project_id=request.projectId,
            engineer_id=engineer.id,
            report_date=datetime.utcnow(),
            total_submitted=1,
            total_required=project.policy.minimum_images if project.policy else 5,
            average_quality=quality_result["quality_score"],
            average_gps_accuracy=request.gpsAccuracy,
            photo_diversity=0.88,
            duplicate_count=1 if is_exact_dup else 0,
            trust_score=trust_calc["trust_score"],
            trust_status=trust_calc["trust_status"],
            ai_predicted_stage=stage_ai["predicted_stage"],
            ai_confidence=stage_ai["confidence"]
        )
        db.add(report)
    else:
        report.total_submitted += 1
        if is_exact_dup:
            report.duplicate_count += 1
        report.trust_score = int((report.trust_score + trust_calc["trust_score"]) / 2) if report.trust_score else trust_calc["trust_score"]

    db.commit()

    return {
        "message": "Evidence submitted and verified by AI pipeline",
        "evidence": {
            "id": new_evidence.id,
            "imageUrl": public_image_url,
            "locationVerified": location_verified,
            "distanceFromSite": round(distance, 2) if distance is not None else None,
            "trustScore": trust_calc["trust_score"],
            "trustStatus": trust_calc["trust_status"],
            "predictedStage": stage_ai["predicted_stage"],
            "detectedObjects": stage_ai["detected_objects"],
            "qualityScore": quality_result["quality_score"]
        }
    }

@router.get("")
def get_evidence_list(
    projectId: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SiteEvidence).filter(
        SiteEvidence.organization_id == current_user.organization_id
    )
    if projectId:
        query = query.filter(SiteEvidence.project_id == projectId)
    if current_user.role == "ENGINEER":
        query = query.filter(SiteEvidence.engineer_id == current_user.id)

    records = query.order_by(SiteEvidence.created_at.desc()).all()
    
    result = []
    for ev in records:
        result.append({
            "id": ev.id,
            "projectId": ev.project_id,
            "projectName": ev.project.name if ev.project else "Unknown",
            "engineerId": ev.engineer_id,
            "engineerName": ev.engineer.name if ev.engineer else "Unknown",
            "evidenceCategory": ev.evidence_category,
            "imageUrl": ev.image_path,
            "locationVerified": ev.location_verified,
            "distanceFromSite": ev.distance_from_site,
            "verificationStatus": ev.verification_status,
            "captureTimestamp": ev.capture_timestamp,
            "submissionTimestamp": ev.submission_timestamp,
            "analysis": {
                "predictedStage": ev.analysis.predicted_stage if ev.analysis else None,
                "confidence": ev.analysis.confidence if ev.analysis else None,
                "detectedObjects": ev.analysis.detected_objects if ev.analysis else [],
                "qualityScore": ev.analysis.quality_score if ev.analysis else None,
                "trustScore": ev.analysis.trust_score if ev.analysis else None,
                "trustStatus": ev.analysis.trust_status if ev.analysis else None,
            } if ev.analysis else None
        })

    return {"evidence": result}

@router.get("/{evidence_id}")
def get_single_evidence(
    evidence_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ev = db.query(SiteEvidence).filter(
        SiteEvidence.id == evidence_id,
        SiteEvidence.organization_id == current_user.organization_id
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence record not found")

    return {
        "id": ev.id,
        "projectId": ev.project_id,
        "projectName": ev.project.name if ev.project else "Unknown",
        "projectType": ev.project.project_type if ev.project else "BUILDING",
        "engineerName": ev.engineer.name if ev.engineer else "Unknown",
        "evidenceCategory": ev.evidence_category,
        "imageUrl": ev.image_path,
        "latitude": ev.latitude,
        "longitude": ev.longitude,
        "gpsAccuracy": ev.gps_accuracy,
        "distanceFromSite": ev.distance_from_site,
        "locationVerified": ev.location_verified,
        "verificationStatus": ev.verification_status,
        "captureTimestamp": ev.capture_timestamp,
        "submissionTimestamp": ev.submission_timestamp,
        "analysis": {
            "modelType": ev.analysis.model_type if ev.analysis else None,
            "predictedStage": ev.analysis.predicted_stage if ev.analysis else None,
            "confidence": ev.analysis.confidence if ev.analysis else None,
            "detectedObjects": ev.analysis.detected_objects if ev.analysis else [],
            "qualityScore": ev.analysis.quality_score if ev.analysis else None,
            "trustScore": ev.analysis.trust_score if ev.analysis else None,
            "trustStatus": ev.analysis.trust_status if ev.analysis else None,
        } if ev.analysis else None
    }

@router.patch("/{evidence_id}")
def review_evidence(
    evidence_id: str,
    request: ReviewEvidenceRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    ev = db.query(SiteEvidence).filter(
        SiteEvidence.id == evidence_id,
        SiteEvidence.organization_id == admin.organization_id
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    ev.verification_status = request.action
    
    if request.action == "RECAPTURE_REQUESTED":
        susp = db.query(SuspiciousEvent).filter(SuspiciousEvent.evidence_id == ev.id).first()
        if not susp:
            susp = SuspiciousEvent(
                organization_id=admin.organization_id,
                project_id=ev.project_id,
                evidence_id=ev.id,
                engineer_id=ev.engineer_id,
                issue_type="RECAPTURE_REQUESTED",
                description=request.reason or "Admin requested evidence recapture.",
                risk_score=75,
                status="RECAPTURE_REQUESTED",
                recapture_reason=request.reason,
                resolved_by=admin.id
            )
            db.add(susp)
        else:
            susp.status = "RECAPTURE_REQUESTED"
            susp.recapture_reason = request.reason
            susp.resolved_by = admin.id

    db.commit()
    return {"message": f"Evidence marked as {request.action}"}
