import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getUserFromToken } from "@/lib/getUser";
import { rateLimit, createRateLimitResponse } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const rateLimitCheck = rateLimit(req, "upload");
  if (!rateLimitCheck.success) {
    return createRateLimitResponse(rateLimitCheck.retryAfter!);
  }

  try {
    const userToken = await getUserFromToken();

    if (!userToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB" },
        { status: 400 }
      );
    }

    const safeOriginalName = path.basename(file.name).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
    const fileName = `${userToken.userId}-${Date.now()}-${safeOriginalName || "upload"}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      message: "Image uploaded successfully",
      url: fileUrl,
      fileName,
      size: file.size,
    });
  } catch (error) {
    console.error("UPLOAD IMAGE ERROR:", error);

    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
