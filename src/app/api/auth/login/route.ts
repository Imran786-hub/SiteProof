import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, generateAccessToken, generateRefreshToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user.length) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const userData = user[0];

    // Check if user is active
    if (!userData.isActive) {
      return NextResponse.json(
        { error: "Account is not active" },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!userData.emailVerified) {
      return NextResponse.json(
        { error: "Email is not verified. Please check your email for activation link." },
        { status: 401 }
      );
    }

    // Verify password
    if (!userData.passwordHash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, userData.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: userData.id,
      email: userData.email,
      organizationId: userData.organizationId,
      role: userData.role as any,
    });

    const refreshToken = generateRefreshToken(userData.id);

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organizationId: userData.organizationId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
