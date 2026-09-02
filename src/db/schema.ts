import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  decimal,
  index,
  uniqueIndex,
  foreignKey,
  json,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "DEPARTMENT_ADMIN",
  "ENGINEER",
]);

export const projectTypeEnum = pgEnum("project_type", ["BUILDING", "ROAD"]);

export const projectStatusEnum = pgEnum("project_status", [
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
]);

export const evidenceCategoryEnum = pgEnum("evidence_category", [
  "WIDE_SITE_VIEW",
  "ACTIVE_WORK_AREA",
  "DIFFERENT_WORK_SECTION",
  "EQUIPMENT_MATERIALS",
  "PROGRESS_CLOSE_UP",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "PENDING",
  "VERIFIED",
  "SUSPICIOUS",
  "NEEDS_REVIEW",
]);

export const tokenTypeEnum = pgEnum("token_type", [
  "ACCOUNT_ACTIVATION",
  "PASSWORD_RESET",
]);

// Organizations Table
export const organizations = pgTable(
  "organizations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    name: varchar("name", { length: 255 }).notNull(),
    organizationType: varchar("organization_type", { length: 50 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  },
  (table) => [uniqueIndex("idx_organizations_email").on(table.email)]
);

// Users Table
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    employeeId: varchar("employee_id", { length: 50 }),
    designation: varchar("designation", { length: 100 }),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  },
  (table) => [
    index("idx_users_organization_id").on(table.organizationId),
    uniqueIndex("idx_users_email_org").on(table.email, table.organizationId),
  ]
);

// Projects Table
export const projects = pgTable(
  "projects",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    projectType: projectTypeEnum("project_type").notNull(),
    status: projectStatusEnum("status").notNull().default("PLANNED"),
    startDate: timestamp("start_date"),
    expectedCompletionDate: timestamp("expected_completion_date"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  },
  (table) => [index("idx_projects_organization_id").on(table.organizationId)]
);

// Project Locations Table
export const projectLocations = pgTable(
  "project_locations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    address: text("address"),
    geofenceRadiusMeters: integer("geofence_radius_meters").notNull().default(100),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  },
  (table) => [index("idx_project_locations_project_id").on(table.projectId)]
);

// Evidence Policies Table
export const evidencePolicies = pgTable(
  "evidence_policies",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    minimumImages: integer("minimum_images").notNull().default(5),
    maximumImages: integer("maximum_images").notNull().default(20),
    submissionFrequency: varchar("submission_frequency", { length: 50 })
      .notNull()
      .default("DAILY"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  },
  (table) => [
    index("idx_evidence_policies_project_id").on(table.projectId),
  ]
);

// Project Engineers Table (Assignment)
export const projectEngineers = pgTable(
  "project_engineers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    engineerId: varchar("engineer_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").notNull().default(sql`now()`),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    index("idx_project_engineers_project_id").on(table.projectId),
    index("idx_project_engineers_engineer_id").on(table.engineerId),
    uniqueIndex("idx_project_engineers_unique").on(
      table.projectId,
      table.engineerId
    ),
  ]
);

// Site Evidence Table
export const siteEvidence = pgTable(
  "site_evidence",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    engineerId: varchar("engineer_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    evidenceCategory: evidenceCategoryEnum("evidence_category").notNull(),
    imagePath: text("image_path").notNull(),
    imageHash: varchar("image_hash", { length: 64 }),
    perceptualHash: varchar("perceptual_hash", { length: 64 }),
    captureTimestamp: timestamp("capture_timestamp"),
    submissionTimestamp: timestamp("submission_timestamp").notNull().default(sql`now()`),
    latitude: decimal("latitude", { precision: 10, scale: 8 }),
    longitude: decimal("longitude", { precision: 11, scale: 8 }),
    gpsAccuracy: decimal("gps_accuracy", { precision: 10, scale: 2 }),
    distanceFromSite: decimal("distance_from_site", { precision: 10, scale: 2 }),
    locationVerified: boolean("location_verified").notNull().default(false),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("PENDING"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  },
  (table) => [
    index("idx_site_evidence_organization_id").on(table.organizationId),
    index("idx_site_evidence_project_id").on(table.projectId),
    index("idx_site_evidence_engineer_id").on(table.engineerId),
    index("idx_site_evidence_submission_timestamp").on(
      table.submissionTimestamp
    ),
  ]
);

// Evidence Analysis Table
export const evidenceAnalysis = pgTable(
  "evidence_analysis",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    evidenceId: varchar("evidence_id", { length: 36 })
      .notNull()
      .references(() => siteEvidence.id, { onDelete: "cascade" }),
    modelType: varchar("model_type", { length: 50 }).notNull(),
    modelVersion: varchar("model_version", { length: 20 }).notNull(),
    predictedStage: varchar("predicted_stage", { length: 100 }),
    confidence: decimal("confidence", { precision: 5, scale: 4 }),
    detectedObjects: json("detected_objects"),
    qualityScore: decimal("quality_score", { precision: 5, scale: 4 }),
    duplicateScore: decimal("duplicate_score", { precision: 5, scale: 4 }),
    similarityScore: decimal("similarity_score", { precision: 5, scale: 4 }),
    trustScore: integer("trust_score"),
    trustStatus: varchar("trust_status", { length: 50 }),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  },
  (table) => [index("idx_evidence_analysis_evidence_id").on(table.evidenceId)]
);

// Daily Reports Table
export const dailyReports = pgTable(
  "daily_reports",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    engineerId: varchar("engineer_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportDate: timestamp("report_date").notNull(),
    totalSubmitted: integer("total_submitted").notNull().default(0),
    totalRequired: integer("total_required").notNull().default(5),
    averageQuality: decimal("average_quality", { precision: 5, scale: 4 }),
    averageGpsAccuracy: decimal("average_gps_accuracy", { precision: 10, scale: 2 }),
    photoDiversity: decimal("photo_diversity", { precision: 5, scale: 4 }),
    duplicateCount: integer("duplicate_count").notNull().default(0),
    trustScore: integer("trust_score"),
    trustStatus: varchar("trust_status", { length: 50 }),
    aiPredictedStage: varchar("ai_predicted_stage", { length: 100 }),
    aiConfidence: decimal("ai_confidence", { precision: 5, scale: 4 }),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  },
  (table) => [
    index("idx_daily_reports_organization_id").on(table.organizationId),
    index("idx_daily_reports_project_id").on(table.projectId),
    index("idx_daily_reports_engineer_id").on(table.engineerId),
    index("idx_daily_reports_report_date").on(table.reportDate),
  ]
);

// Account Tokens Table
export const accountTokens = pgTable(
  "account_tokens",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    tokenType: tokenTypeEnum("token_type").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  },
  (table) => [index("idx_account_tokens_user_id").on(table.userId)]
);

// Audit Logs Table
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }),
    resourceId: varchar("resource_id", { length: 36 }),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  },
  (table) => [
    index("idx_audit_logs_organization_id").on(table.organizationId),
    index("idx_audit_logs_created_at").on(table.createdAt),
  ]
);

// Evidence Categories Table (Reference)
export const evidenceCategories = pgTable(
  "evidence_categories",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    displayOrder: integer("display_order").notNull(),
  }
);

// Suspicious Events Table
export const suspiciousEvents = pgTable(
  "suspicious_events",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    organizationId: varchar("organization_id", { length: 36 })
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: varchar("project_id", { length: 36 })
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    evidenceId: varchar("evidence_id", { length: 36 })
      .notNull()
      .references(() => siteEvidence.id, { onDelete: "cascade" }),
    engineerId: varchar("engineer_id", { length: 36 })
      .references(() => users.id, { onDelete: "set null" }),
    issueType: varchar("issue_type", { length: 100 }).notNull(), // DUPLICATE_IMAGE, LOCATION_MISMATCH, LOW_ACCURACY, POOR_QUALITY, HIGH_SIMILARITY
    description: text("description").notNull(),
    riskScore: integer("risk_score").notNull().default(50),
    status: varchar("status", { length: 50 }).notNull().default("NEEDS_REVIEW"), // NEEDS_REVIEW, APPROVED, FLAGGED, RECAPTURE_REQUESTED
    recaptureReason: text("recapture_reason"),
    resolvedBy: varchar("resolved_by", { length: 36 }).references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  },
  (table) => [
    index("idx_suspicious_events_org").on(table.organizationId),
    index("idx_suspicious_events_project").on(table.projectId),
    index("idx_suspicious_events_evidence").on(table.evidenceId),
    index("idx_suspicious_events_status").on(table.status),
  ]
);

