import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { sendOTP } from "@/lib/mail";
import { rateLimit, createRateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const rateLimitCheck = rateLimit(req, "auth");
  if (!rateLimitCheck.success) {
    return createRateLimitResponse(rateLimitCheck.retryAfter!);
  }

  try {
    const { email, name, password } = await req.json();

    //Validate fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      );
    }

    //Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@nitj\.ac\.in$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid college email" },
        { status: 400 }
      );
    }

    //Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password too short" },
        { status: 400 }
      );
    }

    //Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Delete old OTPs
    await prisma.oTP.deleteMany({ where: { email } });

    //Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //Store temp data
    await prisma.oTP.create({
      data: {
        email,
        code: otp,
        name,
        password: hashedPassword,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      },
    });

    //Send OTP
    await sendOTP(email, otp);

    console.log("OTP sent:", otp);

    return NextResponse.json({
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}