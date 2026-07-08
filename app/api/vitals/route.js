import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/get-db-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const vitals = await prisma.vital.findMany({
      where: { userId: dbUser.id },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json({ vitals });
  } catch (error) {
    console.error("Error in GET /api/vitals:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const dbUser = await getDbUser();
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, value, secondary, unit, notes, status, date, time } = body;

    if (!type || value === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Parse recordedAt date/time
    let recordedAt = new Date();
    if (date && time) {
      recordedAt = new Date(`${date}T${time}`);
    } else if (date) {
      recordedAt = new Date(date);
    }

    const vital = await prisma.vital.create({
      data: {
        userId: dbUser.id,
        type,
        value: parseFloat(value),
        secondary: secondary ? parseFloat(secondary) : null,
        unit,
        notes,
        status: status || "normal",
        recordedAt,
      },
    });

    return NextResponse.json({ success: true, vital });
  } catch (error) {
    console.error("Error in POST /api/vitals:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
