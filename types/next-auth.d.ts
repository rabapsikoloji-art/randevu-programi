
import NextAuth from "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      ethicsFormAccepted: boolean;
      personnel?: {
        id: string;
        firstName: string;
        lastName: string;
        photo?: string | null;
      } | null;
      client?: {
        id: string;
        firstName: string;
        lastName: string;
        photo?: string | null;
      } | null;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    ethicsFormAccepted: boolean;
    personnel?: {
      id: string;
      firstName: string;
      lastName: string;
      photo?: string | null;
    } | null;
    client?: {
      id: string;
      firstName: string;
      lastName: string;
      photo?: string | null;
    } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    ethicsFormAccepted: boolean;
    personnel?: {
      id: string;
      firstName: string;
      lastName: string;
      photo?: string | null;
    } | null;
    client?: {
      id: string;
      firstName: string;
      lastName: string;
      photo?: string | null;
    } | null;
  }
}
