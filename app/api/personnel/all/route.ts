
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
    
    // Only administrators can access full personnel data
    if (userRole !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const personnel = await prisma.personnel.findMany({
      where: {
        isActive: true
      },
      include: {
        user: {
          select: {
            email: true,
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
    console.error("Get all personnel error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
