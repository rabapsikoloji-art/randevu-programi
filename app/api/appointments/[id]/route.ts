
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateMeetLink } from "@/lib/meet-utils";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const data = await req.json();
    const { id } = params;

    // Online durumu değiştiyse ve online yapıldıysa meet link oluştur
    const updateData: any = {
      ...data,
      appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : undefined,
      updatedAt: new Date()
    };

    // isOnline true yapılıyorsa ve meetLink yoksa, yeni bir link oluştur
    if (data.isOnline && !data.meetLink) {
      updateData.meetLink = generateMeetLink();
    }
    
    // isOnline false yapılıyorsa meetLink'i temizle
    if (data.isOnline === false) {
      updateData.meetLink = null;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
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
      }
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Update appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    
    // Check permissions
    if (!["ADMINISTRATOR", "COORDINATOR"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;

    await prisma.appointment.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
