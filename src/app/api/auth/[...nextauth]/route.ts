/**
 * @file src/app/api/auth/[...nextauth]/route.ts
 * @description Next.js Route Handler exposing NextAuth API endpoints (/api/auth/signin, callback, session, csrf).
 * @purpose Connects NextAuth handlers with Next.js App Router route pattern.
 * @connections
 * - Uses authOptions from /src/lib/auth.ts
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
