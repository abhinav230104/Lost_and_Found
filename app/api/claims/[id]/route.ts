import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const claimId = params.id;
    const { status } = await req.json(); // approved / rejected

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

    // 2. Only item owner can update
    if (claim.item.userId !== user.userId) {
      return NextResponse.json(
        { error: "Not allowed" },
        { status: 403 }
      );
    }

    // 3. If approving → reject all others
    if (status === "approved") {
      await prisma.claim.updateMany({
        where: {
          itemId: claim.itemId,
          NOT: { id: claimId },
        },
        data: { status: "rejected" },
      });
    }

    // 4. Update selected claim
    const updated = await prisma.claim.update({
      where: { id: claimId },
      data: { status },
    });

    return NextResponse.json({
      message: `Claim ${status}`,
      claim: updated,
    });

  } catch (error) {
    console.error("UPDATE CLAIM ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}