import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const scans = await prisma.scan.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    const predictions = scans.map((scan) => ({
      id: scan.id,
      scanType: scan.scanType === "chest-xray" ? "Chest X-Ray" : scan.scanType === "skin-lesion" ? "Skin Lesion" : "Retinal Scan",
      disease: scan.predictedLabel,
      confidence: scan.confidence,
      severity: scan.severity,
      imageUrl: scan.imageUrl,
      createdAt: scan.createdAt.toISOString(),
    }));

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error("Error in GET /api/history:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
