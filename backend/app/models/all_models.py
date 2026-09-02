import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Float,
    Integer,
    Text,
    ForeignKey,
    JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def gen_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    organization_type = Column(String(50), nullable=False, default="DEPARTMENT")
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    employee_id = Column(String(50), nullable=True)
    designation = Column(String(100), nullable=True)
    password_hash = Column(Text, nullable=True)
    role = Column(String(50), nullable=False, default="ENGINEER") # DEPARTMENT_ADMIN, ENGINEER
    is_active = Column(Boolean, default=False, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="users")
    assigned_projects = relationship("ProjectEngineer", back_populates="engineer")
    evidence_submissions = relationship("SiteEvidence", back_populates="engineer")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    project_type = Column(String(50), nullable=False, default="BUILDING") # BUILDING, ROAD
    status = Column(String(50), nullable=False, default="ACTIVE") # PLANNED, ACTIVE, PAUSED, COMPLETED, CANCELLED
    start_date = Column(DateTime, nullable=True)
    expected_completion_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", back_populates="projects")
    location = relationship("ProjectLocation", back_populates="project", uselist=False, cascade="all, delete-orphan")
    policy = relationship("EvidencePolicy", back_populates="project", uselist=False, cascade="all, delete-orphan")
    assigned_engineers = relationship("ProjectEngineer", back_populates="project", cascade="all, delete-orphan")
    evidence_list = relationship("SiteEvidence", back_populates="project", cascade="all, delete-orphan")


class ProjectLocation(Base):
    __tablename__ = "project_locations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(Text, nullable=True)
    geofence_radius_meters = Column(Integer, default=100, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="location")


class EvidencePolicy(Base):
    __tablename__ = "evidence_policies"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True)
    minimum_images = Column(Integer, default=5, nullable=False)
    maximum_images = Column(Integer, default=20, nullable=False)
    submission_frequency = Column(String(50), default="DAILY", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="policy")


class ProjectEngineer(Base):
    __tablename__ = "project_engineers"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    engineer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    project = relationship("Project", back_populates="assigned_engineers")
    engineer = relationship("User", back_populates="assigned_projects")


class SiteEvidence(Base):
    __tablename__ = "site_evidence"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    engineer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    evidence_category = Column(String(50), nullable=False) # WIDE_SITE_VIEW, ACTIVE_WORK_AREA, etc.
    image_path = Column(Text, nullable=False)
    image_hash = Column(String(64), nullable=True) # SHA-256
    perceptual_hash = Column(String(64), nullable=True) # dHash
    capture_timestamp = Column(DateTime, default=datetime.utcnow, nullable=True)
    submission_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    gps_accuracy = Column(Float, nullable=True)
    distance_from_site = Column(Float, nullable=True)
    location_verified = Column(Boolean, default=False, nullable=False)
    verification_status = Column(String(50), default="PENDING", nullable=False) # PENDING, VERIFIED, SUSPICIOUS, NEEDS_REVIEW, RECAPTURE_REQUESTED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="evidence_list")
    engineer = relationship("User", back_populates="evidence_submissions")
    analysis = relationship("EvidenceAnalysis", back_populates="evidence", uselist=False, cascade="all, delete-orphan")
    suspicious_events = relationship("SuspiciousEvent", back_populates="evidence", cascade="all, delete-orphan")


class EvidenceAnalysis(Base):
    __tablename__ = "evidence_analysis"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    evidence_id = Column(String(36), ForeignKey("site_evidence.id", ondelete="CASCADE"), nullable=False, unique=True)
    model_type = Column(String(50), nullable=False)
    model_version = Column(String(20), nullable=False)
    predicted_stage = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    detected_objects = Column(JSON, nullable=True)
    quality_score = Column(Float, nullable=True)
    duplicate_score = Column(Float, nullable=True)
    similarity_score = Column(Float, nullable=True)
    trust_score = Column(Integer, nullable=True)
    trust_status = Column(String(50), nullable=True) # HIGH CONFIDENCE, NEEDS REVIEW, SUSPICIOUS
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    evidence = relationship("SiteEvidence", back_populates="analysis")


class SuspiciousEvent(Base):
    __tablename__ = "suspicious_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    evidence_id = Column(String(36), ForeignKey("site_evidence.id", ondelete="CASCADE"), nullable=False)
    engineer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    issue_type = Column(String(100), nullable=False) # DUPLICATE_IMAGE, LOCATION_MISMATCH, LOW_ACCURACY, POOR_QUALITY, HIGH_SIMILARITY
    description = Column(Text, nullable=False)
    risk_score = Column(Integer, default=50, nullable=False)
    status = Column(String(50), default="NEEDS_REVIEW", nullable=False) # NEEDS_REVIEW, APPROVED, FLAGGED, RECAPTURE_REQUESTED
    recapture_reason = Column(Text, nullable=True)
    resolved_by = Column(String(36), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    evidence = relationship("SiteEvidence", back_populates="suspicious_events")


class DailyReport(Base):
    __tablename__ = "daily_reports"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    engineer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    total_submitted = Column(Integer, default=0, nullable=False)
    total_required = Column(Integer, default=5, nullable=False)
    average_quality = Column(Float, nullable=True)
    average_gps_accuracy = Column(Float, nullable=True)
    photo_diversity = Column(Float, nullable=True)
    duplicate_count = Column(Integer, default=0, nullable=False)
    trust_score = Column(Integer, nullable=True)
    trust_status = Column(String(50), nullable=True)
    ai_predicted_stage = Column(String(100), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AccountToken(Base):
    __tablename__ = "account_tokens"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(Text, nullable=False)
    token_type = Column(String(50), nullable=False) # ACCOUNT_ACTIVATION, PASSWORD_RESET
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=True)
    resource_id = Column(String(36), nullable=True)
    extra_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class EvidenceCategory(Base):
    __tablename__ = "evidence_categories"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, nullable=False)
