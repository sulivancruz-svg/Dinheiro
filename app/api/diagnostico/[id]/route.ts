import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { logSecureEvent } from "@/lib/utils/logger";
import { checkRateLimit } from "@/lib/security/rateLimiting";
import { prisma } from "@/lib/db/prisma";

export async function GET(
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
    const { id: diagnosticoId } = await params;
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";

    // Rate limiting: 100 req/min per user
    const rateLimitKey = `api:diagnostico:${userId}`;
    if (!checkRateLimit(rateLimitKey, 100, 60000)) {
      logSecureEvent("rate_limit_exceeded", userId, ipAddress, {
        route: `/api/diagnostico/${diagnosticoId}`,
      });
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Fetch diagnostico from database
    const diagnostico = await prisma.diagnostico.findUnique({
      where: { id: diagnosticoId },
    });

    // Not found
    if (!diagnostico) {
      logSecureEvent("diagnostico_not_found", userId, ipAddress, {
        diagnosticoId,
      });
      return NextResponse.json(
        { error: "Diagnóstico not found" },
        { status: 404 }
      );
    }

    // Authorization: ensure user owns this diagnostico
    if (diagnostico.userId !== userId) {
      logSecureEvent("unauthorized_diagnostico_access", userId, ipAddress, {
        diagnosticoId,
        ownerId: diagnostico.userId,
      });
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    logSecureEvent("diagnostico_fetched", userId, ipAddress, {
      diagnosticoId,
    });

    return NextResponse.json({
      id: diagnostico.id,
      userId: diagnostico.userId,
      rendaFixa: diagnostico.rendaFixa,
      rendaVariavel: diagnostico.rendaVariavel,
      gastosFixos: diagnostico.gastosFixos,
      gastosVariaveis: diagnostico.gastosVariaveis,
      parcelasMensais: diagnostico.parcelasMensais,
      valorPoupado: diagnostico.valorPoupado,
      valorInvestido: diagnostico.valorInvestido,
      dividaTotal: diagnostico.dividaTotal,
      objetivoCurto: diagnostico.objetivoCurto,
      objetivoLongo: diagnostico.objetivoLongo,
      origem: diagnostico.origem,
      createdAt: diagnostico.createdAt,
      updatedAt: diagnostico.updatedAt,
    });
  } catch (error) {
    console.error("Error in GET /api/diagnostico/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
