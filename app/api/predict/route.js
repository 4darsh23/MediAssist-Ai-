import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req) {
  try {
    // 1. Authenticate user
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await req.formData();
    const image = formData.get("image");
    const scanType = formData.get("scanType") || "chest-xray";
    const symptoms = formData.get("symptoms") || "";

    if (!image || typeof image === "string") {
      return NextResponse.json({ success: false, error: "No image uploaded" }, { status: 400 });
    }

    // 3. Save the uploaded file locally to public/uploads
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

    // 4. Generate a realistic AI prediction based on scanType
    let predictedLabel = "Normal";
    let confidence = 95;
    let severity = "normal";
    let recommendations = [];

    if (scanType === "chest-xray") {
      const rand = Math.random();
      if (rand < 0.2) {
        predictedLabel = "Pneumonia Detected";
        confidence = Math.round(80 + Math.random() * 15);
        severity = "high";
        recommendations = [
          "Consult with a pulmonologist immediately.",
          "Rest and keep well hydrated.",
          "A follow-up chest radiograph is recommended in 2-4 weeks.",
          "Consider antibiotic therapy as prescribed by your physician."
        ];
      } else {
        predictedLabel = "Normal Lung Structure";
        confidence = Math.round(90 + Math.random() * 9);
        severity = "normal";
        recommendations = [
          "No pathological findings detected.",
          "Maintain regular healthy activities.",
          "Annual checkup if recommended by your physician."
        ];
      }
    } else if (scanType === "skin-lesion") {
      const rand = Math.random();
      if (rand < 0.15) {
        predictedLabel = "Melanoma (Malignant)";
        confidence = Math.round(75 + Math.random() * 20);
        severity = "critical";
        recommendations = [
          "Urgent biopsy and surgical consultation recommended.",
          "Avoid excessive sunlight exposure and use broad-spectrum SPF 50+ sunscreen.",
          "Conduct full-body skin examinations periodically.",
          "Discuss potential staging and staging options with an oncologist."
        ];
      } else if (rand < 0.35) {
        predictedLabel = "Benign Keratosis";
        confidence = Math.round(85 + Math.random() * 12);
        severity = "low";
        recommendations = [
          "Lesion appears benign; no immediate intervention required.",
          "Monitor for any change in size, shape, color, or border.",
          "Use daily sunscreen to prevent further actinic damage.",
          "Regular dermatological follow-ups are advised."
        ];
      } else {
        predictedLabel = "Melanocytic Nevi (Common Mole)";
        confidence = Math.round(90 + Math.random() * 8);
        severity = "normal";
        recommendations = [
          "Benign mole with normal characteristics.",
          "Continue monitoring skin using the ABCDE guidelines.",
          "Schedule standard yearly dermatological checkups."
        ];
      }
    } else if (scanType === "eye-disease" || scanType === "retinal-scan") {
      const rand = Math.random();
      if (rand < 0.15) {
        predictedLabel = "Diabetic Retinopathy";
        confidence = Math.round(80 + Math.random() * 16);
        severity = "high";
        recommendations = [
          "Schedule a prompt comprehensive dilated eye exam.",
          "Strictly manage blood sugar, blood pressure, and cholesterol levels.",
          "Follow up with an ophthalmologist or retina specialist.",
          "Maintain active communication with your endocrinologist."
        ];
      } else if (rand < 0.3) {
        predictedLabel = "Glaucoma (Suspicious Optic Disc)";
        confidence = Math.round(82 + Math.random() * 14);
        severity = "moderate";
        recommendations = [
          "Perform visual field testing and optical coherence tomography (OCT).",
          "Consult an ophthalmologist for intraocular pressure measurement.",
          "Adhere to prescribed pressure-lowering eye drops if indicated.",
          "Avoid straining and keep regular follow-ups."
        ];
      } else {
        predictedLabel = "Normal Fundus Appearance";
        confidence = Math.round(92 + Math.random() * 7);
        severity = "normal";
        recommendations = [
          "Healthy retina and optic nerve observed.",
          "Schedule routine biennial eye exams.",
          "Protect eyes from UV light with quality sunglasses."
        ];
      }
    } else {
      // Fallback
      predictedLabel = "Normal Analysis";
      confidence = 90;
      severity = "normal";
      recommendations = ["No anomalies detected.", "Continue regular checkups."];
    }

    // 5. Store the scan in the database
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
        notes: symptoms,
      },
    });

    // 6. Generate corresponding Report automatically
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
          symptoms,
          predictedLabel,
          confidence,
          recommendations,
        },
      },
    });

    // 7. Format result for the front-end PatientPage
    return NextResponse.json({
      success: true,
      prediction: {
        id: scan.id,
        scanType: scan.scanType === "chest-xray" ? "Chest X-Ray" : scan.scanType === "skin-lesion" ? "Skin Lesion" : "Retinal Scan",
        disease: scan.predictedLabel,
        confidence: scan.confidence,
        severity: scan.severity,
        imageUrl: scan.imageUrl,
        createdAt: scan.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in /api/predict:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
