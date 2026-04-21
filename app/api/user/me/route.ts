import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function GET() {
  try {
    //Get token
    const userToken = await getUserFromToken();
    if (!userToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userToken.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(user);

  } catch (error) {
    console.error("ME ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}