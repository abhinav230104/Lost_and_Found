import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    //Validate
    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP required" },
        { status: 400 }
      );
    }

    //Get latest OTP
    const record = await prisma.oTP.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "No OTP found" },
        { status: 400 }
      );
    }

    //Check expiry
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "OTP expired" },
        { status: 400 }
      );
    }

    //Check OTP
    if (record.code !== otp) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    //Create user
    const user = await prisma.user.create({
      data: {
        email: record.email,
        name: record.name!,
        password: record.password!,
      },
    });

    //Cleanup OTP
    await prisma.oTP.deleteMany({ where: { email } });

  return NextResponse.json({
  message: "User registered successfully",
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
  },
});

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}