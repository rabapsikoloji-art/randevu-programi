
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

    const packageData = await prisma.package.findUnique({
      where: { id: params.id },
      include: {
        packageServices: {
          include: {
            service: true,
          },
        },
        clientPackages: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!packageData) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    return NextResponse.json(packageData);
  } catch (error) {
    console.error("Error fetching package:", error);
    return NextResponse.json(
      { error: "Failed to fetch package" },
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
      name,
      description,
      totalSessions,
      totalPrice,
      discountPercent,
      validityDays,
      isActive,
      services,
    } = body;

    // Delete existing package services and create new ones
    await prisma.packageService.deleteMany({
      where: { packageId: params.id },
    });

    const updatedPackage = await prisma.package.update({
      where: { id: params.id },
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

    return NextResponse.json(updatedPackage);
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      { error: "Failed to update package" },
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

    if (!session || !["ADMINISTRATOR", "COORDINATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if package is assigned to any clients
    const clientPackages = await prisma.clientPackage.findMany({
      where: { packageId: params.id },
    });

    if (clientPackages.length > 0) {
      return NextResponse.json(
        { error: "Bu paket danışanlara atanmış, silinemez" },
        { status: 400 }
      );
    }

    await prisma.package.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
