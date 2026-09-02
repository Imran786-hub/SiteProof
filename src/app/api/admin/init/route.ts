import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, users, accountTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, generateSecureToken } from "@/lib/auth";
import crypto from "crypto";

// This endpoint should only be called once during initial setup
export async function POST(request: NextRequest) {
  try {
    const { orgName, adminEmail, adminPassword } = await request.json();

    // In production, verify this is an initialization request with a setup token
    const initToken = process.env.INIT_TOKEN;
    const authHeader = request.headers.get("x-init-token");

    if (initToken && authHeader !== initToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!orgName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Organization name, admin email, and password are required" },
        { status: 400 }
      );
    }

    // Check if organization already exists
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.email, adminEmail.toLowerCase()))
      .limit(1);

    if (existingOrg.length) {
      return NextResponse.json(
        { error: "Organization or admin already initialized" },
        { status: 400 }
      );
    }

    // Create organization
    const newOrg = await db
      .insert(organizations)
      .values({
        name: orgName,
        organizationType: "GOVERNMENT",
        email: adminEmail.toLowerCase(),
        isActive: true,
      })
      .returning();

    // Hash password
    const passwordHash = await hashPassword(adminPassword);

    // Create admin user
    const newAdmin = await db
      .insert(users)
      .values({
        organizationId: newOrg[0].id,
        name: "Department Admin",
        email: adminEmail.toLowerCase(),
        passwordHash,
        role: "DEPARTMENT_ADMIN",
        isActive: true,
        emailVerified: true,
      })
      .returning();

    return NextResponse.json({
      message: "Initial setup completed",
      organization: {
        id: newOrg[0].id,
        name: newOrg[0].name,
      },
      admin: {
        id: newAdmin[0].id,
        email: newAdmin[0].email,
      },
    });
  } catch (error) {
    console.error("Init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
