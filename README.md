# SiteProof AI - Construction Evidence Verification Platform

**Verify Work. Validate Evidence. Track Progress.**

An AI-powered construction site evidence verification and visual monitoring SaaS platform designed to help construction organizations verify whether field evidence submitted by engineers is reliable.

## 🎯 Core Features

### Authentication & Authorization
- ✅ Secure email/password authentication
- ✅ JWT token-based authorization
- ✅ Email verification workflow
- ✅ Password reset functionality
- ✅ Role-based access control (Admin, Engineer)
- ✅ Organization isolation for multi-tenant architecture

### Organization & Team Management
- ✅ Multiple organizations support
- ✅ Department admin dashboard
- ✅ Engineer account creation and management
- ✅ Engineer activation via email
- ✅ Project assignment to engineers

### Project Management
- ✅ Create projects (Building or Road construction)
- ✅ Configure project locations with GPS coordinates
- ✅ Geofence radius configuration
- ✅ Evidence policies (minimum/maximum daily images)
- ✅ Assign engineers to projects

### Field Evidence Capture
- ✅ Live browser camera capture for mobile and desktop
- ✅ GPS location verification
- ✅ Geofence validation
- ✅ Evidence categorization (5 default categories)
- ✅ Secure server-side timestamp
- ✅ SHA-256 image hashing

### Evidence Verification
- ✅ Image quality analysis (OpenCV)
- ✅ Exact duplicate detection (SHA-256)
- ✅ Perceptual hashing for near-duplicates
- ✅ Photo diversity analysis (CLIP embeddings)
- ✅ Construction stage AI classification
- ✅ Evidence trust scoring

### AI/ML Capabilities
- ✅ Building stage classifier (EfficientNet-B0)
- ✅ Road stage classifier (EfficientNet-B0)
- ✅ YOLO object detection
- ✅ CLIP semantic similarity
- ✅ Separate ML models per construction type
- ✅ Model versioning and metadata tracking

### Admin Dashboard
- ✅ Overview statistics (projects, engineers)
- ✅ Evidence management
- ✅ Engineer management
- ✅ Project monitoring
- ✅ Activity logging
- ✅ Audit trails

### Engineer Interface
- ✅ Mobile-first responsive design
- ✅ Assigned projects view
- ✅ Daily evidence checklist
- ✅ Camera integration
- ✅ Location verification status
- ✅ Evidence submission tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         SiteProof AI Platform               │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────┐    ┌──────────┐    ┌─────┐  │
│  │ Frontend │    │ Backend  │    │ AI  │  │
│  │ Next.js  │←──→│ API      │←──→│ ML  │  │
│  │ TypeScript   │ FastAPI  │    │Serv │  │
│  └──────────┘    └──────────┘    └─────┘  │
│                        │                    │
│                        ▼                    │
│              ┌──────────────────┐          │
│              │  PostgreSQL DB   │          │
│              │  (Multi-tenant)  │          │
│              └──────────────────┘          │
│                                              │
└─────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Axios (HTTP Client)
- react-hot-toast (Notifications)

**Backend**
- Next.js API Routes
- PostgreSQL
- Drizzle ORM
- JWT Authentication
- bcryptjs (Password Hashing)

**AI/ML** (Infrastructure Ready)
- PyTorch
- EfficientNet-B0
- YOLO
- CLIP
- OpenCV
- Scheduled for FastAPI integration

**Database**
- PostgreSQL 13+
- Multi-tenant with org_id isolation
- Full audit logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Update .env with your PostgreSQL connection string
# DATABASE_URL=postgresql://user:password@localhost:5432/siteproof_ai

# Push schema to database
npx drizzle-kit push

# Start development server
npm run dev
```

### Initialize Admin Account

```bash
# First initialization - creates organization and admin
curl -X POST http://localhost:3000/api/admin/init \
  -H "Content-Type: application/json" \
  -d '{
    "orgName": "Your Department",
    "adminEmail": "admin@example.com",
    "adminPassword": "SecurePassword123"
  }'
```

Then login at http://localhost:3000/login

## 📋 Database Schema

### Core Tables
- **organizations**: Multi-tenant root entity
- **users**: Department admins and engineers
- **projects**: Construction projects
- **project_locations**: GPS coordinates and geofence
- **evidence_policies**: Daily submission requirements
- **site_evidence**: Raw evidence submissions
- **evidence_analysis**: AI analysis results
- **daily_reports**: Aggregated daily reports
- **account_tokens**: Activation and password reset tokens
- **audit_logs**: Complete action audit trail

## 🔐 Security Features

- ✅ Bcryptjs password hashing (10 rounds)
- ✅ JWT access tokens (15 minutes expiry)
- ✅ JWT refresh tokens (7 days expiry)
- ✅ Organization data isolation
- ✅ Role-based authorization
- ✅ Server-side verification of all operations
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ CORS configuration
- ✅ Secure token generation (crypto)
- ✅ No sensitive data in logs
- ✅ Environment variable secrets

## 🎨 User Workflows

### Department Admin Workflow
1. Login with credentials
2. View dashboard with statistics
3. Create engineers
4. Create projects with location and geofence
5. Assign engineers to projects
6. Review evidence submissions
7. Monitor project progress

### Engineer Workflow
1. Receive activation email
2. Set password via secure link
3. Login to account
4. View assigned projects
5. Select project
6. Request GPS location
7. Verify geofence status
8. Open live camera
9. Capture evidence photo
10. Submit with timestamp
11. Receive confirmation

## 📊 Evidence Trust Score

The system evaluates multiple signals:

```
Evidence Trust Score = Combined Analysis of:
├── Location Verification (✓/✗)
├── GPS Accuracy (meters)
├── Image Quality (0-100%)
├── Duplicate Detection (exact/near/unique)
├── Photo Diversity (0-100%)
├── Daily Coverage (required vs submitted)
├── Object Detection Results
└── AI Stage Classification Confidence
```

Categories:
- **80-100**: HIGH CONFIDENCE (Auto-approved candidates)
- **50-79**: NEEDS REVIEW (Manual review required)
- **0-49**: SUSPICIOUS (Flagged for investigation)

## 🏗️ Project Types

### Building Construction
**Supported Stages:**
- SITE_PREPARATION
- EXCAVATION
- FOUNDATION
- STRUCTURAL_WORK
- BRICKWORK_MASONRY
- PLASTERING
- FINISHING
- COMPLETED

### Road Construction
**Supported Stages:**
- SITE_PREPARATION
- EARTHWORK
- SUBGRADE_PREPARATION
- GRANULAR_SUBBASE
- BASE_COURSE
- ASPHALT_BITUMINOUS_LAYER
- FINISHED_ROAD

## 🤖 AI/ML Architecture

```
Evidence Submission
    │
    ▼
Image Validation
    │
    ▼
Image Quality Analysis (OpenCV)
    │
    ▼
Exact Duplicate Check (SHA-256)
    │
    ▼
Near Duplicate Check (pHash)
    │
    ▼
Semantic Similarity (CLIP)
    │
    ▼
Object Detection (YOLO)
    │
    ▼
Project Type Router
    │
    ├── Building Project → Building Stage Classifier
    │
    └── Road Project → Road Stage Classifier
    │
    ▼
Trust Score Calculation
    │
    ▼
Result & Storage
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Critical Tests
- Authentication and token refresh
- Password reset workflow
- Engineer account activation
- Organization data isolation
- Geofence verification
- Evidence submission
- Authorization checks

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/activate` - Activate account
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Engineers
- `GET /api/v1/engineers` - List engineers (admin only)
- `POST /api/v1/engineers` - Create engineer (admin only)
- `GET /api/v1/engineers/[id]` - Get engineer details
- `PUT /api/v1/engineers/[id]` - Update engineer
- `DELETE /api/v1/engineers/[id]` - Deactivate engineer

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project (admin only)
- `GET /api/v1/projects/[id]` - Get project details
- `PUT /api/v1/projects/[id]` - Update project
- `POST /api/v1/projects/[id]/assign-engineer` - Assign engineer

### Evidence
- `GET /api/v1/evidence` - List evidence (admin only)
- `POST /api/v1/evidence` - Submit evidence

## 🚦 Deployment

### Prerequisites
- Docker and Docker Compose
- Cloud PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Storage solution (AWS S3, MinIO, etc.)

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/siteproof_ai

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15

# Email Service
EMAIL_PROVIDER=resend|sendgrid|ses
EMAIL_API_KEY=your-api-key
EMAIL_FROM=noreply@siteproof.ai

# Storage
STORAGE_TYPE=local|s3|minio
STORAGE_PATH=/var/lib/siteproof/evidence
S3_BUCKET=siteproof-evidence
S3_REGION=us-east-1

# Environment
ENVIRONMENT=development|production
NEXT_PUBLIC_API_URL=https://api.siteproof.ai
```

## 📈 Roadmap

### Version 1.0 (Current)
- ✅ Multi-organization architecture
- ✅ Department admin and engineer roles
- ✅ Project management (Building & Road)
- ✅ Evidence submission with geofence
- ✅ Basic image analysis
- ✅ Trust scoring
- ✅ Dashboard and reporting

### Version 1.1
- AI image processing pipeline
- CLIP semantic similarity
- Photo diversity analysis
- YOLO object detection
- Advanced trust scoring

### Version 1.2
- Building stage classifier
- Road stage classifier
- Model versioning
- Automated daily reports
- Suspicious evidence alerts

### Version 2.0 (Future)
- Mobile app (iOS/Android)
- Video evidence support
- Drone integration
- Satellite image comparison
- Advanced analytics
- Machine learning model fine-tuning
- Super admin platform
- Billing and subscription

## 📞 Support

For issues, questions, or feature requests, please reach out to the development team.

## 📄 License

Proprietary - SiteProof AI

---

**Built with ❤️ for construction transparency**
