import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  projects,
  projectLocations,
  evidencePolicies,
  projectEngineers,
  users,
  auditLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateRequest, checkAuthorization } from "@/lib/auth-middleware";

// Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const project = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, id), eq(projects.organizationId, auth!.organizationId))
      )
      .limit(1);

    if (!project.length) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const location = await db
      .select()
      .from(projectLocations)
      .where(eq(projectLocations.projectId, id))
      .limit(1);

    const policy = await db
      .select()
      .from(evidencePolicies)
      .where(eq(evidencePolicies.projectId, id))
      .limit(1);

    const assignedEngineers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        assignedAt: projectEngineers.assignedAt,
      })
      .from(projectEngineers)
      .innerJoin(users, eq(projectEngineers.engineerId, users.id))
      .where(eq(projectEngineers.projectId, id));

    return NextResponse.json({
      project: {
        id: project[0].id,
        name: project[0].name,
        description: project[0].description,
        projectType: project[0].projectType,
        status: project[0].status,
        startDate: project[0].startDate,
        expectedCompletionDate: project[0].expectedCompletionDate,
        location: location.length
          ? {
              latitude: location[0].latitude,
              longitude: location[0].longitude,
              address: location[0].address,
              geofenceRadiusMeters: location[0].geofenceRadiusMeters,
            }
          : null,
        policy: policy.length
          ? {
              minimumImages: policy[0].minimumImages,
              maximumImages: policy[0].maximumImages,
              submissionFrequency: policy[0].submissionFrequency,
            }
          : null,
        assignedEngineers,
      },
    });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  const authError2 = checkAuthorization(auth!, "DEPARTMENT_ADMIN");
  if (authError2) return authError2;

  const { id } = await params;

  try {
    const {
      name,
      description,
      status,
      expectedCompletionDate,
      location,
      evidencePolicy,
    } = await request.json();

    // Verify project belongs to organization
    const project = await db
      .select()
      .from(projects)
      .where(
        and(eq(projects.id, id), eq(projects.organizationId, auth!.organizationId))
      )
      .limit(1);

    if (!project.length) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Update project
    await db
      .update(projects)
      .set({
        name: name || project[0].name,
        description: description !== undefined ? description : project[0].description,
        status: status || project[0].status,
        expectedCompletionDate: expectedCompletionDate
          ? new Date(expectedCompletionDate)
          : project[0].expectedCompletionDate,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id));

    // Update location if provided
    if (location) {
      await db
        .update(projectLocations)
        .set({
          latitude: location.latitude.toString(),
          longitude: location.longitude.toString(),
          address: location.address,
          geofenceRadiusMeters: location.geofenceRadiusMeters || 100,
          updatedAt: new Date(),
        })
        .where(eq(projectLocations.projectId, id));
    }

    // Update evidence policy if provided
    if (evidencePolicy) {
      await db
        .update(evidencePolicies)
        .set({
          minimumImages: evidencePolicy.minimumImages,
          maximumImages: evidencePolicy.maximumImages,
          submissionFrequency: evidencePolicy.submissionFrequency,
          updatedAt: new Date(),
        })
        .where(eq(evidencePolicies.projectId, id));
    }

    // Log action
    await db.insert(auditLogs).values({
      organizationId: auth!.organizationId,
      userId: auth!.userId,
      action: "PROJECT_UPDATED",
      resourceType: "PROJECT",
      resourceId: id,
    });

    return NextResponse.json({
      message: "Project updated successfully",
    });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
