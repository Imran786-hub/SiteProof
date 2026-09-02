# SiteProof AI - API Design Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

All protected endpoints require an `Authorization` header with a Bearer token:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via the login endpoint and expire after 15 minutes. Use the refresh endpoint to obtain a new token.

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## API Endpoints

### Authentication

#### POST /auth/login
Login and obtain access and refresh tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "DEPARTMENT_ADMIN",
    "organizationId": "uuid"
  }
}
```

---

#### POST /auth/refresh
Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

#### POST /auth/activate
Activate account and set password (via email link).

**Request:**
```json
{
  "token": "activation-token-from-email",
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Account activated successfully"
}
```

---

#### POST /auth/forgot-password
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists for this email, password reset instructions have been sent."
}
```

---

#### POST /auth/reset-password
Reset password with token from email.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### Engineers (v1)

#### GET /v1/engineers
List all engineers in organization (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "engineers": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+91-9999999999",
      "employeeId": "EMP001",
      "designation": "Senior Engineer",
      "isActive": true,
      "emailVerified": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### POST /v1/engineers
Create a new engineer (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9999999999",
  "employeeId": "EMP001",
  "designation": "Senior Engineer"
}
```

**Response (201):**
```json
{
  "message": "Engineer created successfully. Activation email sent.",
  "engineer": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "ENGINEER"
  }
}
```

---

#### GET /v1/engineers/[id]
Get engineer details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "engineer": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9999999999",
    "employeeId": "EMP001",
    "designation": "Senior Engineer",
    "isActive": true,
    "emailVerified": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### PUT /v1/engineers/[id]
Update engineer (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "John Doe Updated",
  "phone": "+91-8888888888",
  "designation": "Lead Engineer",
  "isActive": true
}
```

**Response (200):**
```json
{
  "message": "Engineer updated successfully"
}
```

---

#### DELETE /v1/engineers/[id]
Deactivate engineer (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Engineer deactivated successfully"
}
```

---

### Projects (v1)

#### GET /v1/projects
List all projects in organization.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Downtown Building Construction",
      "description": "New 5-story commercial building",
      "projectType": "BUILDING",
      "status": "ACTIVE",
      "startDate": "2024-01-01T00:00:00Z",
      "expectedCompletionDate": "2024-12-31T00:00:00Z",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

---

#### POST /v1/projects
Create a new project (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Downtown Building Construction",
  "description": "New 5-story commercial building",
  "projectType": "BUILDING",
  "location": {
    "latitude": 26.912485,
    "longitude": 83.886223,
    "address": "123 Main Street, Gorakhpur",
    "geofenceRadiusMeters": 100
  },
  "evidencePolicy": {
    "minimumImages": 5,
    "maximumImages": 20
  }
}
```

**Response (201):**
```json
{
  "message": "Project created successfully",
  "project": {
    "id": "uuid",
    "name": "Downtown Building Construction",
    "projectType": "BUILDING"
  }
}
```

---

#### GET /v1/projects/[id]
Get project details with location and policy.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "project": {
    "id": "uuid",
    "name": "Downtown Building Construction",
    "description": "New 5-story commercial building",
    "projectType": "BUILDING",
    "status": "ACTIVE",
    "location": {
      "latitude": "26.912485",
      "longitude": "83.886223",
      "address": "123 Main Street, Gorakhpur",
      "geofenceRadiusMeters": 100
    },
    "policy": {
      "minimumImages": 5,
      "maximumImages": 20
    },
    "assignedEngineers": [
      {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    ]
  }
}
```

---

#### PUT /v1/projects/[id]
Update project (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Downtown Building Construction - Updated",
  "status": "PAUSED",
  "location": {
    "latitude": 26.912485,
    "longitude": 83.886223,
    "address": "123 Main Street, Gorakhpur",
    "geofenceRadiusMeters": 150
  },
  "evidencePolicy": {
    "minimumImages": 8,
    "maximumImages": 25
  }
}
```

**Response (200):**
```json
{
  "message": "Project updated successfully"
}
```

---

#### POST /v1/projects/[id]/assign-engineer
Assign engineer to project (admin only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "engineerId": "uuid"
}
```

**Response (201):**
```json
{
  "message": "Engineer assigned to project successfully"
}
```

---

### Evidence (v1)

#### GET /v1/evidence
Get evidence submissions (admin only, optional filtering by projectId).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `projectId` (optional): Filter by project

**Response (200):**
```json
{
  "evidence": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "engineerId": "uuid",
      "evidenceCategory": "ACTIVE_WORK_AREA",
      "imagePath": "evidence/...",
      "imageHash": "sha256hash",
      "captureTimestamp": "2024-01-15T14:30:00Z",
      "submissionTimestamp": "2024-01-15T14:32:00Z",
      "latitude": "26.912485",
      "longitude": "83.886223",
      "gpsAccuracy": "15.5",
      "distanceFromSite": "45.2",
      "locationVerified": true,
      "verificationStatus": "PENDING",
      "createdAt": "2024-01-15T14:32:00Z"
    }
  ]
}
```

---

#### POST /v1/evidence
Submit evidence (engineers only).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "projectId": "uuid",
  "evidenceCategory": "ACTIVE_WORK_AREA",
  "imageBase64": "data:image/jpeg;base64,...",
  "latitude": 26.912485,
  "longitude": 83.886223,
  "gpsAccuracy": 15.5,
  "timestamp": "2024-01-15T14:30:00Z"
}
```

**Response (201):**
```json
{
  "message": "Evidence submitted successfully",
  "evidence": {
    "id": "uuid",
    "status": "PENDING",
    "locationVerified": true,
    "distance": "45.20"
  }
}
```

---

### Admin Initialization

#### POST /admin/init
Initialize organization and first admin account (one-time only).

**Headers:**
```
X-Init-Token: <init-token-from-env>
```

**Request:**
```json
{
  "orgName": "Gorakhpur Construction Department",
  "adminEmail": "admin@gorakhpur.gov",
  "adminPassword": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "message": "Initial setup completed",
  "organization": {
    "id": "uuid",
    "name": "Gorakhpur Construction Department"
  },
  "admin": {
    "id": "uuid",
    "email": "admin@gorakhpur.gov"
  }
}
```

---

## Rate Limiting

Current implementation has no rate limiting. Production deployment should include:
- Per-user rate limits: 100 requests/minute
- Per-IP rate limits: 1000 requests/minute
- API key rate limits

## Pagination (Future)

Future endpoints will support pagination with:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Example:
```
GET /v1/engineers?page=2&limit=50
```

---

## Webhooks (Future)

Planned webhook events:
- `evidence.submitted`
- `evidence.verified`
- `evidence.flagged`
- `project.created`
- `engineer.assigned`

---
