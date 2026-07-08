import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: { userId: dbUser.id },
      include: { scan: true },
      orderBy: { createdAt: "desc" },
    });

    const mappedReports = reports.map((r) => {
      // Safely parse JSON content
      const content = typeof r.content === "string" ? JSON.parse(r.content) : r.content;
      return {
        id: r.id,
        title: r.title,
        type: r.type,
        patient: `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || "Patient",
        date: new Date(r.createdAt).toISOString().split("T")[0],
        result: r.scan ? r.scan.predictedLabel : (content?.predictedLabel || r.summary || "Completed"),
        confidence: r.scan ? r.scan.confidence : (content?.confidence || null),
        severity: r.severity || "normal",
        status: r.status,
        vitals: content?.vitals || null,
        recommendations: content?.recommendations || r.scan?.recommendations || ["No immediate actions recommended."],
      };
    });

    return NextResponse.json({ reports: mappedReports });
  } catch (error) {
    console.error("Error in GET /api/reports:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
