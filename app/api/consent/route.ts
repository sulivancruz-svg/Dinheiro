import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { ConsentInputSchema } from "@/lib/validation/consent";
import { logSecureEvent } from "@/lib/utils/logger";
import { checkRateLimit } from "@/lib/security/rateLimiting";
import { withAuditLog } from "@/lib/middleware/auditLogger";
import { prisma } from "@/lib/db/prisma";

export const POST = withAuditLog(async function POST(request: NextRequest) {
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
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";

    // Rate limiting: 100 req/min per user
    const rateLimitKey = `api:consent:${userId}`;
    if (!checkRateLimit(rateLimitKey, 100, 60000)) {
      logSecureEvent("rate_limit_exceeded", userId, ipAddress, {
        route: "/api/consent",
      });
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      logSecureEvent("invalid_json", userId, ipAddress, {
        route: "/api/consent",
      });
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // Validate request
    const validation = ConsentInputSchema.safeParse(body);

    if (!validation.success) {
      logSecureEvent("validation_failed", userId, ipAddress, {
        route: "/api/consent",
        errorCount: validation.error.issues.length,
      });
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const input = validation.data;

    try {
      // Check if consent already exists for this user + tipo combination
      const existingConsent = await prisma.consentimento.findFirst({
        where: {
          userId,
          tipo: input.tipo,
        },
      });

      let consent;
      let eventType: "consent_created" | "consent_updated";

      if (existingConsent) {
        // Update existing consent
        consent = await prisma.consentimento.update({
          where: { id: existingConsent.id },
          data: {
            aceito: input.aceito,
          },
        });
        eventType = "consent_updated";
      } else {
        // Create new consent
        consent = await prisma.consentimento.create({
          data: {
            userId,
            tipo: input.tipo,
            aceito: input.aceito,
            origin: "api",
            ipAddress,
          },
        });
        eventType = "consent_created";
      }

      // Log the event
      logSecureEvent(eventType, userId, ipAddress, {
        consentId: consent.id,
        tipo: input.tipo,
        aceito: input.aceito,
      });

      return NextResponse.json({
        id: consent.id,
        userId: consent.userId,
        tipo: consent.tipo,
        aceito: consent.aceito,
        origin: consent.origin,
        updatedAt: consent.updatedAt.toISOString(),
      });
    } catch (dbError: unknown) {
      // Handle Prisma unique constraint violation
      if (dbError instanceof Error && "code" in dbError && dbError.code === "P2002") {
        logSecureEvent("consent_conflict", userId, ipAddress, {
          tipo: input.tipo,
          error: "Unique constraint violation",
        });
        return NextResponse.json(
          { error: "Consentimento já existe. Atualize em vez de criar." },
          { status: 409 }
        );
      }
      // Re-throw other database errors
      throw dbError;
    }
  } catch (error) {
    console.error("Error in POST /api/consent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
