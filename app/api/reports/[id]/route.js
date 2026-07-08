import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";
import { generatePdfBuffer } from "@/lib/generate-pdf";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const dbUser = await getDbUser();
    if (!dbUser) {
      return new Response("Unauthorized", { status: 401 });
    }

    let scan = await prisma.scan.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!scan) {
      // Fallback: Check if the ID matches a Report, and load its associated Scan
      const report = await prisma.report.findUnique({
        where: { id },
        include: { scan: { include: { user: true } } },
      });
      if (report && report.scan) {
        scan = report.scan;
      }
    }

    if (!scan || scan.userId !== dbUser.id) {
      return new Response("Report not found", { status: 404 });
    }

    // Prepare report data structure
    const reportData = {
      name: `${scan.user.firstName || ""} ${scan.user.lastName || ""}`.trim() || "Patient",
      email: scan.user.email,
      date: scan.createdAt.toLocaleString(),
      scanType: scan.scanType === "chest-xray" ? "Chest X-Ray" : scan.scanType === "skin-lesion" ? "Skin Lesion" : "Retinal Scan",
      result: scan.predictedLabel,
      confidence: scan.confidence,
      severity: scan.severity,
      symptoms: scan.notes,
      recommendations: scan.recommendations,
    };

    // Generate PDF Buffer
    const pdfBuffer = generatePdfBuffer(reportData);

    // Return as PDF file download
    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="diagnosis-report-${scan.id}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/reports/[id]:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
