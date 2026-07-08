import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const image = formData.get("image");
    const scanType = formData.get("scanType");
    const predictedLabel = formData.get("predictedLabel");
    const confidence = parseInt(formData.get("confidence") || "90", 10);
    const severity = formData.get("severity") || "normal";
    const recommendations = JSON.parse(formData.get("recommendations") || "[]");
    const notes = formData.get("notes") || "";

    if (!image || typeof image === "string") {
      return NextResponse.json({ success: false, error: "No image uploaded" }, { status: 400 });
    }

    // 1. Save file locally
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uniqueFileName = `${Date.now()}-${image.name.replace(/\s+/g, "-")}`;
    const filePath = join(uploadsDir, uniqueFileName);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/${uniqueFileName}`;

    // 2. Create scan in DB
    const scan = await prisma.scan.create({
      data: {
        userId: dbUser.id,
        scanType,
        imageUrl,
        originalFileName: image.name,
        predictedLabel,
        confidence,
        severity,
        recommendations,
        status: "completed",
        notes,
      },
    });

    // 3. Create matching report in DB
    await prisma.report.create({
      data: {
        userId: dbUser.id,
        title: `${scanType.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Analysis Report`,
        type: "scan",
        summary: `AI prediction: ${predictedLabel} with ${confidence}% confidence.`,
        scanId: scan.id,
        severity,
        status: "completed",
        content: {
          predictedLabel,
          confidence,
          recommendations,
          notes,
        },
      },
    });

    return NextResponse.json({ success: true, scanId: scan.id });
  } catch (error) {
    console.error("Error in POST /api/scans:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
