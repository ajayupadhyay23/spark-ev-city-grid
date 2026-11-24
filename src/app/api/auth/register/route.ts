/**
 * @file src/app/api/auth/register/route.ts
 * @description API endpoint for public customer registration.
 * @purpose Creates new customer accounts with bcrypt password hashing.
 * Business Rule: Only the 'customer' role can be registered here; prevents unauthorized privilege escalation.
 * @connections
 * - Reads/writes /src/lib/users.ts
 * - Used by /src/app/register/page.tsx
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCustomer } from "@/lib/users";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = registerSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, email, password } = result.data;

    try {
      const newUser = await createCustomer(name, email, password);
      return NextResponse.json(
        {
          success: true,
          message: "Customer account created successfully. Please sign in.",
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          },
        },
        { status: 201 }
      );
    } catch (creationError) {
      const msg =
        creationError instanceof Error
          ? creationError.message
          : "A user with this email already exists.";
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }
  } catch (error) {
    console.error("[POST /api/auth/register] Exception:", error);
    return NextResponse.json(
      { success: false, error: "Server registration error" },
      { status: 500 }
    );
  }
}
