import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { itemId, message } = await req.json();

    // 2. Validate
    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID required" },
        { status: 400 }
      );
    }

    // 3. Check item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // 4. Prevent claiming own item
    if (item.userId === user.userId) {
      return NextResponse.json(
        { error: "You cannot claim your own item" },
        { status: 400 }
      );
    }

    // 5. Prevent duplicate claim
    const existingClaim = await prisma.claim.findFirst({
      where: {
        itemId,
        userId: user.userId,
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "You already claimed this item" },
        { status: 400 }
      );
    }

    // 6. Create claim
    const claim = await prisma.claim.create({
      data: {
        itemId,
        userId: user.userId,
        message,
      },
    });

    // 7. Notify item owner
    try {
      await createNotification(
        item.userId,
        "claim_submitted",
        "New Claim",
        `Someone claimed your item "${item.title}"`,
        itemId,
        claim.id
      );
    } catch (notifError) {
      console.error("Notification creation failed:", notifError);
      // Don't fail the API call if notification fails
    }

    return NextResponse.json({
      message: "Claim submitted",
      claim,
    });

  } catch (error) {
    console.error("CLAIM ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}