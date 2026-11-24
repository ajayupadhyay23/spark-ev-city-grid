/**
 * @file src/lib/auth.ts
 * @description NextAuth configuration with Credentials Provider, JWT session callbacks, and role authorization.
 * @purpose Implements stateless, cookie-based JWT sessions carrying the user's role ('customer' | 'operator' | 'gate').
 * Provides server-side helper `getServerAuthSession()` for Route Handlers and Server Components.
 * @connections
 * - Used by /src/app/api/auth/[...nextauth]/route.ts
 * - Used by /middleware.ts
 * - Reads user records from /src/lib/users.ts
 */

import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail, UserRole } from "./users";

// Extend NextAuth default types to include role and custom user ID
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Demo Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "customer@demo.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const user = await findUserByEmail(credentials.email);
        if (!user) {
          throw new Error("No account found with this email address.");
        }

        const isValidPassword = bcrypt.compareSync(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          throw new Error("Incorrect password. For demo accounts use: demo123");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "spark-ev-super-secret-demo-jwt-key-2026",
};

/**
 * Server-side session retrieval helper.
 * WHY: Calling `getServerAuthSession()` inside Server Components and API Route Handlers provides
 * cryptographically verified role checks directly on the server without relying on client-sent query parameters.
 */
export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}
