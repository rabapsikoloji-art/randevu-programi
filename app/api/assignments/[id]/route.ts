
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { uploadFile } from "@/lib/s3";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = params.id;
    
    // Check if assignment exists and user has access
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        client: { select: { userId: true } },
        personnel: { select: { userId: true } },
      },
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Check permissions
    const isClient = session.user.role === "CLIENT" && existingAssignment.client.userId === session.user.id;
    const isPersonnel = ["PSYCHOLOGIST", "ADMINISTRATOR"].includes(session.user.role || "") && 
                       existingAssignment.personnel.userId === session.user.id;
    const isAdmin = session.user.role === "ADMINISTRATOR";

    if (!isClient && !isPersonnel && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type");
    let updateData: any = {};

    if (contentType?.includes("multipart/form-data")) {
      // Handle file uploads from client
      const formData = await request.formData();
      
      const status = formData.get("status") as string | null;
      const notes = formData.get("notes") as string | null;
      const clientFeedback = formData.get("clientFeedback") as string | null;
      
      if (status) updateData.status = status;
      if (notes !== null) updateData.notes = notes;
      if (clientFeedback !== null) updateData.clientFeedback = clientFeedback;
      
      // Handle file uploads (submissions from client)
      const files = formData.getAll("files") as File[];
      if (files.length > 0) {
        const newSubmissions: Array<{ name: string; path: string }> = [];
        
        for (const file of files) {
          if (file.size > 0) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const path = await uploadFile(buffer, file.name);
            newSubmissions.push({ name: file.name, path });
          }
        }
        
        // Merge with existing submissions
        const existingSubmissions = (existingAssignment.submissions as any) || [];
        updateData.submissions = [...existingSubmissions, ...newSubmissions];
      }
      
      if (status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
    } else {
      // Handle JSON updates (from personnel or regular updates)
      const data = await request.json();
      updateData = data;
      
      if (data.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
    }

    const assignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: updateData,
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
    console.error("Update assignment error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and psychologists can delete
    if (
      session.user.role !== "ADMINISTRATOR" &&
      session.user.role !== "PSYCHOLOGIST"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.assignment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
