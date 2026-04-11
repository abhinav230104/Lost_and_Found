import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromToken } from "@/lib/getUser";

export async function POST(req: Request) {
  try {
    //Get logged-in user
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title, description, type, location, date, imageUrl } =
      await req.json();

    //Validate
    if (!title || !description || !type || !location || !date) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      );
    }

    if (type !== "lost" && type !== "found") {
      return NextResponse.json(
        { error: "Type must be lost or found" },
        { status: 400 }
      );
    }

    //Create item
    const item = await prisma.item.create({
      data: {
        title,
        description,
        type,
        location,
        date: new Date(date),
        imageUrl,
        userId: user.userId, // from JWT
      },
    });

    return NextResponse.json({
      message: "Item created",
      item,
    });

  } catch (error) {
    console.error("CREATE ITEM ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

//GET ITEMS (with filters + search)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    //Extract query params
    const type = searchParams.get("type"); // lost / found
    const query = searchParams.get("query"); // search text
    const from = searchParams.get("from"); // date start
    const to = searchParams.get("to"); // date end

    //Build dynamic filter
    const where: any = {};

    //Filter by type
    if (type && (type === "lost" || type === "found")) {
      where.type = type;
    }

    //Search by title
    if (query) {
      where.title = {
        contains: query,
        mode: "insensitive", //case-insensitive
      };
    }

    //Date range filter
    if (from || to) {
      where.date = {};

      if (from) {
        where.date.gte = new Date(from); //from date
      }

      if (to) {
        where.date.lte = new Date(to); //to date
      }
    }

    //Fetch items
    const items = await prisma.item.findMany({
      where,
      orderBy: {
        createdAt: "desc", //latest first
      },
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

    return NextResponse.json({
      count: items.length,
      items,
    });

  } catch (error) {
    console.error("GET ITEMS ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}