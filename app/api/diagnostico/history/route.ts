import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { DiagnosticoService } from "@/lib/services/DiagnosticoService";
import { PerfilService } from "@/lib/services/PerfilService";
import { logSecureEvent } from "@/lib/utils/logger";
import { checkRateLimit } from "@/lib/security/rateLimiting";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
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
    const rateLimitKey = `api:diagnostico:${userId}`;
    if (!checkRateLimit(rateLimitKey, 100, 60000)) {
      logSecureEvent("rate_limit_exceeded", userId, ipAddress, {
        route: "/api/diagnostico/history",
      });
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Parse pagination params
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    // Fetch user's diagnosticos with pagination
    const [diagnosticos, total] = await Promise.all([
      prisma.diagnostico.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.diagnostico.count({
        where: { userId },
      }),
    ]);

    // Map diagnosticos to include calculated fields
    const diagnosticosComCalculos = diagnosticos.map((diag) => {
      // Calculate financials
      const rendaTotal = DiagnosticoService.calcularRendaTotal(
        diag.rendaFixa,
        diag.rendaVariavel
      );
      const gastosTotais = DiagnosticoService.calcularGastosTotais(
        diag.gastosFixos,
        diag.gastosVariaveis
      );
      const saldoMensal = DiagnosticoService.calcularSaldoMensal(
        rendaTotal,
        gastosTotais,
        diag.parcelasMensais
      );
      const percentualComprometido = DiagnosticoService.calcularPercentualComprometido(
        gastosTotais,
        diag.parcelasMensais,
        rendaTotal
      );
      const percentualDivida = DiagnosticoService.calcularPercentualDivida(
        diag.parcelasMensais,
        rendaTotal
      );
      const capacidadePoupanca = DiagnosticoService.calcularCapacidadePoupanca(
        saldoMensal
      );
      const patrimonioLiquido = DiagnosticoService.calcularPatrimonioLiquido(
        diag.valorPoupado,
        diag.valorInvestido,
        diag.dividaTotal
      );

      // Classify profile
      const diagnosticoData = {
        saldoMensal,
        percentualComprometido,
        percentualDivida,
        patrimonio_liquido: patrimonioLiquido,
        valor_poupado: diag.valorPoupado,
        capacidade_poupanca: capacidadePoupanca,
      };

      const perfil = PerfilService.classificarPerfil(diagnosticoData);

      return {
        id: diag.id,
        perfil,
        saldoMensal,
        rendaTotal,
        patrimonioLiquido,
        createdAt: diag.createdAt,
        updatedAt: diag.updatedAt,
      };
    });

    logSecureEvent("history_fetched", userId, ipAddress, {
      count: diagnosticosComCalculos.length,
      total,
      page,
    });

    return NextResponse.json({
      diagnosticos: diagnosticosComCalculos,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error in GET /api/diagnostico/history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
