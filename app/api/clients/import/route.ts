
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { parseCSV, validateClientData, ImportResult } from "@/lib/import-utils";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
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
      const validation = validateClientData(record);

      if (!validation.valid) {
        result.failed++;
        result.errors.push(`Satır ${i + 2}: ${validation.errors.join(", ")}`);
        continue;
      }

      try {
        // Create user first
        const user = await prisma.user.create({
          data: {
            email: record.email || `client${Date.now()}${i}@temp.com`,
            name: `${record.firstName} ${record.lastName}`,
            role: "CLIENT",
            password: "$2a$10$defaultPasswordHash", // They should reset
          },
        });

        // Create client
        await prisma.client.create({
          data: {
            userId: user.id,
            firstName: record.firstName,
            lastName: record.lastName,
            phone: record.phone || null,
            dateOfBirth: record.dateOfBirth
              ? new Date(record.dateOfBirth)
              : null,
            emergencyContact: record.emergencyContact || null,
            emergencyPhone: record.emergencyPhone || null,
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
