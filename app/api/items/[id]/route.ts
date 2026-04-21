import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await context.params;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        claims: {
          select: {
            id: true,
            status: true,
            userId: true,
            message: true,
            createdAt: true,
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Get current user for status info
    const userToken = await getUserFromToken();
    const currentUserId = userToken?.userId;

    return NextResponse.json({
      item,
      isOwner: item.userId === currentUserId,
      claimsCount: item.claims.length,
    });
  } catch (error) {
    console.error("GET ITEM ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.item.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      message: "Item deleted",
    });
  } catch (error) {
    console.error("DELETE ITEM ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

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
    const { title, description, location, imageUrl } = await req.json();

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

    // Prevent updates if item is closed
    if (item.status === "CLOSED") {
      return NextResponse.json(
        { error: "Cannot edit a closed item" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (location) updates.location = location;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: updates,
    });

    return NextResponse.json({
      message: "Item updated",
      item: updatedItem,
    });
  } catch (error) {
    console.error("UPDATE ITEM ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
