
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        clientId: client.id,
      },
      include: {
        appointment: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
            personnel: {
              select: {
                firstName: true,
                lastName: true,
                photo: true,
              },
            },
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Get client transactions error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
