import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, accountTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Hash the provided token to match stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the token
    const tokenRecord = await db
      .select()
      .from(accountTokens)
      .where(
        and(
          eq(accountTokens.tokenHash, tokenHash),
          eq(accountTokens.tokenType, "PASSWORD_RESET")
        )
      )
      .limit(1);

    if (!tokenRecord.length) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token" },
        { status: 400 }
      );
    }

    const tokenData = tokenRecord[0];

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      return NextResponse.json(
        { error: "Password reset token has expired" },
        { status: 400 }
      );
    }

    // Check if token was already used
    if (tokenData.usedAt) {
      return NextResponse.json(
        { error: "Password reset token has already been used" },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, tokenData.userId));

    // Mark token as used
    await db
      .update(accountTokens)
      .set({ usedAt: new Date() })
      .where(eq(accountTokens.id, tokenData.id));

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
