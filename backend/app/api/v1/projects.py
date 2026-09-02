from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.all_models import (
    User,
    Project,
    ProjectLocation,
    EvidencePolicy,
    ProjectEngineer,
    AuditLog
)
from app.schemas.all_schemas import (
    CreateProjectRequest,
    ProjectResponse,
    AssignEngineerRequest
)
from app.core.security import get_current_user, require_admin

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "DEPARTMENT_ADMIN":
        projects = db.query(Project).filter(
            Project.organization_id == current_user.organization_id
        ).all()
    else:
        # Field Engineer: Return assigned projects
        assignments = db.query(ProjectEngineer).filter(
            ProjectEngineer.engineer_id == current_user.id,
            ProjectEngineer.is_active == True
        ).all()
        project_ids = [a.project_id for a in assignments]
        projects = db.query(Project).filter(
            Project.id.in_(project_ids)
        ).all()

    result = []
    for p in projects:
        assigned_count = db.query(ProjectEngineer).filter(
            ProjectEngineer.project_id == p.id,
            ProjectEngineer.is_active == True
        ).count()

        result.append(ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            projectType=p.project_type,
            status=p.status,
            latitude=p.location.latitude if p.location else None,
            longitude=p.location.longitude if p.location else None,
            address=p.location.address if p.location else None,
            geofenceRadiusMeters=p.location.geofence_radius_meters if p.location else 100,
            minimumImages=p.policy.minimum_images if p.policy else 5,
            maximumImages=p.policy.maximum_images if p.policy else 20,
            assignedEngineersCount=assigned_count,
            createdAt=p.created_at
        ))
    return result

@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(
    request: CreateProjectRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    project = Project(
        organization_id=admin.organization_id,
        name=request.name,
        description=request.description,
        project_type=request.projectType.upper(),
        status=request.status.upper()
    )
    db.add(project)
    db.flush()

    # Location & Geofence
    location = ProjectLocation(
        project_id=project.id,
        latitude=request.latitude,
        longitude=request.longitude,
        address=request.address,
        geofence_radius_meters=request.geofenceRadiusMeters
    )
    db.add(location)

    # Evidence Quota Policy
    policy = EvidencePolicy(
        project_id=project.id,
        minimum_images=request.minimumImages,
        maximum_images=request.maximumImages,
        submission_frequency="DAILY"
    )
    db.add(policy)

    # Audit Log
    db.add(AuditLog(
        organization_id=admin.organization_id,
        user_id=admin.id,
        action="PROJECT_CREATED",
        resource_type="PROJECT",
        resource_id=project.id,
        extra_metadata={"name": project.name, "type": project.project_type}
    ))

    db.commit()
    return {"message": "Project created successfully", "projectId": project.id}

@router.get("/{project_id}")
def get_project_detail(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == current_user.organization_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    assigned_engineers = []
    assignments = db.query(ProjectEngineer).filter(
        ProjectEngineer.project_id == project.id,
        ProjectEngineer.is_active == True
    ).all()
    for a in assignments:
        eng = db.query(User).filter(User.id == a.engineer_id).first()
        if eng:
            assigned_engineers.append({
                "id": eng.id,
                "name": eng.name,
                "email": eng.email,
                "assignedAt": a.assigned_at
            })

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "projectType": project.project_type,
        "status": project.status,
        "location": {
            "latitude": project.location.latitude if project.location else None,
            "longitude": project.location.longitude if project.location else None,
            "address": project.location.address if project.location else None,
            "geofenceRadiusMeters": project.location.geofence_radius_meters if project.location else 100
        },
        "policy": {
            "minimumImages": project.policy.minimum_images if project.policy else 5,
            "maximumImages": project.policy.maximum_images if project.policy else 20
        },
        "assignedEngineers": assigned_engineers,
        "createdAt": project.created_at
    }

@router.post("/{project_id}/assign-engineer")
def assign_engineer(
    project_id: str,
    request: AssignEngineerRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.organization_id == admin.organization_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    engineer = db.query(User).filter(
        User.id == request.engineerId,
        User.organization_id == admin.organization_id,
        User.role == "ENGINEER"
    ).first()
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer not found in your organization")

    # Check if already assigned
    existing = db.query(ProjectEngineer).filter(
        ProjectEngineer.project_id == project.id,
        ProjectEngineer.engineer_id == engineer.id
    ).first()

    if existing:
        existing.is_active = True
    else:
        assignment = ProjectEngineer(
            project_id=project.id,
            engineer_id=engineer.id,
            is_active=True
        )
        db.add(assignment)

    db.commit()
    return {"message": f"Engineer {engineer.name} successfully assigned to project {project.name}"}
