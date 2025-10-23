
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, role = "CLIENT", phone } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Email, password, firstName ve lastName gereklidir" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email adresi zaten kullanılmaktadır" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Validate and convert role
    const validRoles = ["ADMINISTRATOR", "COORDINATOR", "PSYCHOLOGIST", "CLIENT"];
    const userRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() as UserRole : UserRole.CLIENT;

    // Create user with role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        role: userRole,
        isActive: true
      }
    });

    // Create additional records based on role
    if (userRole === "PSYCHOLOGIST" || userRole === "COORDINATOR") {
      await prisma.personnel.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone: phone || null,
          isActive: true
        }
      });
    } else if (userRole === "CLIENT") {
      await prisma.client.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone: phone || null,
          isActive: true
        }
      });
    }

    return NextResponse.json(
      { message: "Kullanıcı başarıyla oluşturuldu", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
