
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    // Base statistics
    let stats = {
      totalAppointments: 0,
      todayAppointments: 0,
      totalClients: 0,
      monthlyRevenue: 0,
      pendingAppointments: 0
    };

    if (userRole === "PSYCHOLOGIST") {
      const personnel = await prisma.personnel.findUnique({
        where: { userId: session.user.id }
      });

      if (personnel) {
        // Psychologist sees only their own appointments and clients
        const todayAppointments = await prisma.appointment.count({
          where: {
            personnelId: personnel.id,
            appointmentDate: {
              gte: startOfToday,
              lte: endOfToday
            }
          }
        });

        const pendingAppointments = await prisma.appointment.count({
          where: {
            personnelId: personnel.id,
            status: "SCHEDULED",
            appointmentDate: {
              gte: now
            }
          }
        });

        const totalAppointments = await prisma.appointment.count({
          where: {
            personnelId: personnel.id
          }
        });

        stats = {
          ...stats,
          todayAppointments,
          pendingAppointments,
          totalAppointments
        };
      }
    } else {
      // Administrator and Coordinator see all statistics
      const todayAppointments = await prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      });

      const totalClients = await prisma.client.count({
        where: {
          isActive: true
        }
      });

      const pendingAppointments = await prisma.appointment.count({
        where: {
          status: "SCHEDULED",
          appointmentDate: {
            gte: now
          }
        }
      });

      const totalAppointments = await prisma.appointment.count();

      stats = {
        ...stats,
        todayAppointments,
        totalClients,
        pendingAppointments,
        totalAppointments
      };

      // Only administrators see financial data
      if (userRole === "ADMINISTRATOR") {
        const monthlyTransactions = await prisma.transaction.findMany({
          where: {
            type: "INCOME",
            transactionDate: {
              gte: startOfCurrentMonth,
              lte: endOfCurrentMonth
            }
          }
        });

        const monthlyRevenue = monthlyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        stats.monthlyRevenue = monthlyRevenue;
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
