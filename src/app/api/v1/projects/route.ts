import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  projects,
  projectLocations,
  evidencePolicies,
  auditLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateRequest, checkAuthorization } from "@/lib/auth-middleware";

// Create project
export async function POST(request: NextRequest) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  // Only admins can create projects
  const authError2 = checkAuthorization(auth!, "DEPARTMENT_ADMIN");
  if (authError2) return authError2;

  try {
    const {
      name,
      description,
      projectType,
      startDate,
      expectedCompletionDate,
      location,
      evidencePolicy,
    } = await request.json();

    if (!name || !projectType) {
      return NextResponse.json(
        { error: "Name and project type are required" },
        { status: 400 }
      );
    }

    if (!["BUILDING", "ROAD"].includes(projectType)) {
      return NextResponse.json(
        { error: "Invalid project type" },
        { status: 400 }
      );
    }

    if (!location || !location.latitude || !location.longitude) {
      return NextResponse.json(
        { error: "Location with latitude and longitude is required" },
        { status: 400 }
      );
    }

    // Create project
    const newProject = await db
      .insert(projects)
      .values({
        organizationId: auth!.organizationId,
        name,
        description,
        projectType: projectType as any,
        status: "PLANNED",
        startDate: startDate ? new Date(startDate) : undefined,
        expectedCompletionDate: expectedCompletionDate
          ? new Date(expectedCompletionDate)
          : undefined,
      })
      .returning();

    const projectId = newProject[0].id;

    // Create project location
    await db.insert(projectLocations).values({
      projectId,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      address: location.address,
      geofenceRadiusMeters: location.geofenceRadiusMeters || 100,
    });

    // Create evidence policy
    await db.insert(evidencePolicies).values({
      projectId,
      minimumImages: evidencePolicy?.minimumImages || 5,
      maximumImages: evidencePolicy?.maximumImages || 20,
      submissionFrequency: evidencePolicy?.submissionFrequency || "DAILY",
    });

    // Log action
    await db.insert(auditLogs).values({
      organizationId: auth!.organizationId,
      userId: auth!.userId,
      action: "PROJECT_CREATED",
      resourceType: "PROJECT",
      resourceId: projectId,
      metadata: {
        name,
        projectType,
      },
    });

    return NextResponse.json(
      {
        message: "Project created successfully",
        project: {
          id: projectId,
          name: newProject[0].name,
          projectType: newProject[0].projectType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// List projects
export async function GET(request: NextRequest) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  try {
    const projectsList = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, auth!.organizationId));

    return NextResponse.json({
      projects: projectsList.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        projectType: p.projectType,
        status: p.status,
        startDate: p.startDate,
        expectedCompletionDate: p.expectedCompletionDate,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
