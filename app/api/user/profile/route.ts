import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function PATCH(req: Request) {
  try {
    const userToken = await getUserFromToken();

    if (!userToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, email } = await req.json();

    if (!name && !email) {
      return NextResponse.json(
        { error: "Name or email is required" },
        { status: 400 }
      );
    }

    const updates: { name?: string; email?: string } = {};

    if (name) {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return NextResponse.json(
          { error: "Name must be at least 2 characters" },
          { status: 400 }
        );
      }
      updates.name = trimmed;
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@nitj\.ac\.in$/;
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json(
          { error: "Invalid college email" },
          { status: 400 }
        );
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.id !== userToken.userId) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }

      updates.email = normalizedEmail;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userToken.userId },
      data: updates,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({
      message: "Profile updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
