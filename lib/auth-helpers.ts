import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Checks if the user is authenticated and returns the userId
 * Returns null if not authenticated
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Verifies authentication and returns 401 error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  
  return userId;
}

/**
 * Verifies if the provided userId belongs to the authenticated user
 */
export async function verifyOwnership(userId: string): Promise<boolean> {
  const authenticatedUserId = await getAuthenticatedUserId();
  return authenticatedUserId === userId;
}

/**
 * Helper to return unauthorized error
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

/**
 * Helper to return not found error
 */
export function notFoundResponse(message = "Resource not found") {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  );
}

/**
 * Helper to return validation error
 */
export function validationErrorResponse(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  );
}

/**
 * Helper to return server error
 */
export function serverErrorResponse(message = "Internal server error") {
  return NextResponse.json(
    { error: message },
    { status: 500 }
  );
}

