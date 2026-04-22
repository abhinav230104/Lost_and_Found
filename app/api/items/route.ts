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
    const query = searchParams.get("query"); // search text (title + description)
    const location = searchParams.get("location"); // location filter
    const from = searchParams.get("from"); // date start
    const to = searchParams.get("to"); // date end
    const status = searchParams.get("status"); // OPEN or CLOSED
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    //Build dynamic filter
    const where: any = {};

    //Filter by type
    if (type && (type === "lost" || type === "found")) {
      where.type = type;
    }

    //Filter by status
    if (status && (status === "OPEN" || status === "CLOSED")) {
      where.status = status;
    }

    //Search by title or description (case-insensitive)
    if (query) {
      where.OR = [
        {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: query,
            mode: "insensitive",
          },
        },
      ];
    }

    //Filter by location
    if (location) {
      where.location = {
        contains: location,
        mode: "insensitive",
      };
    }

    //Date range filter
    if (from || to) {
      const parsedFrom = from ? new Date(from) : null;
      const parsedTo = to ? new Date(to) : null;

      if ((parsedFrom && Number.isNaN(parsedFrom.getTime())) || (parsedTo && Number.isNaN(parsedTo.getTime()))) {
        return NextResponse.json(
          { error: "Invalid date range" },
          { status: 400 }
        );
      }

      where.date = {};

      if (parsedFrom) {
        where.date.gte = parsedFrom; // from date (inclusive)
      }

      if (parsedTo) {
        // include the full selected day
        parsedTo.setHours(23, 59, 59, 999);
        where.date.lte = parsedTo;
      }
    }

    //Fetch total count and items
    const [items, total] = await Promise.all([
      prisma.item.findMany({
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
          claims: {
            select: {
              id: true,
              status: true,
            },
          },
        },
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
      hasMore: offset + limit < total,
    });

  } catch (error) {
    console.error("GET ITEMS ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}