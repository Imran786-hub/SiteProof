from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    accessToken: str
    refreshToken: str
    user: dict

class InitAdminRequest(BaseModel):
    orgName: str
    adminEmail: EmailStr
    adminPassword: str
    adminName: str

class ActivateAccountRequest(BaseModel):
    token: str
    password: str

# Engineer Schemas
class CreateEngineerRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    employeeId: Optional[str] = None
    designation: Optional[str] = None

class EngineerResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    employeeId: Optional[str] = None
    designation: Optional[str] = None
    isActive: bool
    emailVerified: bool
    assignedProjectCount: int = 0
    createdAt: datetime

# Project Schemas
class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    projectType: str = "BUILDING" # BUILDING, ROAD
    status: str = "ACTIVE"
    latitude: float
    longitude: float
    address: Optional[str] = None
    geofenceRadiusMeters: int = 100
    minimumImages: int = 5
    maximumImages: int = 20

class AssignEngineerRequest(BaseModel):
    engineerId: str

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    projectType: str
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    geofenceRadiusMeters: Optional[int] = 100
    minimumImages: Optional[int] = 5
    maximumImages: Optional[int] = 20
    assignedEngineersCount: int = 0
    createdAt: datetime

# Evidence Schemas
class SubmitEvidenceRequest(BaseModel):
    projectId: str
    evidenceCategory: str
    imageBase64: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    gpsAccuracy: Optional[float] = None
    timestamp: Optional[str] = None

class ReviewEvidenceRequest(BaseModel):
    action: str # APPROVE, FLAGGED, RECAPTURE_REQUESTED
    reason: Optional[str] = None

class SuspiciousActionRequest(BaseModel):
    action: str # APPROVE, FLAGGED, RECAPTURE_REQUESTED
    recaptureReason: Optional[str] = None
