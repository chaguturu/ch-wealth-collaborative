import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";
import type { SessionData } from "@auth0/nextjs-auth0/types";

// validateSession
// Call this at the top of every sensitive API route handler.
// Returns the session if valid, or a 401 NextResponse if not.
// Usage:
//   const result = await validateSession(req);
//   if (result instanceof NextResponse) return result;
//   const { session, userId } = result;

export async function validateSession(req: NextRequest): Promise<
  | NextResponse
  | { session: SessionData; userId: string }
> {
  const session = await auth0.getSession(req);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Valid session required" },
      { status: 401 }
    );
  }

  return {
    session,
    userId: session.user.sub as string,
  };
}

// withAuth
// Wraps an API route handler with session validation.
// Usage:
//   export const GET = withAuth(async (req, { session, userId }) => {
//     return NextResponse.json({ ok: true });
//   });

type AuthedHandler = (
  req: NextRequest,
  auth: { session: SessionData; userId: string },
  ctx?: unknown
) => Promise<NextResponse>;

export function withAuth(handler: AuthedHandler) {
  return async function authedRoute(req: NextRequest, ctx?: unknown): Promise<NextResponse> {
    const result = await validateSession(req);
    if (result instanceof NextResponse) return result;
    return handler(req, result, ctx);
  };
}
