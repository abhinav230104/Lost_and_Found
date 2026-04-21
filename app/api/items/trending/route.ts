import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type"); // lost or found
    const days = parseInt(searchParams.get("days") || "7");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    if (type && (type === "lost" || type === "found")) {
      where.type = type;
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true },
        },
        claims: {
          select: { id: true },
        },
      },
      orderBy: {
        claims: {
          _count: "desc",
        },
      },
      take: limit,
    });

    return NextResponse.json({
      period: `Last ${days} days`,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("TRENDING ITEMS ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
