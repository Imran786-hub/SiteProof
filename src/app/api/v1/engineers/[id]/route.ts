import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateRequest, checkAuthorization } from "@/lib/auth-middleware";

// Get engineer details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  const { id } = await params;

  try {
    const engineer = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
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

    const e = engineer[0];
    return NextResponse.json({
      engineer: {
        id: e.id,
        name: e.name,
        email: e.email,
        phone: e.phone,
        employeeId: e.employeeId,
        designation: e.designation,
        isActive: e.isActive,
        emailVerified: e.emailVerified,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get engineer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update engineer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  // Only admins can update engineers
  const authError2 = checkAuthorization(auth!, "DEPARTMENT_ADMIN");
  if (authError2) return authError2;

  const { id } = await params;

  try {
    const { name, phone, designation, isActive } = await request.json();

    // Verify engineer belongs to organization
    const engineer = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
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

    // Update engineer
    await db
      .update(users)
      .set({
        name: name || engineer[0].name,
        phone: phone !== undefined ? phone : engineer[0].phone,
        designation: designation !== undefined ? designation : engineer[0].designation,
        isActive: isActive !== undefined ? isActive : engineer[0].isActive,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    // Log action
    await db.insert(auditLogs).values({
      organizationId: auth!.organizationId,
      userId: auth!.userId,
      action: "ENGINEER_UPDATED",
      resourceType: "ENGINEER",
      resourceId: id,
    });

    return NextResponse.json({
      message: "Engineer updated successfully",
    });
  } catch (error) {
    console.error("Update engineer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Deactivate engineer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  // Only admins can delete engineers
  const authError2 = checkAuthorization(auth!, "DEPARTMENT_ADMIN");
  if (authError2) return authError2;

  const { id } = await params;

  try {
    // Verify engineer belongs to organization
    const engineer = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, id),
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

    // Deactivate engineer
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    // Log action
    await db.insert(auditLogs).values({
      organizationId: auth!.organizationId,
      userId: auth!.userId,
      action: "ENGINEER_DEACTIVATED",
      resourceType: "ENGINEER",
      resourceId: id,
    });

    return NextResponse.json({
      message: "Engineer deactivated successfully",
    });
  } catch (error) {
    console.error("Delete engineer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
