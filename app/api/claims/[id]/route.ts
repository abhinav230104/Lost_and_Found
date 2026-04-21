import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: claimId } = await context.params;
    const { status } = await req.json();

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // 1. Get claim with item
    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { item: true },
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    // 2. Only owner can update
    if (claim.item.userId !== user.userId) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    // 3. Prevent re-approval if already approved
    if (status === "approved") {
      const alreadyApproved = await prisma.claim.findFirst({
        where: {
          itemId: claim.itemId,
          status: "approved",
        },
      });

      if (alreadyApproved) {
        return NextResponse.json(
          { error: "Item already claimed" },
          { status: 400 }
        );
      }
    }

    // 4. Transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Reject others if approving
      if (status === "approved") {
        await tx.claim.updateMany({
          where: {
            itemId: claim.itemId,
            NOT: { id: claimId },
          },
          data: { status: "rejected" },
        });
        // Create chat ONLY if not exists
        const existingChat = await tx.chat.findUnique({
          where: { claimId: claim.id },
        });

        if (!existingChat) {
          await tx.chat.create({
            data: {
              claimId: claim.id,
            },
          });
        }
      }

      // Update selected claim
      const updatedClaim = await tx.claim.update({
        where: { id: claimId },
        data: { status },
      });

      return updatedClaim;
    });

    // 5. Send notifications
    try {
      if (status === "approved") {
        await createNotification(
          claim.userId,
          "claim_approved",
          "Claim Approved",
          `Your claim for "${claim.item.title}" has been approved! You can now chat with the item owner.`,
          claim.itemId,
          claimId
        );
      } else if (status === "rejected") {
        await createNotification(
          claim.userId,
          "claim_rejected",
          "Claim Rejected",
          `Your claim for "${claim.item.title}" has been rejected.`,
          claim.itemId,
          claimId
        );
      }
    } catch (notifError) {
      console.error("Notification creation failed:", notifError);
    }

    return NextResponse.json({
      message: `Claim ${status}`,
      claim: result,
    });

  } catch (error) {
    console.error("UPDATE CLAIM ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}