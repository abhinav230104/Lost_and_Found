import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const myItems = await prisma.item.findMany({
      where: { userId: user.userId },
    });

    const myClaims = await prisma.claim.findMany({
      where: { userId: user.userId },
      include: { item: true },
    });

    const claimsOnMyItems = await prisma.claim.findMany({
      where: {
        item: {
          userId: user.userId,
        },
      },
      include: {
        item: true,
        user: true,
      },
    });

    return NextResponse.json({
      myItems,
      myClaims,
      claimsOnMyItems,
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error); // ✅ VERY IMPORTANT

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}