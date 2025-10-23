
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
    
    // Check permissions
    if (!["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const personnel = await prisma.personnel.findMany({
      where: {
        isActive: true,
        user: {
          role: {
            in: ["PSYCHOLOGIST", "COORDINATOR"]
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        phone: true,
        createdAt: true,
        user: {
          select: {
            role: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    return NextResponse.json(personnel);
  } catch (error) {
    console.error("Get personnel error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
