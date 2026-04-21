import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function GET(req: Request) {
  try {
    const userToken = await getUserFromToken();

    if (!userToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const claims = await prisma.claim.findMany({
      where: { userId: userToken.userId },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            type: true,
            location: true,
            date: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        chat: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      count: claims.length,
      claims,
    });
  } catch (error) {
    console.error("GET CLAIMS ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
