import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, accountTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSecureToken } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Always return the same message to prevent email enumeration
    const genericMessage =
      "If an account exists for this email, password reset instructions have been sent.";

    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ message: genericMessage });
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Store token in database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.insert(accountTokens).values({
      userId: user[0].id,
      tokenHash,
      tokenType: "PASSWORD_RESET",
      expiresAt,
    });

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(user[0].email, resetUrl);

    console.log("Password reset token (for development):", resetToken);

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
