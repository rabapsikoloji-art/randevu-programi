
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { generateMeetLink, generateWhatsAppLink, createAppointmentWhatsAppMessage } from "@/lib/meet-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    let whereClause = {};

    // Filter appointments based on user role
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
        appointmentDate: 'asc'
      }
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    
    const data = await req.json();
    let {
      clientId,
      personnelId,
      serviceId,
      appointmentDate,
      duration,
      notes,
      price,
      isOnline
    } = data;

    // If client is creating appointment, use their own clientId
    if (userRole === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { userId: session.user.id }
      });

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      clientId = client.id;
    } else if (!["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST"].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (!clientId || !personnelId || !serviceId || !appointmentDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for conflicts
    const appointmentDateTime = new Date(appointmentDate);
    const endTime = new Date(appointmentDateTime.getTime() + (duration * 60 * 1000));

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        personnelId,
        appointmentDate: {
          gte: appointmentDateTime,
          lt: endTime
        },
        status: {
          not: "CANCELLED"
        }
      }
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        { error: "Bu saatte çakışan bir randevu bulunmaktadır" },
        { status: 409 }
      );
    }

    // Online randevu ise Meet linki oluştur
    let meetLink = null;
    if (isOnline) {
      meetLink = generateMeetLink();
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        personnelId,
        serviceId,
        appointmentDate: appointmentDateTime,
        duration: duration || 50,
        notes: notes || null,
        price: price || null,
        status: "SCHEDULED",
        isOnline: isOnline || false,
        meetLink
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            user: {
              select: {
                email: true
              }
            }
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

    // Online randevu ise WhatsApp mesajı için link oluştur
    if (isOnline && meetLink && appointment.client.phone) {
      const clientName = `${appointment.client.firstName} ${appointment.client.lastName}`;
      const personnelName = `${appointment.personnel.firstName} ${appointment.personnel.lastName}`;
      
      const whatsappMessage = createAppointmentWhatsAppMessage(
        clientName,
        appointmentDateTime,
        personnelName,
        meetLink
      );
      
      const whatsappLink = generateWhatsAppLink(appointment.client.phone, whatsappMessage);
      
      // WhatsApp linkini response'a ekle (frontend'de kullanmak için)
      return NextResponse.json({ 
        ...appointment, 
        whatsappLink 
      }, { status: 201 });
    }

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
