# SITEPROOF AI — FINAL MASTER PROMPT

## Build a Startup-Ready AI-Powered Construction Evidence Verification SaaS Web Application

---

# 0. YOUR ROLE

You are an expert product development team consisting of:

* SaaS Product Architect
* Senior Full-Stack Engineer
* Next.js + TypeScript Engineer
* FastAPI Backend Engineer
* PostgreSQL Database Architect
* Machine Learning Engineer
* Deep Learning Engineer
* Computer Vision Engineer
* Cybersecurity Engineer
* DevOps Engineer
* UI/UX Designer
* QA and Testing Engineer

Your task is to design and build a **complete, functional, secure, scalable, production-minded web application**.

The product name is:

# SITEPROOF AI

### Tagline:

# Verify Work. Validate Evidence. Track Progress.

Do NOT build a simple prototype.

Do NOT build a frontend-only demo.

Do NOT use fake hardcoded data as the final implementation.

Build a real database-driven application with real authentication, authorization, APIs, file handling, AI/ML modules, image processing, and deployment architecture.

The application must be designed as:

```text
COLLEGE MAJOR PROJECT
        ↓
FUNCTIONAL MVP
        ↓
PILOT WITH CONSTRUCTION DEPARTMENTS
        ↓
COMMERCIAL B2B SaaS PRODUCT
```

---

# 1. PRODUCT VISION

SiteProof AI is an **AI-powered construction site evidence verification and visual monitoring platform**.

The system helps construction organizations verify whether field evidence submitted by engineers is reliable.

The core question SiteProof AI should help answer is:

> **"Can this submitted construction site evidence be trusted?"**

The platform must combine:

* GPS Location Verification
* Geofencing
* Live Browser Camera Capture
* Secure Server Timestamp
* Daily Evidence Requirements
* Image Quality Analysis
* Duplicate Image Detection
* Near-Duplicate Detection
* Photo Diversity Analysis
* Object Detection
* Construction Stage Classification
* Historical Image Comparison
* Visual Change Detection
* Evidence Trust Score
* Suspicious Evidence Detection
* Department Monitoring Dashboard

---

# 2. CURRENT PRODUCT PLATFORM

The current implementation must be:

# WEB APPLICATION

The web application must work on:

* Desktop
* Laptop
* Tablet
* Mobile Browser

The Engineer interface must be **mobile-first and responsive** because engineers may use smartphones at construction sites.

The Department Admin interface should be optimized for:

* Desktop
* Laptop
* Tablet

The backend must be API-first so future applications can use the same APIs:

* Android App
* iOS App
* Mobile App
* Future Third-Party Integrations

---

# 3. SUPPORTED CONSTRUCTION TYPES

Version 1 officially supports only:

# 🏢 BUILDING CONSTRUCTION

and

# 🛣️ ROAD CONSTRUCTION

The application architecture must support future project types, but do not implement unnecessary project types now.

Future:

* Bridge Construction
* Pipeline Construction
* Railway Infrastructure
* Solar Infrastructure
* Water Infrastructure

---

# 4. IMPORTANT ML ARCHITECTURE

Do NOT train one construction-stage model for all construction types.

Building construction and road construction have different stages.

Therefore:

# BUILDING CONSTRUCTION → BUILDING ML MODEL

# ROAD CONSTRUCTION → ROAD ML MODEL

Architecture:

```text
                    SITEPROOF AI
                         │
                         ▼
                  PROJECT TYPE
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
      BUILDING PROJECT          ROAD PROJECT
             │                       │
             ▼                       ▼
      BUILDING AI PIPELINE      ROAD AI PIPELINE
             │                       │
             ▼                       ▼
      BUILDING ML MODEL         ROAD ML MODEL
             │                       │
             └───────────┬───────────┘
                         ▼
                  AI ANALYSIS
```

The project type must automatically determine which ML model is used.

The Engineer must NOT manually select the ML model.

---

# 5. USER ROLES

The current system has two main user roles:

## ROLE 1: DEPARTMENT ADMIN

The Department Admin represents:

* Construction Department
* Government Construction Organization
* Infrastructure Organization
* Private Construction Company

Department Admin can:

* Login securely
* Manage organization data
* Create Engineers
* Edit Engineers
* Activate Engineers
* Deactivate Engineers
* Create Projects
* Edit Projects
* Configure Project Type
* Configure Site Location
* Configure Geofence
* Configure Evidence Policies
* Assign Engineers to Projects
* View Evidence
* View Daily Reports
* View AI Analysis
* View Construction Stage Predictions
* View Suspicious Evidence
* Approve Evidence
* Flag Evidence
* Request Recapture
* View Project History
* View Analytics

---

## ROLE 2: ENGINEER

Engineer is a field user.

Engineer can:

* Login securely
* View assigned projects
* View project details
* View daily evidence requirements
* Verify current GPS location
* Capture live images
* Submit site evidence
* View submission history
* View evidence status
* View recapture requests

Engineer must only access projects assigned to them.

Engineer must NOT be able to:

* Create Projects
* Edit Site Location
* Change Geofence
* Change Evidence Policies
* Create Engineers
* Access other Engineers' projects
* Access other organization data

---

# 6. MULTI-ORGANIZATION ARCHITECTURE

Even if the first deployment is for one department, the system must be designed for multiple organizations.

Create:

# Organization Entity

Example:

```text
Organization A

Gorakhpur Construction Department
```

```text
Organization B

ABC Infrastructure Company
```

Every user belongs to an organization.

Every Project belongs to an organization.

Every Engineer belongs to an organization.

Every Evidence record belongs to an organization.

All data must be isolated using:

```text
organization_id
```

Critical security requirement:

> A user from Organization A must NEVER access Organization B data.

---

# 7. AUTHENTICATION SYSTEM

Implement a real authentication system.

Use:

* Email
* Password
* Secure Password Hashing
* JWT Access Token
* JWT Refresh Token
* Role-Based Authorization
* Organization-Based Authorization

Never store plain passwords.

Never hardcode passwords in source code.

---

# 8. DEPARTMENT ADMIN ONBOARDING

Do NOT create a public Department Admin signup page by default.

The system should support secure onboarding.

Example:

```text
Organization Created
        ↓
Department Admin Email Added
        ↓
Account Created
        ↓
Secure Email Sent
        ↓
Admin Sets Password
        ↓
Account Activated
```

For initial deployment:

An initial Department Admin can be created through secure environment configuration or an onboarding command.

Example environment variables:

```text
INITIAL_ADMIN_EMAIL

INITIAL_ADMIN_PASSWORD
```

The password must be hashed before storing in the database.

After deployment, authentication must use the database.

Do NOT continuously use environment credentials as login credentials.

---

# 9. ENGINEER ACCOUNT CREATION

Department Admin creates Engineer accounts.

Engineer creation form:

* Full Name
* Official Email
* Phone Number
* Employee ID
* Designation (Optional)

When Engineer is created:

```text
Department Admin
        ↓
Create Engineer
        ↓
User Record Created
        ↓
Role = ENGINEER
        ↓
Organization Assigned
        ↓
Secure Password Setup Email
```

---

# 10. EMAIL ACCOUNT ACTIVATION

Use secure email-based account activation.

Do NOT send permanent passwords through email.

Workflow:

```text
Engineer Account Created
        ↓
Generate Secure One-Time Token
        ↓
Store Token Hash
        ↓
Set Expiration
        ↓
Send Email
        ↓
Engineer Clicks Link
        ↓
Sets Password
        ↓
Account Activated
        ↓
Token Invalidated
```

Email example:

```text
Welcome to SiteProof AI.

Your Engineer account has been created.

Click the secure link below to set your password.
```

The activation token must:

* Be cryptographically secure
* Have expiration
* Be single-use
* Be stored securely
* Be invalidated after use

---

# 11. LOGIN

Login page:

```text
Email

Password

[ LOGIN ]

Forgot Password?
```

Login flow:

```text
Email
      ↓
Find User
      ↓
Verify Password Hash
      ↓
Verify Active Status
      ↓
Identify Role
      ↓
Generate JWT
      ↓
Redirect to Correct Dashboard
```

Department Admin:

```text
Department Admin Dashboard
```

Engineer:

```text
Engineer Dashboard
```

Do NOT send an email for every normal login.

---

# 12. FORGOT PASSWORD

Login page must include:

# Forgot Password?

Workflow:

```text
User Clicks Forgot Password
        ↓
Enter Email
        ↓
Generate Secure Reset Token
        ↓
Store Token Hash
        ↓
Token Expiration
        ↓
Send Reset Email
        ↓
User Clicks Reset Link
        ↓
Set New Password
        ↓
Invalidate Token
        ↓
Login
```

The system must not reveal whether an email exists.

Always show a generic message such as:

> If an account exists for this email, password reset instructions have been sent.

---

# 13. EMAIL SYSTEM

Implement an email abstraction layer.

Development:

Use:

* Mailpit or MailHog

Production architecture should support:

* Resend
* AWS SES
* SendGrid

Email service must be configurable through environment variables.

Email templates required:

* Account Activation
* Engineer Invitation
* Password Reset
* Password Changed (Optional)
* Account Deactivated (Optional)

---

# 14. DEPARTMENT ADMIN DASHBOARD

Create a professional B2B SaaS dashboard.

Show:

* Total Projects
* Active Projects
* Total Engineers
* Active Engineers
* Today's Evidence Requirements
* Completed Submissions
* Pending Submissions
* Suspicious Evidence
* Projects Requiring Attention

Include:

* Recent Activity
* Recent Evidence
* Suspicious Alerts
* Project Progress Overview
* Submission Trends
* Evidence Completion Statistics

Use:

* Cards
* Charts
* Tables
* Alerts
* Status Badges

Do NOT create a generic student project dashboard.

---

# 15. ENGINEER MANAGEMENT

Department Admin must have:

# Engineer Management

Features:

* Add Engineer
* View Engineers
* Search Engineers
* Filter Engineers
* Edit Engineer
* Activate Engineer
* Deactivate Engineer
* View Assigned Projects
* View Submission Statistics
* Resend Invitation

Engineer table:

```text
Name

Employee ID

Email

Designation

Status

Assigned Projects

Last Activity

Actions
```

---

# 16. PROJECT MANAGEMENT

Department Admin creates projects.

Project fields:

* Project Name
* Project Description
* Project Type
* Project Status
* Start Date
* Expected Completion Date

Project Type:

```text
BUILDING

ROAD
```

Project Status:

```text
PLANNED

ACTIVE

PAUSED

COMPLETED

CANCELLED
```

---

# 17. PROJECT TYPE AND AI MODEL ROUTING

When Department Admin creates a Project:

```text
PROJECT TYPE

○ Building Construction

○ Road Construction
```

The backend stores:

```text
project_type
```

Example:

```text
BUILDING
```

or:

```text
ROAD
```

During AI analysis:

```text
IF project_type == BUILDING

Use Building ML Model
```

```text
IF project_type == ROAD

Use Road ML Model
```

The Engineer must not select models manually.

---

# 18. SITE LOCATION

Every Project has a physical location.

Department Admin must configure:

* Latitude
* Longitude
* Address
* Geofence Radius

Use a map interface.

Example:

```text
Latitude: 26.xxxxx

Longitude: 83.xxxxx

Allowed Radius:

100 meters
```

Store accurate location data.

---

# 19. GEOFENCING

Before evidence capture:

```text
Engineer Selects Project
        ↓
Request Location Permission
        ↓
Get Current Location
        ↓
Get GPS Accuracy
        ↓
Calculate Distance
        ↓
Compare With Geofence
```

If inside allowed radius:

```text
SITE VERIFIED
```

Allow camera capture.

If outside:

```text
SITE NOT VERIFIED
```

Show:

```text
Current Distance

Allowed Radius

GPS Accuracy

Verification Status
```

---

# 20. LOCATION CALCULATION

Use a proper geographical distance algorithm.

Recommended:

# Haversine Formula

Do NOT use ML for GPS distance calculation.

Store:

* Latitude
* Longitude
* GPS Accuracy
* Distance From Site
* Verification Timestamp

---

# 21. GPS ERROR HANDLING

Handle:

* Location Permission Denied
* GPS Disabled
* GPS Unavailable
* Low Accuracy
* Browser Does Not Support Geolocation

Do not silently accept inaccurate locations.

Example:

```text
GPS Accuracy:

150 meters

Status:

LOW LOCATION ACCURACY

Please wait for a better GPS signal.
```

Allow configurable accuracy thresholds.

---

# 22. LIVE CAMERA CAPTURE

Evidence must primarily be captured using the device camera.

Use browser APIs such as:

```text
getUserMedia()
```

Engineer flow:

```text
Select Project
        ↓
Verify Location
        ↓
Open Camera
        ↓
Live Camera Preview
        ↓
Capture Image
        ↓
Validate Image
        ↓
Submit Evidence
```

The interface must display:

* Project Name
* Location Status
* Current GPS Accuracy
* Evidence Progress
* Required Evidence Category
* Camera Preview
* Capture Button

Example:

```text
PROJECT

Road Construction Project A

LOCATION

VERIFIED ✓

TODAY'S EVIDENCE

2 / 5

CURRENT TASK

Capture Active Work Area

[ CAPTURE PHOTO ]
```

---

# 23. IMPORTANT WEB APP SECURITY LIMITATION

Because this is a browser-based web application, do NOT falsely claim that browser camera capture alone makes an image impossible to fake.

Clearly design the product as:

# Multi-Signal Evidence Verification

Do NOT claim:

> "100% fraud proof."

The system should evaluate multiple signals.

---

# 24. DAILY EVIDENCE POLICY

Each Project must have configurable evidence requirements.

Do NOT permanently hardcode five images.

Default:

```text
Minimum Images Per Day:

5
```

Department Admin can configure:

* Minimum Images
* Maximum Images
* Submission Frequency
* Required Categories

Example:

```text
Small Project

Minimum 3 Photos
```

```text
Medium Project

Minimum 5 Photos
```

```text
Large Project

Minimum 10 Photos
```

---

# 25. AI-GUIDED EVIDENCE CATEGORIES

Default categories:

1. Wide Site View
2. Active Work Area
3. Different Work Section
4. Equipment or Materials
5. Progress Close-Up

Engineer sees:

```text
DAILY EVIDENCE CHECKLIST

✓ Wide Site View

✓ Active Work Area

○ Different Work Section

○ Equipment / Materials

○ Progress Close-Up
```

The application should guide the Engineer instead of allowing random evidence submission.

---

# 26. IMAGE QUALITY ANALYSIS

Implement Image Processing.

Use:

# OpenCV

Detect:

* Blur
* Excessive Darkness
* Excessive Brightness
* Low Resolution

Example:

```text
IMAGE QUALITY

Blur Score:

Low

Brightness:

Normal

Resolution:

Valid

Status:

ACCEPTABLE
```

If image quality is poor:

```text
Image quality is insufficient.

Please capture another image.
```

Do not use ML where traditional image processing is sufficient.

---

# 27. EXACT DUPLICATE DETECTION

Use:

# SHA-256

Purpose:

Detect identical files.

Workflow:

```text
Image
      ↓
SHA-256 Hash
      ↓
Compare With Existing Evidence
      ↓
Duplicate?
```

If exact duplicate:

```text
POSSIBLE DUPLICATE
```

Do not immediately accuse the Engineer of fraud.

---

# 28. NEAR-DUPLICATE DETECTION

Use:

# Perceptual Hashing

Examples:

* pHash
* dHash
* aHash

Detect images that are:

* Resized
* Compressed
* Slightly edited
* Slightly rotated

Output:

```text
Near Duplicate Risk:

HIGH
```

---

# 29. IMAGE SIMILARITY USING DEEP LEARNING

Use a pre-trained vision embedding model.

Recommended:

# CLIP

Use CLIP for:

* Semantic Image Similarity
* Scene Similarity
* Photo Diversity Analysis
* Near Duplicate Investigation

Workflow:

```text
Image A
       ↓
CLIP Embedding
       ↓

Image B
       ↓
CLIP Embedding
       ↓

Cosine Similarity
```

Example:

```text
Similarity:

92%

Result:

Highly Similar Scene
```

---

# 30. PHOTO DIVERSITY ANALYSIS

Engineers must not submit five nearly identical images.

Analyze all daily evidence.

Example:

```text
Photo 1

Photo 2

Photo 3

Photo 4

Photo 5

        ↓

Image Embeddings

        ↓

Similarity Matrix

        ↓

Photo Diversity Score
```

Example:

```text
PHOTO DIVERSITY

88%

Status:

GOOD
```

If multiple images are very similar:

```text
Photos appear too similar.

Please capture a different area of the construction site.
```

---

# 31. OBJECT DETECTION

Use:

# YOLO

Object detection must be designed as a modular service.

YOLO should be used to detect relevant construction objects.

---

# 32. BUILDING OBJECT DETECTION

Relevant objects may include:

* Worker
* Excavator
* Concrete Mixer
* Crane
* Scaffolding
* Bricks
* Construction Equipment

Do not claim detection accuracy without evaluation.

Store:

* Object Label
* Confidence
* Bounding Box

---

# 33. ROAD OBJECT DETECTION

Relevant objects may include:

* Worker
* Excavator
* Road Roller
* Dump Truck
* Paver
* Construction Machinery
* Construction Equipment

The model should support future fine-tuning using construction-specific datasets.

---

# 34. BUILDING CONSTRUCTION ML MODEL

Create a separate ML model for:

# BUILDING CONSTRUCTION STAGE CLASSIFICATION

Recommended base architecture:

# EfficientNet-B0

Alternative:

* ResNet
* MobileNet
* Vision Transformer

EfficientNet-B0 is recommended initially because it is lightweight and practical.

---

# 35. BUILDING CONSTRUCTION STAGES

Initial training classes:

```text
1. SITE_PREPARATION

2. EXCAVATION

3. FOUNDATION

4. STRUCTURAL_WORK

5. BRICKWORK_MASONRY

6. PLASTERING

7. FINISHING

8. COMPLETED
```

Architecture:

```text
Building Site Image
        ↓
Building Stage Classifier
        ↓
Predicted Stage
        ↓
Confidence
```

Example:

```text
PREDICTED STAGE

BRICKWORK_MASONRY

CONFIDENCE

87%
```

---

# 36. ROAD CONSTRUCTION ML MODEL

Create a separate ML model for:

# ROAD CONSTRUCTION STAGE CLASSIFICATION

Recommended base architecture:

# EfficientNet-B0

Use transfer learning.

---

# 37. ROAD CONSTRUCTION STAGES

Initial training classes:

```text
1. SITE_PREPARATION

2. EARTHWORK

3. SUBGRADE_PREPARATION

4. GRANULAR_SUBBASE

5. BASE_COURSE

6. ASPHALT_BITUMINOUS_LAYER

7. FINISHED_ROAD
```

Architecture:

```text
Road Construction Image
        ↓
Road Stage Classifier
        ↓
Predicted Stage
        ↓
Confidence
```

Example:

```text
PREDICTED STAGE

ASPHALT_BITUMINOUS_LAYER

CONFIDENCE

89%
```

---

# 38. IMPORTANT ML LIMITATION

Do NOT assume that one construction image always contains only one construction stage.

Real construction sites may contain:

* Multiple activities
* Different work sections
* Different construction stages

Therefore:

Version 1 can use:

# Primary Stage Classification

Future architecture should support:

# Multi-Label Classification

Do NOT present ML predictions as absolute truth.

Use:

```text
AI Prediction

Confidence

Needs Review
```

when appropriate.

---

# 39. ML DATASET STRUCTURE

Building dataset:

```text
datasets/

building/

├── site_preparation/
├── excavation/
├── foundation/
├── structural_work/
├── brickwork_masonry/
├── plastering/
├── finishing/
└── completed/
```

Road dataset:

```text
datasets/

road/

├── site_preparation/
├── earthwork/
├── subgrade_preparation/
├── granular_subbase/
├── base_course/
├── asphalt_bituminous_layer/
└── finished_road/
```

Dataset pipeline should support:

* Training
* Validation
* Testing
* Data Augmentation
* Dataset Versioning

---

# 40. ML TRAINING REQUIREMENTS

Use:

* PyTorch
* torchvision
* Transfer Learning

Recommended workflow:

```text
Collect Dataset
        ↓
Clean Dataset
        ↓
Label Images
        ↓
Train/Validation/Test Split
        ↓
Data Augmentation
        ↓
Fine-Tune Pretrained Model
        ↓
Evaluate Model
        ↓
Save Model
        ↓
Inference API
```

Do NOT train models directly inside API request handlers.

Training must be separate from production inference.

---

# 41. DATA AUGMENTATION

Support appropriate augmentation:

* Horizontal Flip where valid
* Small Rotation
* Brightness Adjustment
* Contrast Adjustment
* Resize
* Random Crop

Do not apply augmentations that make construction stages unrealistic.

---

# 42. MODEL EVALUATION

Evaluate models using:

* Accuracy
* Precision
* Recall
* F1 Score
* Confusion Matrix

Save:

* Model Version
* Training Date
* Dataset Version
* Metrics

Do not claim accuracy without real evaluation.

---

# 43. ML MODEL VERSIONING

Every AI prediction must store:

```text
model_type

model_version

prediction

confidence
```

Example:

```text
model_type:

BUILDING_STAGE_CLASSIFIER

model_version:

1.0.0

prediction:

BRICKWORK_MASONRY

confidence:

0.87
```

---

# 44. AI MODEL ROUTING

Implement:

```text
Project Type
       ↓
AI Router
       │
       ├───────────────┐
       ▼               ▼
BUILDING MODEL     ROAD MODEL
       │               │
       └───────┬───────┘
               ▼
          AI RESULT
```

The router must be modular.

Future:

```text
BUILDING

ROAD

BRIDGE

PIPELINE
```

---

# 45. COMPLETE AI PIPELINE

Each evidence image should pass through:

```text
SITE IMAGE
    │
    ▼
IMAGE VALIDATION
    │
    ▼
IMAGE QUALITY ANALYSIS
(OpenCV)
    │
    ▼
EXACT DUPLICATE CHECK
(SHA-256)
    │
    ▼
NEAR DUPLICATE CHECK
(pHash)
    │
    ▼
SEMANTIC SIMILARITY
(CLIP)
    │
    ▼
OBJECT DETECTION
(YOLO)
    │
    ▼
PROJECT TYPE ROUTER
    │
    ├───────────────┐
    ▼               ▼
BUILDING MODEL   ROAD MODEL
    │               │
    └───────┬───────┘
            ▼
STAGE PREDICTION
            │
            ▼
AI ANALYSIS RESULT
```

The system should not unnecessarily run expensive AI models synchronously if it creates a poor user experience.

Design for asynchronous analysis.

---

# 46. ASYNCHRONOUS AI PROCESSING

Evidence upload should:

```text
Engineer Uploads Image
        ↓
Image Stored
        ↓
Evidence Record Created
        ↓
Analysis Job Created
        ↓
Background Worker
        ↓
AI Analysis
        ↓
Save Results
        ↓
Update Dashboard
```

Use a background task architecture.

Recommended:

* Celery + Redis

Alternative:

* RQ
* FastAPI Background Tasks for simple development only

For production architecture, prefer a proper task queue.

---

# 47. EVIDENCE METADATA

Store:

```text
Evidence ID

Organization ID

Project ID

Engineer ID

Evidence Category

Image Path

Image SHA-256

Perceptual Hash

Capture Timestamp

Server Submission Timestamp

Latitude

Longitude

GPS Accuracy

Distance From Site

Location Verification Status

Verification Status

Created At
```

Do NOT rely only on EXIF data.

Server-side timestamp is required.

---

# 48. EVIDENCE ANALYSIS TABLE

Store AI analysis separately.

Example:

```text
evidence_analysis

id

evidence_id

model_type

model_version

predicted_stage

confidence

detected_objects

quality_score

duplicate_score

similarity_score

created_at
```

---

# 49. EVIDENCE TRUST SCORE

Create a transparent Evidence Trust Score.

Possible signals:

* Location Verification
* GPS Accuracy
* Image Quality
* Exact Duplicate
* Near Duplicate
* Photo Diversity
* Required Category
* Timestamp Consistency

Do NOT blindly use ML for every score.

Use a hybrid:

# Rule-Based + AI Signals

Example:

```text
Location:

100%

Image Quality:

90%

Photo Diversity:

88%

Duplicate Risk:

Low

Overall Trust Score:

91/100
```

---

# 50. TRUST SCORE STATUS

Use:

```text
80–100

HIGH CONFIDENCE
```

```text
50–79

NEEDS REVIEW
```

```text
0–49

SUSPICIOUS
```

Thresholds must be configurable.

Do NOT say:

```text
Fraud Confirmed
```

unless a verified human investigation exists.

Use:

* Suspicious
* Needs Review
* Possible Duplicate
* Location Mismatch

---

# 51. DAILY EVIDENCE WORKFLOW

Engineer workflow:

```text
LOGIN
    ↓
VIEW ASSIGNED PROJECTS
    ↓
SELECT PROJECT
    ↓
CHECK DAILY REQUIREMENT
    ↓
VERIFY LOCATION
    ↓
OPEN LIVE CAMERA
    ↓
CAPTURE IMAGE
    ↓
IMAGE VALIDATION
    ↓
SUBMIT EVIDENCE
    ↓
REPEAT REQUIRED CATEGORIES
    ↓
DAILY REQUIREMENT COMPLETED
    ↓
BACKGROUND AI ANALYSIS
    ↓
DAILY REPORT
```

---

# 52. DAILY SITE REPORT

Automatically generate a Daily Site Report.

Include:

* Project Name
* Project Type
* Date
* Engineer
* Required Photos
* Submitted Photos
* Location Verification
* Average GPS Accuracy
* Image Quality
* Photo Diversity
* Duplicate Results
* Detected Objects
* AI Predicted Construction Stage
* AI Confidence
* Evidence Trust Score
* Status

Example:

```text
DAILY SITE REPORT

Project:

Road Construction Project A

Project Type:

ROAD

Date:

02 September 2026

Engineer:

Engineer Name

Photos:

5 / 5

Location:

VERIFIED

Photo Diversity:

88%

Possible Duplicates:

0

AI Stage:

BASE_COURSE

Confidence:

86%

Evidence Trust Score:

91 / 100

Status:

HIGH CONFIDENCE
```

---

# 53. HISTORICAL VISUAL COMPARISON

Implement:

* Previous Day vs Current Day
* Before vs After
* Evidence Timeline
* Historical Photo Gallery

Use image similarity and change analysis.

Do NOT claim:

```text
Construction is exactly 72% complete
```

unless a properly trained and validated progress estimation model exists.

For Version 1 use:

```text
Visual Change Detected

or

No Significant Visual Change Detected
```

Mark experimental AI features clearly.

---

# 54. SUSPICIOUS EVIDENCE CENTER

Department Admin must have a page:

# SUSPICIOUS EVIDENCE

Show:

* Possible Duplicates
* Near Duplicates
* Location Mismatch
* Low GPS Accuracy
* Poor Image Quality
* Insufficient Daily Evidence
* Highly Similar Images
* AI Analysis Problems

Example:

```text
PROJECT

Road Project A

ENGINEER

Engineer Name

ISSUE

Possible Duplicate Image

SIMILARITY

96%

STATUS

NEEDS REVIEW
```

Actions:

* View Evidence
* Approve
* Flag
* Request Recapture

---

# 55. EVIDENCE REVIEW

Department Admin should be able to:

```text
APPROVE
```

```text
FLAG
```

```text
REQUEST RECAPTURE
```

When requesting recapture:

Admin can enter:

```text
Reason

Please capture a clearer image of the active work area.
```

Engineer sees the request.

---

# 56. DEPARTMENT ADMIN PROJECT DASHBOARD

Each Project must have:

* Project Information
* Project Type
* Site Location
* Geofence
* Assigned Engineers
* Evidence Policy
* Daily Evidence Status
* Evidence Timeline
* Recent Images
* AI Predictions
* Detected Objects
* Suspicious Evidence
* Daily Reports
* Historical Reports

---

# 57. ENGINEER DASHBOARD

Engineer dashboard must be mobile-friendly.

Show:

```text
Welcome, Engineer

MY ASSIGNED PROJECTS

Road Project A

Evidence Today:

3 / 5

Status:

IN PROGRESS

[ CONTINUE ]
```

Also show:

* Pending Recapture Requests
* Completed Evidence
* Recent Activity

---

# 58. DATABASE DESIGN

Use:

# PostgreSQL

Core tables:

```text
organizations

users

projects

project_locations

project_engineers

evidence_policies

evidence_categories

site_evidence

evidence_analysis

daily_reports

suspicious_events

account_tokens

audit_logs
```

---

# 59. ORGANIZATIONS TABLE

Fields:

```text
id

name

organization_type

email

phone

address

is_active

created_at

updated_at
```

---

# 60. USERS TABLE

Fields:

```text
id

organization_id

name

email

phone

employee_id

designation

password_hash

role

is_active

email_verified

created_at

updated_at
```

Roles:

```text
DEPARTMENT_ADMIN

ENGINEER
```

Email must be unique globally or according to a clearly defined organization policy.

---

# 61. PROJECTS TABLE

```text
id

organization_id

name

description

project_type

status

start_date

expected_completion_date

created_at

updated_at
```

Project Type:

```text
BUILDING

ROAD
```

---

# 62. PROJECT LOCATIONS TABLE

```text
id

project_id

latitude

longitude

address

geofence_radius_meters

created_at

updated_at
```

---

# 63. PROJECT ENGINEERS TABLE

```text
id

project_id

engineer_id

assigned_at

is_active
```

---

# 64. EVIDENCE POLICIES TABLE

```text
id

project_id

minimum_images

maximum_images

frequency

created_at

updated_at
```

---

# 65. SITE EVIDENCE TABLE

```text
id

organization_id

project_id

engineer_id

evidence_category_id

image_path

image_hash

perceptual_hash

capture_timestamp

submission_timestamp

latitude

longitude

gps_accuracy

distance_from_site

location_verified

verification_status

created_at
```

---

# 66. ACCOUNT TOKENS TABLE

Use for:

* Account Activation
* Password Reset

Fields:

```text
id

user_id

token_hash

token_type

expires_at

used_at

created_at
```

Token Type:

```text
ACCOUNT_ACTIVATION

PASSWORD_RESET
```

Never store raw tokens.

---

# 67. AUDIT LOGS

Log important actions.

Examples:

* Engineer Created
* Engineer Edited
* Engineer Deactivated
* Project Created
* Project Updated
* Project Location Changed
* Engineer Assigned
* Evidence Submitted
* Evidence Approved
* Evidence Flagged
* Recapture Requested

Fields:

```text
id

organization_id

user_id

action

resource_type

resource_id

metadata

created_at
```

---

# 68. BACKEND TECHNOLOGY

Use:

# Python

# FastAPI

Use:

* Pydantic
* SQLAlchemy
* Alembic
* PostgreSQL

Architecture:

```text
backend/

app/

├── api/
│   └── v1/
│
├── core/
│
├── database/
│
├── models/
│
├── schemas/
│
├── services/
│
├── repositories/
│
├── auth/
│
├── ai/
│
├── tasks/
│
├── storage/
│
├── utils/
│
└── tests/
```

Use clean separation of concerns.

---

# 69. FRONTEND TECHNOLOGY

Use:

# Next.js

# TypeScript

Recommended:

* App Router
* Tailwind CSS
* Professional UI component system

Create reusable components.

Suggested frontend structure:

```text
frontend/

src/

├── app/
│
├── components/
│
├── features/
│
├── services/
│
├── hooks/
│
├── types/
│
└── utils/
```

---

# 70. UI/UX REQUIREMENTS

Design a professional:

# B2B SaaS APPLICATION

Design must be:

* Modern
* Clean
* Professional
* Minimal
* Trustworthy
* Enterprise-Oriented

Use:

* Responsive Layout
* Sidebar Navigation
* Dashboard Cards
* Tables
* Charts
* Status Badges
* Alerts
* Loading States
* Empty States
* Error States
* Confirmation Dialogs

Do NOT create a childish UI.

Do NOT create a generic college project appearance.

---

# 71. IMAGE STORAGE

Do NOT store large image files directly inside PostgreSQL.

Store:

```text
Image File → Object/File Storage

Database → Metadata + Storage Path
```

Development:

* Local Storage or MinIO

Production:

Design support for:

* AWS S3
* S3-Compatible Storage

Create a storage abstraction layer.

---

# 72. AI TECHNOLOGY STACK

Use:

# Python

# PyTorch

# OpenCV

# YOLO

# CLIP

# EfficientNet-B0

# FAISS

where appropriate.

Do not force every technology into the first release if unnecessary.

The architecture must remain modular.

---

# 73. AI FOLDER STRUCTURE

```text
backend/

app/

ai/

├── common/
│   ├── image_quality.py
│   ├── duplicate_detection.py
│   └── similarity.py
│
├── object_detection/
│   └── yolo_service.py
│
├── building/
│   ├── classifier.py
│   ├── inference.py
│   └── models/
│
├── road/
│   ├── classifier.py
│   ├── inference.py
│   └── models/
│
├── router.py
│
└── schemas.py
```

---

# 74. ASYNCHRONOUS TASKS

Use:

# Redis

and preferably:

# Celery

for:

* AI Analysis
* Image Processing
* Report Generation
* Email Sending

Do not block API requests while heavy AI processing runs.

---

# 75. API DESIGN

Use REST APIs.

Version APIs:

```text
/api/v1/
```

Modules:

```text
/auth

/users

/engineers

/projects

/project-locations

/evidence

/reports

/analytics

/suspicious-events
```

Example:

```text
POST /api/v1/auth/login

POST /api/v1/auth/forgot-password

POST /api/v1/auth/reset-password

POST /api/v1/users/engineers

GET /api/v1/users/engineers

POST /api/v1/projects

GET /api/v1/projects

POST /api/v1/projects/{id}/assign-engineer

POST /api/v1/evidence

GET /api/v1/evidence

GET /api/v1/reports/daily

GET /api/v1/suspicious-events
```

---

# 76. API SECURITY

Every protected API must enforce:

```text
Authentication
        +
Role Authorization
        +
Organization Isolation
```

Example:

```text
Engineer

Cannot access:

Other Engineer's Evidence
```

```text
Organization A

Cannot access:

Organization B Projects
```

Do not rely only on frontend route protection.

All authorization must be enforced by backend.

---

# 77. SECURITY REQUIREMENTS

Implement:

* Secure Password Hashing
* JWT Authentication
* Refresh Token Strategy
* Role-Based Access Control
* Organization Isolation
* Input Validation
* Secure File Validation
* File Size Limits
* Allowed File Types
* Environment Variables
* CORS Configuration
* Secure Error Handling
* Audit Logging
* Token Expiration
* Token Single Use
* Rate Limiting Architecture

Never expose:

* Password Hash
* JWT Secret
* Database Password
* Email API Key

---

# 78. ENVIRONMENT VARIABLES

Create:

```text
.env.example
```

Example:

```text
DATABASE_URL=

JWT_SECRET=

JWT_ACCESS_TOKEN_EXPIRE_MINUTES=

JWT_REFRESH_TOKEN_EXPIRE_DAYS=

EMAIL_PROVIDER=

EMAIL_API_KEY=

EMAIL_FROM=

REDIS_URL=

STORAGE_TYPE=

STORAGE_PATH=

S3_BUCKET=

ENVIRONMENT=
```

Never commit:

```text
.env
```

---

# 79. TESTING

Implement testing.

Backend tests:

* Authentication Tests
* Password Reset Tests
* Account Activation Tests
* Role Authorization Tests
* Organization Isolation Tests
* Engineer Management Tests
* Project Assignment Tests
* Geofence Tests
* Evidence Submission Tests

Critical test:

```text
Engineer from Organization A

MUST NOT access

Organization B Data
```

---

# 80. ML TESTING

Evaluate ML models separately.

Include:

* Dataset Validation
* Model Evaluation
* Accuracy
* Precision
* Recall
* F1 Score
* Confusion Matrix

Do not mix:

```text
Application Testing
```

with:

```text
ML Model Evaluation
```

---

# 81. DEPLOYMENT

The application must be container-ready.

Provide:

```text
Dockerfile
```

```text
docker-compose.yml
```

Services:

```text
Frontend

Backend

PostgreSQL

Redis

Celery Worker

Email Development Service
```

Optional:

```text
MinIO
```

---

# 82. DEVELOPMENT ENVIRONMENTS

Support:

```text
DEVELOPMENT
```

```text
TESTING
```

```text
PRODUCTION
```

Configuration must change through environment variables.

---

# 83. DOCUMENTATION

Create:

```text
README.md
```

Include:

* Product Overview
* Features
* Architecture
* Technology Stack
* Installation
* Environment Setup
* Database Setup
* Running Locally
* Docker Setup
* API Documentation
* ML Modules
* Testing
* Deployment

Create:

```text
docs/

architecture.md

database-design.md

api-design.md

ml-architecture.md

security.md

deployment.md
```

---

# 84. DEVELOPMENT PHASES

Do NOT attempt to build everything randomly.

Build systematically.

---

## PHASE 1 — FOUNDATION

Implement:

* Repository Structure
* Docker
* PostgreSQL
* FastAPI
* Next.js
* Environment Configuration
* Database Connection
* Alembic Migrations

---

## PHASE 2 — AUTHENTICATION

Implement:

* User Model
* Organization Model
* Password Hashing
* Login
* JWT
* Refresh Token
* Role Authorization
* Account Activation
* Email Service
* Forgot Password
* Password Reset

---

## PHASE 3 — ORGANIZATION AND ENGINEERS

Implement:

* Organization Isolation
* Engineer Creation
* Engineer Management
* Activation
* Deactivation
* Invitation Emails

---

## PHASE 4 — PROJECT MANAGEMENT

Implement:

* Project Creation
* Building Project
* Road Project
* Project Location
* Geofence
* Evidence Policy
* Engineer Assignment

---

## PHASE 5 — ENGINEER FIELD WORKFLOW

Implement:

* Engineer Dashboard
* Assigned Projects
* Browser Location
* GPS Accuracy
* Geofence Verification
* Live Camera
* Image Capture
* Evidence Submission

---

## PHASE 6 — IMAGE PROCESSING

Implement:

* Image Validation
* OpenCV Quality Analysis
* SHA-256 Duplicate Detection
* Perceptual Hashing
* CLIP Similarity
* Photo Diversity

---

## PHASE 7 — ML AND COMPUTER VISION

Implement:

* YOLO Object Detection
* Building Stage Classifier
* Road Stage Classifier
* AI Model Router
* Model Versioning
* AI Analysis Storage

---

## PHASE 8 — ASYNCHRONOUS PROCESSING

Implement:

* Redis
* Celery
* AI Tasks
* Email Tasks
* Report Generation Tasks

---

## PHASE 9 — REPORTING

Implement:

* Daily Reports
* Evidence Trust Score
* Historical Timeline
* Visual Comparison
* Suspicious Evidence Center

---

## PHASE 10 — POLISH AND DEPLOYMENT

Implement:

* Responsive UI
* Error Handling
* Loading States
* Tests
* Docker
* Documentation
* Deployment Configuration

---

# 85. IMPORTANT PRODUCT PRINCIPLES

The system must:

✅ Use real authentication

✅ Use a real database

✅ Use real authorization

✅ Support multiple organizations

✅ Isolate organization data

✅ Use live location verification

✅ Use browser camera

✅ Use image processing

✅ Use actual ML models

✅ Use separate Building and Road ML models

✅ Use background AI processing

✅ Use secure email activation

✅ Support password reset

✅ Be API-first

✅ Be responsive

✅ Be scalable

---

# 86. DO NOT DO THESE THINGS

Do NOT:

❌ Hardcode user passwords.

❌ Store plain text passwords.

❌ Build only static frontend screens.

❌ Use fake data as the final implementation.

❌ Claim 100% fraud detection.

❌ Claim AI predictions are always correct.

❌ Use one ML stage classifier for Building and Road.

❌ Use ML for simple GPS calculations.

❌ Block API requests during heavy AI processing.

❌ Store large images directly in PostgreSQL.

❌ Trust only frontend authorization.

❌ Allow cross-organization data access.

❌ Commit secrets.

❌ Build unnecessary features before the core workflow works.

---

# 87. CORE PRODUCT DIFFERENTIATOR

The core differentiator of SiteProof AI is:

# TRUSTED CONSTRUCTION SITE EVIDENCE

The platform combines:

```text
GPS Verification

+

Geofencing

+

Live Camera Capture

+

Server Timestamp

+

Image Quality

+

Duplicate Detection

+

Photo Diversity

+

Object Detection

+

Construction Stage AI

=

TRUSTED SITE EVIDENCE
```

SiteProof AI should not simply store construction photos.

It should help organizations understand:

> **How reliable is the submitted evidence?**

---

# 88. FUTURE STARTUP ROADMAP

Do NOT implement all of these now.

Design architecture so they can be added later:

```text
Mobile Application

Platform Super Admin

Multiple Department Admins

Project Managers

Site Supervisors

Drone Evidence

Video Evidence

IoT Sensors

Satellite Images

Bridge AI Model

Pipeline AI Model

Advanced Progress Prediction

Email Notifications

WhatsApp Notifications

Subscription Billing

Enterprise SSO

Advanced Analytics
```

---

# 89. CURRENT VERSION SCOPE

The current version must focus on:

# BUILDING CONSTRUCTION

*

# ROAD CONSTRUCTION

with:

```text
Real Authentication

Department Admin

Engineer

Email Account Setup

Password Reset

Projects

Engineer Assignment

GPS

Geofence

Live Camera

Daily Evidence

OpenCV

Duplicate Detection

CLIP Similarity

Photo Diversity

YOLO

Building ML Model

Road ML Model

Evidence Trust Score

Reports

Suspicious Evidence

Docker Deployment
```

---

# 90. FINAL EXECUTION INSTRUCTION

Before writing large amounts of application code:

First provide:

## STEP 1

Complete System Architecture

## STEP 2

Complete Folder Structure

## STEP 3

Database ER Design

## STEP 4

Database Models and Relationships

## STEP 5

Authentication Flow

## STEP 6

Authorization and Organization Isolation Strategy

## STEP 7

API Design

## STEP 8

Frontend Page Structure

## STEP 9

AI/ML Architecture

## STEP 10

Development Roadmap

Only after these are reviewed:

Begin implementation phase by phase.

---

# FINAL PRODUCT REQUIREMENT

Build:

# SITEPROOF AI

A real AI-powered Construction Site Evidence Verification Platform.

The product must be capable of evolving from:

```text
COLLEGE MAJOR PROJECT

↓

FUNCTIONAL MVP

↓

PILOT DEPLOYMENT

↓

COMMERCIAL B2B SaaS PRODUCT
```

Prioritize:

1. Correct Architecture
2. Security
3. Real User Workflows
4. Database Design
5. Multi-Organization Scalability
6. Professional UI
7. Maintainable Code
8. API-First Backend
9. Real AI and ML
10. Honest AI Results
11. Production-Minded Deployment

Do not sacrifice architecture simply to generate a quick prototype.

Build the system step-by-step, test every major module, and ensure the core workflow works end-to-end:

```text
DEPARTMENT ADMIN
        ↓
CREATES ENGINEER
        ↓
ENGINEER RECEIVES EMAIL
        ↓
SETS PASSWORD
        ↓
LOGS IN
        ↓
VIEWS ASSIGNED PROJECT
        ↓
GOES TO SITE
        ↓
GPS VERIFIED
        ↓
LIVE CAMERA CAPTURE
        ↓
SUBMITS DAILY EVIDENCE
        ↓
BACKGROUND AI ANALYSIS
        ↓
BUILDING OR ROAD ML MODEL
        ↓
EVIDENCE TRUST ANALYSIS
        ↓
DEPARTMENT ADMIN REVIEWS REPORT
```

# PRODUCT NAME

## SITEPROOF AI

# TAGLINE

## Verify Work. Validate Evidence. Track Progress.
