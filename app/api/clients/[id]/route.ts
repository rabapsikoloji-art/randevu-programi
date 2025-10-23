
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        appointments: {
          include: {
            service: true,
            personnel: true,
          },
          orderBy: {
            appointmentDate: "desc",
          },
        },
        transactions: {
          orderBy: {
            transactionDate: "desc",
          },
        },
        clientPackages: {
          include: {
            package: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMINISTRATOR", "COORDINATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      emergencyContact,
      emergencyPhone,
      isActive,
      kvkk_consent,
    } = body;

    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        isActive: isActive ?? true,
        kvkk_consent: kvkk_consent || false,
        consentDate: kvkk_consent ? new Date() : null,
        user: {
          update: {
            isActive: isActive ?? true,
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client with user info
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Delete user (this will cascade delete client due to schema)
    await prisma.user.delete({
      where: { id: client.userId },
    });

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
