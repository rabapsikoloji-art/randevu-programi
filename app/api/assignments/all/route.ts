
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only psychologists and admins can see all assignments
    if (
      session.user.role !== "ADMINISTRATOR" &&
      session.user.role !== "PSYCHOLOGIST"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let where: any = {};

    // Psychologists only see their own assignments
    if (session.user.role === "PSYCHOLOGIST") {
      const personnel = await prisma.personnel.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!personnel) {
        return NextResponse.json({ error: "Personnel not found" }, { status: 404 });
      }
      
      where.personnelId = personnel.id;
    }

    const assignments = await prisma.assignment.findMany({
      where,
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
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Update overdue assignments
    const now = new Date();
    type AssignmentWithRelations = typeof assignments[number];
    const overdueIds = assignments
      .filter((a: AssignmentWithRelations) => a.dueDate && a.dueDate < now && a.status !== 'COMPLETED')
      .map((a: AssignmentWithRelations) => a.id);

    if (overdueIds.length > 0) {
      await prisma.assignment.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: 'OVERDUE' },
      });
      
      // Refetch to get updated data
      const updatedAssignments = await prisma.assignment.findMany({
        where,
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
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      });
      
      return NextResponse.json(updatedAssignments);
    }

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Get all assignments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
