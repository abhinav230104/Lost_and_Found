import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await context.params;

    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // check item
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // ownership check
    if (item.userId !== user.userId) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    // fetch claims
    const claims = await prisma.claim.findMany({
      where: { itemId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ claims });

  } catch (error) {
    console.error("GET CLAIMS ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}