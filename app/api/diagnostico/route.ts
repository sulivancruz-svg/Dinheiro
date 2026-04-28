import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { DiagnosticoInputSchema } from "@/lib/validation/diagnostico";
import { DiagnosticoService } from "@/lib/services/DiagnosticoService";
import { PerfilService } from "@/lib/services/PerfilService";
import { CaixinhasService } from "@/lib/services/CaixinhasService";
import { logSecureEvent } from "@/lib/utils/logger";
import { checkRateLimit } from "@/lib/security/rateLimiting";
import { prisma } from "@/lib/db/prisma";

type DiagnosticoRecord = {
  id: string;
  userId: string;
  rendaFixa: number;
  rendaVariavel: number;
  gastosFixos: number;
  gastosVariaveis: number;
  parcelasMensais: number;
  valorPoupado: number;
  valorInvestido: number;
  dividaTotal: number;
  objetivoCurto: string | null;
  objetivoLongo: string | null;
  origem: string;
  createdAt: Date;
  updatedAt: Date;
};

function buildDiagnosticoResponse(diagnostico: DiagnosticoRecord) {
  const rendaTotal = DiagnosticoService.calcularRendaTotal(
    diagnostico.rendaFixa,
    diagnostico.rendaVariavel
  );
  const gastosTotais = DiagnosticoService.calcularGastosTotais(
    diagnostico.gastosFixos,
    diagnostico.gastosVariaveis
  );
  const saldoMensal = DiagnosticoService.calcularSaldoMensal(
    rendaTotal,
    gastosTotais,
    diagnostico.parcelasMensais
  );
  const percentualComprometido =
    DiagnosticoService.calcularPercentualComprometido(
      gastosTotais,
      diagnostico.parcelasMensais,
      rendaTotal
    );
  const percentualDivida = DiagnosticoService.calcularPercentualDivida(
    diagnostico.parcelasMensais,
    rendaTotal
  );
  const capacidadePoupanca =
    DiagnosticoService.calcularCapacidadePoupanca(saldoMensal);
  const patrimonioLiquido = DiagnosticoService.calcularPatrimonioLiquido(
    diagnostico.valorPoupado,
    diagnostico.valorInvestido,
    diagnostico.dividaTotal
  );

  const perfil = PerfilService.classificarPerfil({
    saldoMensal,
    percentualComprometido,
    percentualDivida,
    patrimonio_liquido: patrimonioLiquido,
    valor_poupado: diagnostico.valorPoupado,
    capacidade_poupanca: capacidadePoupanca,
  });

  const caixinhasPercentuais = CaixinhasService.sugerirCaixinhas({
    perfil,
    rendaTotal,
    saldoMensal,
    percentualDivida,
  });
  const caixinhas = CaixinhasService.calcularValoresCaixinhas(
    rendaTotal,
    caixinhasPercentuais
  );

  return {
    ...diagnostico,
    perfil,
    rendaTotal,
    gastosTotais,
    saldoMensal,
    percentualComprometido,
    percentualDivida,
    capacidadePoupanca,
    patrimonioLiquido,
    caixinhas,
    caixinhasPercentuais,
  };
}

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
    const rateLimitKey = `api:diagnostico:get:${userId}`;
    if (!checkRateLimit(rateLimitKey, 100, 60000)) {
      logSecureEvent("rate_limit_exceeded", userId, ipAddress, {
        route: "/api/diagnostico",
        method: "GET",
      });
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Check if latest=true is in query params
    const url = new URL(request.url);
    const isLatest = url.searchParams.get("latest") === "true";

    if (isLatest) {
      // Fetch latest diagnostico
      const diagnostico = await prisma.diagnostico.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (!diagnostico) {
        return NextResponse.json(
          { error: "No diagnostico found" },
          { status: 404 }
        );
      }

      logSecureEvent("diagnostico_fetched", userId, ipAddress, {
        route: "/api/diagnostico",
        method: "GET",
        diagnosticoId: diagnostico.id,
      });

      return NextResponse.json(buildDiagnosticoResponse(diagnostico));
    }

    // Otherwise, return 400 Bad Request
    return NextResponse.json(
      { error: "Missing or invalid query parameter: latest" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in GET /api/diagnostico:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        route: "/api/diagnostico",
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
        route: "/api/diagnostico",
      });
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // Validate request
    const validation = DiagnosticoInputSchema.safeParse(body);

    if (!validation.success) {
      logSecureEvent("validation_failed", userId, ipAddress, {
        route: "/api/diagnostico",
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

    // Calculate financials
    const rendaTotal = DiagnosticoService.calcularRendaTotal(
      input.rendaFixa,
      input.rendaVariavel
    );
    const gastosTotais = DiagnosticoService.calcularGastosTotais(
      input.gastosFixos,
      input.gastosVariaveis
    );
    const saldoMensal = DiagnosticoService.calcularSaldoMensal(
      rendaTotal,
      gastosTotais,
      input.parcelasMensais
    );
    const percentualComprometido = DiagnosticoService.calcularPercentualComprometido(
      gastosTotais,
      input.parcelasMensais,
      rendaTotal
    );
    const percentualDivida = DiagnosticoService.calcularPercentualDivida(
      input.parcelasMensais,
      rendaTotal
    );
    const capacidadePoupanca = DiagnosticoService.calcularCapacidadePoupanca(
      saldoMensal
    );
    const patrimonioLiquido = DiagnosticoService.calcularPatrimonioLiquido(
      input.valorPoupado,
      input.valorInvestido,
      input.dividaTotal
    );

    // Classify profile
    const diagnosticoData = {
      saldoMensal,
      percentualComprometido,
      percentualDivida,
      patrimonio_liquido: patrimonioLiquido,
      valor_poupado: input.valorPoupado,
      capacidade_poupanca: capacidadePoupanca,
    };

    const perfil = PerfilService.classificarPerfil(diagnosticoData);

    // Suggest budget allocation
    const caixinhasPercentuais = CaixinhasService.sugerirCaixinhas({
      perfil,
      rendaTotal,
      saldoMensal,
      percentualDivida,
    });

    const caixinhasValores = CaixinhasService.calcularValoresCaixinhas(
      rendaTotal,
      caixinhasPercentuais
    );

    // Save to database
    const diagnostico = await prisma.diagnostico.create({
      data: {
        userId,
        rendaFixa: input.rendaFixa,
        rendaVariavel: input.rendaVariavel,
        gastosFixos: input.gastosFixos,
        gastosVariaveis: input.gastosVariaveis,
        parcelasMensais: input.parcelasMensais,
        valorPoupado: input.valorPoupado,
        valorInvestido: input.valorInvestido,
        dividaTotal: input.dividaTotal,
      },
    });

    logSecureEvent("diagnostico_created", userId, ipAddress, {
      diagnosticoId: diagnostico.id,
      perfil,
      saldoMensal: Math.round(saldoMensal),
    });

    return NextResponse.json({
      id: diagnostico.id,
      perfil,
      saldoMensal,
      rendaTotal,
      gastosTotais,
      percentualComprometido,
      patrimonioLiquido,
      caixinhas: caixinhasValores,
    });
  } catch (error) {
    console.error("Error in POST /api/diagnostico:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
