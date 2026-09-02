# SiteProof AI - Deployment Guide

## Production Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Internet Users                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │   Cloudflare   │
        │   (CDN/DDoS)   │
        └────────┬───────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Load Balancer     │
        │  (AWS ALB/NLB)     │
        └────────┬───────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
     ▼           ▼           ▼
  ┌─────┐   ┌─────┐   ┌─────┐
  │App 1│   │App 2│   │App 3│
  │Pods │   │Pods │   │Pods │
  └──┬──┘   └──┬──┘   └──┬──┘
     │        │        │
     └────────┼────────┘
              │
              ▼
     ┌────────────────────┐
     │  PostgreSQL RDS    │
     │  (Multi-AZ)        │
     └────────────────────┘
              │
              ├─────────────────┐
              ▼                 ▼
        ┌──────────┐      ┌──────────┐
        │S3 Bucket │      │  Redis   │
        │(Evidence)│      │ (Cache)  │
        └──────────┘      └──────────┘
```

## Prerequisites

### Required AWS Services
- EC2 or ECS for application hosting
- RDS PostgreSQL for database
- S3 for evidence storage
- Route53 for DNS
- CloudFront for CDN
- ElastiCache for Redis (optional)

### Or Using Alternative Providers
- GCP: Cloud Run, Cloud SQL, Cloud Storage
- Azure: App Service, Azure Database, Blob Storage
- DigitalOcean: App Platform, Managed Database

## Docker Setup

### Build Docker Image

```bash
# Build frontend and backend in single image
docker build -t siteproof-ai:latest .

# Tag for registry
docker tag siteproof-ai:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/siteproof-ai:latest

# Push to registry
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/siteproof-ai:latest
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: siteproof_ai
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/siteproof_ai
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

## Environment Configuration

### Production .env

```env
# Database
DATABASE_URL=postgresql://user:password@siteproof-db.xyz.amazonaws.com:5432/siteproof_ai

# Authentication
JWT_SECRET=<generate-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-hex-32>
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15

# Email Service (Resend recommended)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=<resend-api-key>
EMAIL_FROM=noreply@siteproof.ai
EMAIL_DOMAIN=siteproof.ai

# Storage
STORAGE_TYPE=s3
STORAGE_BUCKET=siteproof-evidence
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=<aws-access-key>
STORAGE_SECRET_KEY=<aws-secret-key>

# Redis
REDIS_URL=redis://siteproof-redis.xyz.amazonaws.com:6379

# Frontend
NEXT_PUBLIC_API_URL=https://api.siteproof.ai

# Environment
ENVIRONMENT=production
NODE_ENV=production
```

## Database Setup

### 1. Create PostgreSQL Database

```bash
# Using AWS RDS
aws rds create-db-instance \
  --db-instance-identifier siteproof-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --storage-type gp3
```

### 2. Push Schema

```bash
# Connect to database
npx drizzle-kit push --database postgresql://...

# Run migrations if using Alembic
alembic upgrade head
```

### 3. Initialize Admin

```bash
curl -X POST https://api.siteproof.ai/api/admin/init \
  -H "Content-Type: application/json" \
  -H "X-Init-Token: $INIT_TOKEN" \
  -d '{
    "orgName": "Department Name",
    "adminEmail": "admin@department.gov",
    "adminPassword": "SecurePassword123"
  }'
```

## AWS Deployment (ECS Fargate)

### 1. Create ECR Repository

```bash
aws ecr create-repository --repository-name siteproof-ai
```

### 2. Build and Push Image

```bash
aws ecr get-login-password --region us-east-1 | \
docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker build -t siteproof-ai:latest .
docker tag siteproof-ai:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/siteproof-ai:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/siteproof-ai:latest
```

### 3. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name siteproof-production
```

### 4. Create Task Definition

```json
{
  "family": "siteproof-ai",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "siteproof-ai",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/siteproof-ai:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@siteproof-db.xyz:5432/siteproof_ai"
        },
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:siteproof/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/siteproof-ai",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 5. Create Service

```bash
aws ecs create-service \
  --cluster siteproof-production \
  --service-name siteproof-ai-service \
  --task-definition siteproof-ai \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## GCP Deployment (Cloud Run)

### 1. Build and Push to Artifact Registry

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev

docker build -t us-central1-docker.pkg.dev/project-id/siteproof/app:latest .
docker push us-central1-docker.pkg.dev/project-id/siteproof/app:latest
```

### 2. Deploy to Cloud Run

```bash
gcloud run deploy siteproof-ai \
  --image us-central1-docker.pkg.dev/project-id/siteproof/app:latest \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars DATABASE_URL=postgresql://... \
  --min-instances 1 \
  --max-instances 10
```

## Monitoring & Logging

### CloudWatch Dashboards

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name SiteProofAI \
  --dashboard-body file://dashboard.json
```

### Important Metrics to Monitor

- **Application**
  - Response time (p50, p95, p99)
  - Error rate
  - Request volume
  - Active connections

- **Database**
  - Query latency
  - Connection pool usage
  - Replication lag (if multi-region)
  - Storage usage

- **Infrastructure**
  - CPU utilization
  - Memory usage
  - Disk I/O
  - Network throughput

### Alarms

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name siteproof-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name ErrorRate \
  --namespace SiteProofAI \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

## Backup & Recovery

### Database Backups

```bash
# Enable automated backups (7 days)
aws rds modify-db-instance \
  --db-instance-identifier siteproof-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier siteproof-db \
  --db-snapshot-identifier siteproof-backup-2024-01-15
```

### Evidence Backups

```bash
# Enable S3 replication
aws s3api put-bucket-replication \
  --bucket siteproof-evidence \
  --replication-configuration file://replication.json
```

## Security Hardening

### 1. Network Security

- Enable VPC endpoint for S3
- Use security groups for database
- Enable encryption in transit (TLS 1.3)

### 2. Database Security

- Enable encryption at rest
- Use IAM database authentication
- Enable audit logging
- Regular patching

### 3. Application Security

- HTTPS only (redirect HTTP)
- HSTS headers
- Rate limiting
- WAF rules

### 4. Access Control

- Use IAM roles instead of access keys
- Rotate secrets regularly
- Enable MFA for admin panel
- Audit log all access

## Performance Optimization

### Caching

```bash
# Redis caching for:
# - User sessions
# - Project data
# - Engineer assignments
# - Recent evidence metadata
```

### Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_evidence_org_project ON site_evidence(organization_id, project_id);
CREATE INDEX idx_evidence_created ON site_evidence(created_at DESC);
CREATE INDEX idx_projects_org ON projects(organization_id, status);
```

### CDN Configuration

```bash
# Serve static assets via CloudFront
aws cloudfront create-distribution \
  --origin-domain-name app.siteproof.ai \
  --default-cache-behavior file://cache-behavior.json
```

## Disaster Recovery

### RTO/RPO Targets
- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 1 hour

### Backup Strategy
- Daily snapshots of database
- Continuous replication to secondary region
- Weekly full backups retained for 30 days

### Failover Procedure
1. Promote read replica to primary
2. Update DNS records
3. Update application configuration
4. Verify data integrity

## Scaling

### Horizontal Scaling

```bash
# Auto-scaling group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name siteproof-asg \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 3
```

### Vertical Scaling

- Increase ECS task CPU/memory
- Upgrade RDS instance class
- Increase Redis instance size

## Cost Optimization

- Use spot instances for non-critical tasks
- Enable S3 intelligent tiering for old evidence
- Use reserved instances for predictable load
- Implement request caching
- Monitor unused resources

---
