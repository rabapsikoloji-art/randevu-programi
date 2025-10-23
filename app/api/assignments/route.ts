
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

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const personnelId = searchParams.get("personnelId");
    const status = searchParams.get("status");

    let where: any = {};

    // Clients can only see their own assignments
    if (session.user.role === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
      
      where.clientId = client.id;
    } else if (session.user.role === "PSYCHOLOGIST") {
      const personnel = await prisma.personnel.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!personnel) {
        return NextResponse.json({ error: "Personnel not found" }, { status: 404 });
      }
      
      where.personnelId = personnel.id;
    } else {
      // Admin and coordinator can filter
      if (clientId) where.clientId = clientId;
      if (personnelId) where.personnelId = personnelId;
    }

    if (status) where.status = status;

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
      ],
    });

    // Update overdue assignments
    const now = new Date();
    const overdueIds = assignments
      .filter(a => a.dueDate && a.dueDate < now && a.status !== 'COMPLETED')
      .map(a => a.id);

    if (overdueIds.length > 0) {
      await prisma.assignment.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: 'OVERDUE' },
      });
    }

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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

    const data = await request.json();

    // If psychologist, use their personnel ID
    let personnelId = data.personnelId;
    if (session.user.role === "PSYCHOLOGIST") {
      const personnel = await prisma.personnel.findUnique({
        where: { userId: session.user.id },
      });
      
      if (!personnel) {
        return NextResponse.json({ error: "Personnel not found" }, { status: 404 });
      }
      
      personnelId = personnel.id;
    }

    const assignment = await prisma.assignment.create({
      data: {
        clientId: data.clientId,
        personnelId: personnelId,
        title: data.title,
        description: data.description,
        type: data.type,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
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
