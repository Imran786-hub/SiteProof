import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, accountTokens, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authenticateRequest, checkAuthorization } from "@/lib/auth-middleware";
import { generateSecureToken } from "@/lib/auth";
import crypto from "crypto";

// Create engineer (POST)
export async function POST(request: NextRequest) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  // Only department admins can create engineers
  const authError2 = checkAuthorization(auth!, "DEPARTMENT_ADMIN");
  if (authError2) return authError2;

  try {
    const { name, email, phone, employeeId, designation } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if engineer already exists in organization
    const existingUser = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email.toLowerCase()),
          eq(users.organizationId, auth!.organizationId)
        )
      )
      .limit(1);

    if (existingUser.length) {
      return NextResponse.json(
        { error: "Engineer with this email already exists in your organization" },
        { status: 400 }
      );
    }

    // Create user
    const newEngineer = await db
      .insert(users)
      .values({
        organizationId: auth!.organizationId,
        name,
        email: email.toLowerCase(),
        phone,
        employeeId,
        designation,
        role: "ENGINEER",
        isActive: false,
        emailVerified: false,
      })
      .returning();

    // Generate activation token
    const activationToken = generateSecureToken();
    const tokenHash = crypto
      .createHash("sha256")
      .update(activationToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await db.insert(accountTokens).values({
      userId: newEngineer[0].id,
      tokenHash,
      tokenType: "ACCOUNT_ACTIVATION",
      expiresAt,
    });

    // Log action
    await db.insert(auditLogs).values({
      organizationId: auth!.organizationId,
      userId: auth!.userId,
      action: "ENGINEER_CREATED",
      resourceType: "ENGINEER",
      resourceId: newEngineer[0].id,
      metadata: {
        email: newEngineer[0].email,
        name: newEngineer[0].name,
      },
    });

    // TODO: Send activation email with token

    console.log("Engineer activation token (for development):", activationToken);

    return NextResponse.json(
      {
        message: "Engineer created successfully. Activation email sent.",
        engineer: {
          id: newEngineer[0].id,
          name: newEngineer[0].name,
          email: newEngineer[0].email,
          role: newEngineer[0].role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create engineer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// List engineers (GET)
export async function GET(request: NextRequest) {
  const { auth, response: authError } = await authenticateRequest(request);
  if (authError) return authError;

  // Only department admins can list engineers
  const authError2 = checkAuthorization(auth!, "DEPARTMENT_ADMIN");
  if (authError2) return authError2;

  try {
    const engineersList = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, auth!.organizationId),
          eq(users.role, "ENGINEER")
        )
      );

    return NextResponse.json({
      engineers: engineersList.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        phone: e.phone,
        employeeId: e.employeeId,
        designation: e.designation,
        isActive: e.isActive,
        emailVerified: e.emailVerified,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("List engineers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
