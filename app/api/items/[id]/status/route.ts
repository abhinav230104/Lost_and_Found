import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userToken = await getUserFromToken();

    if (!userToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: itemId } = await context.params;
    const { status } = await req.json();

    if (!status || !["OPEN", "CLOSED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Use OPEN or CLOSED" },
        { status: 400 }
      );
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (item.userId !== userToken.userId) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: { status },
    });

    return NextResponse.json({
      message: `Item status changed to ${status}`,
      item: updatedItem,
    });
  } catch (error) {
    console.error("UPDATE ITEM STATUS ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
