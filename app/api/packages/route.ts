
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const packages = await prisma.package.findMany({
      include: {
        packageServices: {
          include: {
            service: true,
          },
        },
        clientPackages: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["ADMINISTRATOR", "COORDINATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      totalSessions,
      totalPrice,
      discountPercent,
      validityDays,
      isActive,
      services,
    } = body;

    // Validate required fields
    if (!name || totalSessions <= 0 || totalPrice <= 0 || !services || services.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create package with services
    const newPackage = await prisma.package.create({
      data: {
        name,
        description: description || null,
        totalSessions,
        totalPrice,
        discountPercent: discountPercent || 0,
        validityDays,
        isActive: isActive ?? true,
        packageServices: {
          create: services.map((s: any) => ({
            serviceId: s.serviceId,
            sessions: s.sessions,
          })),
        },
      },
      include: {
        packageServices: {
          include: {
            service: true,
          },
        },
      },
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}
