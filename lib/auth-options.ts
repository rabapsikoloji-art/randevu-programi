
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              personnel: true,
              client: true
            }
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            return null;
          }

          if (!user.isActive) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            ethicsFormAccepted: user.ethicsFormAccepted,
            personnel: user.personnel,
            client: user.client
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.ethicsFormAccepted = user.ethicsFormAccepted;
        token.personnel = user.personnel;
        token.client = user.client;
      }
      
      // Session güncelleme durumunda token'ı güncelle
      if (trigger === "update") {
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            personnel: true,
            client: true
          }
        });
        
        if (updatedUser) {
          token.ethicsFormAccepted = updatedUser.ethicsFormAccepted;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
          ethicsFormAccepted: token.ethicsFormAccepted,
          personnel: token.personnel,
          client: token.client
        }
      };
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to check user permissions
export function hasPermission(userRole: UserRole, requiredRole: UserRole[]): boolean {
  return requiredRole.includes(userRole);
}

// Role hierarchy for permission checking
export const roleHierarchy = {
  [UserRole.ADMINISTRATOR]: [UserRole.ADMINISTRATOR, UserRole.COORDINATOR, UserRole.PSYCHOLOGIST, UserRole.CLIENT],
  [UserRole.COORDINATOR]: [UserRole.COORDINATOR, UserRole.CLIENT],
  [UserRole.PSYCHOLOGIST]: [UserRole.PSYCHOLOGIST, UserRole.CLIENT],
  [UserRole.CLIENT]: [UserRole.CLIENT]
};

export function canAccessRole(userRole: UserRole, targetRole: UserRole): boolean {
  return roleHierarchy[userRole]?.includes(targetRole as any) || false;
}
