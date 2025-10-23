
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

// Update a service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Only administrators can update services" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, duration, price, serviceType } = body;

    if (!name || !duration || !price || !serviceType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        serviceType,
      },
    });

    return NextResponse.json(service);
  } catch (error: any) {
    console.error("Error updating service:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update service" },
      { status: 500 }
    );
  }
}

// Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Only administrators can delete services" }, { status: 403 });
    }

    // Check if service is used in appointments or packages
    const appointmentCount = await prisma.appointment.count({
      where: { serviceId: params.id },
    });

    const packageCount = await prisma.packageService.count({
      where: { serviceId: params.id },
    });

    if (appointmentCount > 0 || packageCount > 0) {
      return NextResponse.json(
        { error: "Bu hizmet randevularda veya paketlerde kullanılıyor. Önce ilgili kayıtları silmelisiniz." },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete service" },
      { status: 500 }
    );
  }
}
