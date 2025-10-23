
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

    const userRole = session.user.role;
    let whereClause = {};

    if (userRole === "PSYCHOLOGIST") {
      const personnel = await prisma.personnel.findUnique({
        where: { userId: session.user.id }
      });

      if (personnel) {
        whereClause = { personnelId: personnel.id };
      }
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            photo: true
          }
        },
        personnel: {
          select: {
            firstName: true,
            lastName: true
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
      },
      take: 10
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Recent appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
