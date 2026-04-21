import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { authCookieOptions, generateToken } from "@/lib/auth";
import { rateLimit, createRateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rateLimitCheck = rateLimit(req, "auth");
  if (!rateLimitCheck.success) {
    return createRateLimitResponse(rateLimitCheck.retryAfter!);
  }

  try {
    const { email, password } = await req.json();

    // Validate
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 400 }
      );
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 400 }
      );
    }

    // Generate JWT
    const token = generateToken(user.id);

    // Set cookie
    const response = NextResponse.json({
      message: "Login successful",
    });

    response.cookies.set("token", token, {
      ...authCookieOptions,
    });

    return response;

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}