
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { parseCSV, validateServiceData, ImportResult } from "@/lib/import-utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.user.role !== "ADMINISTRATOR" &&
      session.user.role !== "COORDINATOR"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const records = await parseCSV(file);
    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const validation = validateServiceData(record);

      if (!validation.valid) {
        result.failed++;
        result.errors.push(`Satır ${i + 2}: ${validation.errors.join(", ")}`);
        continue;
      }

      try {
        await prisma.service.create({
          data: {
            name: record.name,
            description: record.description || "",
            price: parseFloat(record.price),
            duration: parseInt(record.duration),
            serviceType: record.serviceType || "INDIVIDUAL_THERAPY",
          },
        });

        result.imported++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(
          `Satır ${i + 2}: ${error.message || "Kaydedilemedi"}`
        );
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
