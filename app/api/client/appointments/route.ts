
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { userId: session.user.id }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        clientId: client.id
      },
      include: {
        personnel: {
          select: {
            firstName: true,
            lastName: true,
            photo: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        appointmentDate: 'desc'
      }
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Client appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
