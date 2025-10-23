
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only psychologists and admins can create assignments
    if (
      session.user.role !== "ADMINISTRATOR" &&
      session.user.role !== "PSYCHOLOGIST"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    
    const clientId = formData.get("clientId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const dueDateStr = formData.get("dueDate") as string | null;
    
    // If psychologist, use their personnel ID
    let personnelId: string;
    if (session.user.role === "PSYCHOLOGIST") {
      const personnel = await prisma.personnel.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!personnel) {
        return NextResponse.json({ error: "Personnel not found" }, { status: 404 });
      }
      
      personnelId = personnel.id;
    } else {
      personnelId = formData.get("personnelId") as string;
    }

    // Handle file uploads
    const files = formData.getAll("files") as File[];
    const attachments: Array<{ name: string; path: string }> = [];
    
    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const path = await uploadFile(buffer, file.name);
        attachments.push({ name: file.name, path });
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        clientId,
        personnelId,
        title,
        description,
        type: type as any,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
        attachments: attachments.length > 0 ? (attachments as any) : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        personnel: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Create assignment error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
