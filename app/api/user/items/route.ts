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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // OPEN or CLOSED
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = { userId: userToken.userId };

    if (status && (status === "OPEN" || status === "CLOSED")) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          claims: {
            select: { id: true, status: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      total,
      count: items.length,
      items,
      offset,
      limit,
    });
  } catch (error) {
    console.error("GET USER ITEMS ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
