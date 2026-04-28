import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { logSecureEvent } from "@/lib/utils/logger";
import { checkRateLimit } from "@/lib/security/rateLimiting";
import { prisma } from "@/lib/db/prisma";

export const GET = async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: consentId } = await params;
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";

    // Rate limiting: 100 req/min per user
    const rateLimitKey = `api:consent:${userId}`;
    if (!checkRateLimit(rateLimitKey, 100, 60000)) {
      logSecureEvent("rate_limit_exceeded", userId, ipAddress, {
        route: "/api/consent/[id]",
      });
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Fetch consent from database by ID
    const consent = await prisma.consentimento.findUnique({
      where: { id: consentId },
    });

    // Check if consent exists
    if (!consent) {
      logSecureEvent("consent_not_found", userId, ipAddress, {
        route: "/api/consent/[id]",
        consentId,
      });
      return NextResponse.json(
        { error: "Consent not found" },
        { status: 404 }
      );
    }

    // Verify userId matches authenticated user
    if (consent.userId !== userId) {
      logSecureEvent("consent_unauthorized_access", userId, ipAddress, {
        route: "/api/consent/[id]",
        consentId,
        ownerUserId: consent.userId,
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Log the access event (only log tipo, no values)
    logSecureEvent("consent_accessed", userId, ipAddress, {
      consentId,
      tipo: consent.tipo,
    });

    // Log successful access
    logSecureEvent("api_request", userId, ipAddress, {
      method: "GET",
      pathname: "/api/consent/[id]",
      statusCode: 200,
    });

    return NextResponse.json({
      id: consent.id,
      userId: consent.userId,
      tipo: consent.tipo,
      aceito: consent.aceito,
      origin: consent.origin,
      updatedAt: consent.updatedAt.toISOString(),
    });
  } catch (error) {
    const userId = await getServerSession(authOptions).then(s => s?.user?.id);
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";

    // Log the error
    logSecureEvent("api_request_error", userId, ipAddress, {
      method: "GET",
      pathname: "/api/consent/[id]",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    console.error("Error in GET /api/consent/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
