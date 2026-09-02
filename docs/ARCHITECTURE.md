# SiteProof AI - Architecture Documentation

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     SITEPROOF AI PLATFORM                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────────┐      │
│  │  FRONTEND LAYER  │         │   BACKEND LAYER      │      │
│  │  (Next.js 16)    │         │   (API Routes)       │      │
│  ├──────────────────┤         ├──────────────────────┤      │
│  │  • Dashboard     │◄───────►│  • Authentication    │      │
│  │  • Projects      │         │  • Authorization     │      │
│  │  • Engineers     │         │  • User Management   │      │
│  │  • Evidence      │         │  • Project Mgmt      │      │
│  │  • Reports       │         │  • Evidence Handler  │      │
│  │  • Mobile First  │         │  • Business Logic    │      │
│  └──────────────────┘         └──────────────────────┘      │
│           │                            │                     │
│           └────────────────┬───────────┘                     │
│                            │                                  │
│                  ┌─────────▼─────────┐                      │
│                  │  DATA ACCESS LAYER│                      │
│                  │  (Drizzle ORM)    │                      │
│                  └─────────┬─────────┘                      │
│                            │                                  │
│                  ┌─────────▼─────────┐                      │
│                  │   PostgreSQL DB   │                      │
│                  │  (Multi-Tenant)   │                      │
│                  └───────────────────┘                      │
│                                                               │
│  ┌──────────────────┐         ┌──────────────────────┐      │
│  │  INTEGRATION     │         │   INFRASTRUCTURE     │      │
│  │  COMPONENTS      │         │                      │      │
│  ├──────────────────┤         ├──────────────────────┤      │
│  │  • JWT Auth      │         │  • Environment Vars  │      │
│  │  • Email Service │         │  • Logging           │      │
│  │  • Storage       │         │  • Monitoring        │      │
│  │  • AI/ML Ready   │         │  • Security          │      │
│  └──────────────────┘         └──────────────────────┘      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Request Flow Architecture

### Authentication & Authorization Flow

```
User Request
    │
    ▼
┌─────────────────────────┐
│  Verify Authorization   │
│  Header (Bearer Token)  │
└─────────┬───────────────┘
          │
    ┌─────▼─────┐
    │ Valid?    │
    └─┬─────┬───┘
      │     │
   YES│     │NO
      │     └──────────┐
      │                ▼
      │          401 Unauthorized
      │
      ▼
┌─────────────────────────┐
│  Extract JWT Payload    │
│  (userId, org, role)    │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│  Check Role Permission  │
│  (ADMIN vs ENGINEER)    │
└─────────┬───────────────┘
          │
    ┌─────▼─────┐
    │ Authorized?│
    └─┬─────┬───┘
      │     │
   YES│     │NO
      │     └──────────┐
      │                ▼
      │          403 Forbidden
      │
      ▼
┌─────────────────────────┐
│  Verify Organization    │
│  (org isolation check)  │
└─────────┬───────────────┘
          │
    ┌─────▼─────┐
    │ Same Org? │
    └─┬─────┬───┘
      │     │
   YES│     │NO
      │     └──────────┐
      │                ▼
      │          403 Forbidden
      │
      ▼
    Proceed to Handler
```

## Database Schema Architecture

### Multi-Tenant Design

```
                      ORGANIZATIONS
                      (Root Entity)
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
          USERS          PROJECTS        AUDIT_LOGS
            │                │                │
    ┌───────┴───────┐        │                │
    │               │        │                │
ADMIN           ENGINEER     │                │
    │               │        ▼                │
    │           ┌───────────────────────┐    │
    │           │ PROJECT_LOCATIONS     │    │
    │           │ EVIDENCE_POLICIES     │    │
    │           │ PROJECT_ENGINEERS(M2M)│   │
    │           └───────┬───────────────┘    │
    │                   │                    │
    │                   ▼                    │
    │            SITE_EVIDENCE               │
    │                   │                    │
    │                   ▼                    │
    │         EVIDENCE_ANALYSIS              │
    │                   │                    │
    └───────────────────┴────────────────────┘
         All scoped by organization_id
```

### Table Relationships

```
organizations (1) ────────────┬────── (N) users
                              │
                              ├────── (N) projects
                              │
                              ├────── (N) site_evidence
                              │
                              ├────── (N) daily_reports
                              │
                              ├────── (N) audit_logs
                              │
                              └────── (N) account_tokens

projects (1) ────────────┬──── (1) project_locations
                         │
                         ├──── (1) evidence_policies
                         │
                         ├──── (N) project_engineers
                         │
                         └──── (N) site_evidence

project_engineers (N:N) ─┬──── engineers
                         │
                         └──── projects

site_evidence (1) ────────────── (N) evidence_analysis
```

## Request Processing Pipeline

### Evidence Submission Pipeline

```
Engineer Uploads Image
    │
    ▼
┌──────────────────────┐
│ Request Validation   │
│ - Auth check         │
│ - Role check         │
│ - Org isolation      │
│ - Field validation   │
└──────┬───────────────┘
       │
    ┌──▼──┐
    │Pass?│
    └──┬──┘
       │
   ┌───▼───────────────────┐
   │ Geofence Verification │
   │ - Calculate distance  │
   │ - Check radius        │
   │ - Store accuracy      │
   └───┬───────────────────┘
       │
       ▼
┌──────────────────────┐
│ Image Processing     │
│ - SHA-256 hash       │
│ - Quality check      │
│ - Perceptual hash    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Store Evidence       │
│ - Database record    │
│ - File storage       │
│ - Metadata           │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Queue AI Analysis    │
│ - Create task        │
│ - Background job     │
│ - Asynchronous       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Return Response      │
│ - Evidence ID        │
│ - Status             │
│ - Location verified  │
└──────────────────────┘

[Asynchronous]
Background Worker
    │
    ▼
┌──────────────────────┐
│ AI Analysis Pipeline │
│ - Image Quality      │
│ - Duplicate Check    │
│ - CLIP Similarity    │
│ - YOLO Detection     │
│ - Stage Classifier   │
│ - Trust Score        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Store Results        │
│ - Update evidence    │
│ - Save analysis      │
│ - Update status      │
└──────────────────────┘
```

## API Route Architecture

```
┌─────────────────────────────────────────────┐
│              API ROUTES (v1)                 │
├─────────────────────────────────────────────┤
│                                              │
│  /api/auth/                                  │
│  ├── login                 [POST]            │
│  ├── refresh               [POST]            │
│  ├── activate              [POST]            │
│  ├── forgot-password       [POST]            │
│  └── reset-password        [POST]            │
│                                              │
│  /api/v1/engineers/                         │
│  ├── [GET]    List all                      │
│  ├── [POST]   Create new                    │
│  └── /[id]/                                  │
│      ├── [GET]    Details                    │
│      ├── [PUT]    Update                     │
│      └── [DELETE] Deactivate                │
│                                              │
│  /api/v1/projects/                          │
│  ├── [GET]    List all                      │
│  ├── [POST]   Create new                    │
│  └── /[id]/                                  │
│      ├── [GET]    Details                    │
│      ├── [PUT]    Update                     │
│      └── /assign-engineer                    │
│          └── [POST] Assign                   │
│                                              │
│  /api/v1/evidence/                          │
│  ├── [GET]    List (filtered)               │
│  └── [POST]   Submit evidence               │
│                                              │
│  /api/admin/                                 │
│  └── init               [POST] (One-time)    │
│                                              │
└─────────────────────────────────────────────┘
```

## Frontend Component Hierarchy

```
Root Layout
│
├── Providers (Toast)
│
└── Routes
    │
    ├── (auth)
    │   ├── /login
    │   ├── /activate
    │   └── /forgot-password
    │
    ├── (admin)
    │   └── admin/
    │       ├── /dashboard
    │       ├── /engineers
    │       │   └── [Create/List/Manage]
    │       └── /projects
    │           ├── [List/Create]
    │           └── /[id]
    │               └── [Details/Assign]
    │
    ├── (engineer)
    │   └── engineer/
    │       ├── /dashboard
    │       │   └── [Projects list]
    │       └── /projects/[id]/
    │           ├── [Project details]
    │           └── /capture
    │               └── [Camera/GPS/Submit]
    │
    └── /
        └── [Redirect logic]
```

## Security Architecture

### Multi-Layer Security

```
Layer 1: Transport
  ├── HTTPS/TLS (Production)
  ├── CORS headers
  └── Secure cookies

Layer 2: Authentication
  ├── Email/Password
  ├── bcryptjs (10 rounds)
  ├── JWT tokens
  └── Token refresh

Layer 3: Authorization
  ├── Role-based access
  ├── Organization isolation
  ├── Resource ownership
  └── Fine-grained permissions

Layer 4: Data Protection
  ├── SQL injection prevention (ORM)
  ├── XSS protection
  ├── Input validation
  └── Output encoding

Layer 5: Infrastructure
  ├── Environment variables
  ├── No hardcoded secrets
  ├── Error message masking
  └── Audit logging
```

### Data Flow with Security

```
User Request
    │
    ▼
HTTPS/TLS Encryption
    │
    ▼
Rate Limiting Check (Future)
    │
    ▼
Authentication Middleware
├─ Extract JWT
├─ Verify signature
├─ Check expiration
└─ Get user context

    │
    ▼
Authorization Middleware
├─ Check role
├─ Check organization
└─ Check resource ownership

    │
    ▼
Input Validation
├─ Type checking
├─ Format validation
└─ Business logic validation

    │
    ▼
Database Query (ORM)
├─ SQL injection prevention
├─ Organization scoping
└─ Audit logging

    │
    ▼
Response
├─ Error masking
├─ No sensitive data
└─ Encrypted (HTTPS)
```

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────┐
│   Developer Machine             │
├─────────────────────────────────┤
│                                 │
│  npm run dev                    │
│  │                              │
│  ├─ Next.js dev server :3000   │
│  │                              │
│  └─ PostgreSQL (local)          │
│     user: postgres              │
│     password: postgres          │
│     database: app_db            │
│                                 │
└─────────────────────────────────┘
```

### Production Environment

```
┌────────────────────────────────────────────────┐
│            Production Infrastructure           │
├────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │      Application Load Balancer          │  │
│  │      (AWS ALB / GCP Load Balancer)      │  │
│  └──────────────────┬──────────────────────┘  │
│                     │                          │
│         ┌───────────┼───────────┐             │
│         │           │           │             │
│         ▼           ▼           ▼             │
│      ┌────┐     ┌────┐     ┌────┐           │
│      │App │     │App │     │App │           │
│      │Pod │     │Pod │     │Pod │           │
│      │ 1  │     │ 2  │     │ 3  │           │
│      └────┘     └────┘     └────┘           │
│         │           │           │             │
│         └───────────┼───────────┘             │
│                     │                          │
│          ┌──────────▼──────────┐             │
│          │  PostgreSQL RDS     │             │
│          │  (Multi-AZ HA)      │             │
│          └──────────┬──────────┘             │
│                     │                          │
│         ┌───────────┴───────────┐            │
│         │                       │            │
│         ▼                       ▼            │
│    ┌──────────┐           ┌──────────┐     │
│    │S3 Bucket │           │ Redis    │     │
│    │(Evidence)│           │(Cache)   │     │
│    └──────────┘           └──────────┘     │
│                                              │
└────────────────────────────────────────────────┘
```

## Technology Stack Decision Tree

```
FRONTEND
├─ Framework?
│  └─ Next.js 16 ✅
│     ├─ SSR support
│     ├─ API routes
│     ├─ App Router
│     └─ TypeScript
│
├─ Language?
│  └─ TypeScript ✅
│     ├─ Type safety
│     ├─ IDE support
│     └─ Error prevention
│
├─ State Management?
│  └─ Zustand ✅
│     ├─ Simple
│     ├─ Lightweight
│     └─ Persist support
│
├─ HTTP Client?
│  └─ Axios ✅
│     ├─ Interceptors
│     ├─ Token refresh
│     └─ Error handling
│
└─ Styling?
   └─ Tailwind CSS ✅
      ├─ Utility-first
      ├─ Responsive
      └─ Performance

BACKEND
├─ Runtime?
│  └─ Node.js ✅
│     ├─ Same language
│     ├─ Async support
│     └─ npm ecosystem
│
├─ API Framework?
│  └─ Next.js API Routes ✅
│     ├─ Integrated
│     ├─ Serverless-ready
│     └─ Type-safe
│
├─ Database?
│  └─ PostgreSQL ✅
│     ├─ Relational
│     ├─ ACID compliance
│     ├─ Complex queries
│     └─ JSONB support
│
├─ ORM?
│  └─ Drizzle ORM ✅
│     ├─ Type-safe
│     ├─ No migrations
│     ├─ SQL generation
│     └─ Full control
│
├─ Authentication?
│  └─ JWT ✅
│     ├─ Stateless
│     ├─ Scalable
│     ├─ Standard
│     └─ Libraries available
│
└─ Password Hashing?
   └─ bcryptjs ✅
      ├─ Slow hash
      ├─ Salted
      ├─ Standard
      └─ Cross-platform

INFRASTRUCTURE
├─ Hosting?
│  └─ Multiple Options ✅
│     ├─ AWS (ECS/Lambda)
│     ├─ GCP (Cloud Run)
│     ├─ Azure (App Service)
│     └─ DigitalOcean
│
├─ Database Hosting?
│  └─ Managed Services ✅
│     ├─ AWS RDS
│     ├─ GCP Cloud SQL
│     ├─ Azure Database
│     └─ Heroku Postgres
│
├─ Storage?
│  └─ Cloud Object Storage ✅
│     ├─ AWS S3
│     ├─ GCP Cloud Storage
│     └─ Azure Blob
│
└─ CI/CD?
   └─ Multiple Options ✅
      ├─ GitHub Actions
      ├─ GitLab CI
      ├─ AWS CodePipeline
      └─ Cloud Build
```

## Error Handling Flow

```
Request Arrives
    │
    ▼
Try to Process
    │
    ├─ Validation Error
    │  └─→ 400 Bad Request + Message
    │
    ├─ Auth Failed
    │  └─→ 401 Unauthorized
    │
    ├─ Insufficient Permission
    │  └─→ 403 Forbidden
    │
    ├─ Resource Not Found
    │  └─→ 404 Not Found
    │
    ├─ Business Logic Error
    │  └─→ 400 Bad Request + Message
    │
    ├─ Database Error
    │  └─→ 500 Internal Error + Logging
    │
    └─ Unexpected Error
       └─→ 500 Internal Error + Logging

Response
├─ HTTP Status Code
├─ Error Message (User-friendly)
└─ (Maybe) Details (Debug-friendly in dev)
```

## Performance Optimization Areas

```
Frontend
├─ Code Splitting (Next.js)
├─ Image Optimization
├─ CSS-in-JS minification
└─ Client-side caching (Zustand)

Backend
├─ Database indexing
├─ Query optimization
├─ Connection pooling
└─ Response caching (Redis ready)

Database
├─ Strategic indexes
├─ Query plans
├─ Partitioning (Future)
└─ Replication (Future)

Infrastructure
├─ CDN for assets
├─ Load balancing
├─ Auto-scaling
└─ Regional distribution (Future)
```

---

This architecture is designed to be:
- **Scalable**: Horizontal scaling supported
- **Maintainable**: Clear separation of concerns
- **Secure**: Multi-layer security
- **Performant**: Optimized queries and caching
- **Flexible**: Ready for AI/ML integration
- **Future-proof**: Can evolve to meet new requirements
