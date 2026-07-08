import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get total scans
    const totalScans = await prisma.scan.count({
      where: { userId: dbUser.id },
    });

    // 2. Get last diagnosis
    const lastScan = await prisma.scan.findFirst({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    const lastDiagnosis = lastScan
      ? `${lastScan.predictedLabel} (${lastScan.scanType === "chest-xray" ? "Chest X-Ray" : lastScan.scanType === "skin-lesion" ? "Skin Lesion" : "Retinal Scan"})`
      : "No scans recorded yet";

    // 3. Compute a dynamic Health Score
    // Start at 100, deduct points for recent severe scans
    let healthScore = 95;
    if (lastScan) {
      if (lastScan.severity === "critical") healthScore = 40;
      else if (lastScan.severity === "high") healthScore = 65;
      else if (lastScan.severity === "moderate") healthScore = 80;
      else if (lastScan.severity === "low") healthScore = 90;
    }

    // 4. Determine next checkup date
    // 7 days in the future for warning/critical, 30 days for normal
    const checkupDays = lastScan && ["high", "critical", "moderate"].includes(lastScan.severity) ? 7 : 30;
    const nextCheckupDate = new Date();
    nextCheckupDate.setDate(nextCheckupDate.getDate() + checkupDays);
    const nextCheckup = nextCheckupDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return NextResponse.json({
      totalScans,
      lastDiagnosis,
      healthScore,
      nextCheckup,
    });
  } catch (error) {
    console.error("Error in GET /api/stats/patient:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
