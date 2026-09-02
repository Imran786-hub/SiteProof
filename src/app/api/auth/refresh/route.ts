import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user.length || !user[0].isActive) {
      return NextResponse.json(
        { error: "User not found or inactive" },
        { status: 401 }
      );
    }

    const userData = user[0];

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: userData.id,
      email: userData.email,
      organizationId: userData.organizationId,
      role: userData.role as any,
    });

    const newRefreshToken = generateRefreshToken(userData.id);

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
