import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { logSecureEvent } from "@/lib/utils/logger";

/**
 * Audit logging middleware for API routes
 * Logs all API access automatically without blocking requests
 */
export async function auditLogMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const method = request.method;
  const pathname = request.nextUrl.pathname;
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
  let userId: string | undefined;

  try {
    // Get user ID from session if available
    try {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
    } catch {
      // Session retrieval failed, continue without userId
    }

    // Call the actual handler
    const response = await handler(request);

    // Log the API request after response
    const duration = Date.now() - startTime;
    logSecureEvent("api_request", userId, ipAddress, {
      method,
      pathname,
      statusCode: response.status,
      duration,
    });

    return response;
  } catch (error) {
    // Log the error and re-throw so route handler can handle it properly
    const duration = Date.now() - startTime;
    logSecureEvent("api_request_error", userId, ipAddress, {
      method,
      pathname,
      duration,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Let route handler manage error response
    throw error;
  }
}

/**
 * Wraps a route handler with audit logging
 * Note: Use manual logSecureEvent calls for dynamic routes that require params
 * Usage: export const POST = withAuditLog(async (req) => { ... });
 */
export function withAuditLog(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    return auditLogMiddleware(request, handler);
  };
}
