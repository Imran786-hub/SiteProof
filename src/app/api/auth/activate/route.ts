import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, accountTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { sql } from "drizzle-orm";

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

    // Find the token
    const tokenRecord = await db
      .select()
      .from(accountTokens)
      .where(
        and(
          eq(accountTokens.tokenHash, token),
          eq(accountTokens.tokenType, "ACCOUNT_ACTIVATION")
        )
      )
      .limit(1);

    if (!tokenRecord.length) {
      return NextResponse.json(
        { error: "Invalid or expired activation token" },
        { status: 400 }
      );
    }

    const tokenData = tokenRecord[0];

    // Check if token is expired
    if (new Date() > tokenData.expiresAt) {
      return NextResponse.json(
        { error: "Activation token has expired" },
        { status: 400 }
      );
    }

    // Check if token was already used
    if (tokenData.usedAt) {
      return NextResponse.json(
        { error: "Activation token has already been used" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Update user
    await db
      .update(users)
      .set({
        passwordHash,
        emailVerified: true,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, tokenData.userId));

    // Mark token as used
    await db
      .update(accountTokens)
      .set({ usedAt: new Date() })
      .where(eq(accountTokens.id, tokenData.id));

    return NextResponse.json({
      message: "Account activated successfully",
    });
  } catch (error) {
    console.error("Activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
