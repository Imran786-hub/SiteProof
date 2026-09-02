import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  projects,
  projectEngineers,
  users,
  auditLogs,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateRequest, checkAuthorization } from "@/lib/auth-middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  const authError2 = checkAuthorization(auth!, "DEPARTMENT_ADMIN");
  if (authError2) return authError2;

  const { id } = await params;
  const { engineerId } = await request.json();

  if (!engineerId) {
    return NextResponse.json(
      { error: "Engineer ID is required" },
      { status: 400 }
    );
  }

  try {
    // Verify project exists and belongs to organization
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

    // Verify engineer exists and belongs to organization
    const engineer = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, engineerId),
          eq(users.organizationId, auth!.organizationId),
          eq(users.role, "ENGINEER")
        )
      )
      .limit(1);

    if (!engineer.length) {
      return NextResponse.json(
        { error: "Engineer not found" },
        { status: 404 }
      );
    }

    // Check if already assigned
    const existing = await db
      .select()
      .from(projectEngineers)
      .where(
        and(
          eq(projectEngineers.projectId, id),
          eq(projectEngineers.engineerId, engineerId)
        )
      )
      .limit(1);

    if (existing.length) {
      return NextResponse.json(
        { error: "Engineer is already assigned to this project" },
        { status: 400 }
      );
    }

    // Assign engineer
    await db.insert(projectEngineers).values({
      projectId: id,
      engineerId,
      isActive: true,
    });

    // Log action
    await db.insert(auditLogs).values({
      organizationId: auth!.organizationId,
      userId: auth!.userId,
      action: "ENGINEER_ASSIGNED_TO_PROJECT",
      resourceType: "PROJECT",
      resourceId: id,
      metadata: {
        engineerId,
      },
    });

    return NextResponse.json(
      {
        message: "Engineer assigned to project successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Assign engineer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
