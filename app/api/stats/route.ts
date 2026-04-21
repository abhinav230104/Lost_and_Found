import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function GET() {
  try {
    const userToken = await getUserFromToken();

    if (!userToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [totalItems, userItems, userClaims, approvedClaims, pendingClaims] = await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { userId: userToken.userId } }),
      prisma.claim.count({ where: { userId: userToken.userId } }),
      prisma.claim.count({
        where: { userId: userToken.userId, status: "approved" },
      }),
      prisma.claim.count({
        where: { userId: userToken.userId, status: "pending" },
      }),
    ]);

    const lostItems = await prisma.item.count({ where: { type: "lost" } });
    const foundItems = await prisma.item.count({ where: { type: "found" } });

    return NextResponse.json({
      platform: {
        totalItems,
        lostItems,
        foundItems,
      },
      user: {
        postedItems: userItems,
        totalClaims: userClaims,
        approvedClaims,
        pendingClaims,
      },
    });
  } catch (error) {
    console.error("STATS ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
