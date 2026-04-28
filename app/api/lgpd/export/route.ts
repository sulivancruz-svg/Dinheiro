import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { logSecureEvent } from "@/lib/utils/logger";

const SCHEMA_VERSION = "2026-04-28.1";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const exportedAt = new Date();

    await prisma.auditLog.create({
      data: {
        evento: "lgpd_export_requested",
        userId,
        ipAddress,
        userAgent,
        detalhes: JSON.stringify({
          exportedAt: exportedAt.toISOString(),
          schemaVersion: SCHEMA_VERSION,
        }),
      },
    });

    logSecureEvent("lgpd_export_requested", userId, ipAddress, {
      schemaVersion: SCHEMA_VERSION,
    });

    const [
      user,
      diagnosticos,
      historicoMensal,
      consentimentos,
      chatSessions,
      auditLogs,
      accounts,
      sessions,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          name: true,
          image: true,
          plano: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          deletedPermanentlyAt: true,
        },
      }),
      prisma.diagnostico.findMany({
        where: { userId },
        include: {
          transacoesCSV: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.historicoMensal.findMany({
        where: { userId },
        orderBy: { mes: "desc" },
      }),
      prisma.consentimento.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.chatSession.findMany({
        where: { userId },
        include: {
          mensagens: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
      }),
      prisma.account.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          type: true,
          provider: true,
          providerAccountId: true,
          expires_at: true,
          token_type: true,
          scope: true,
        },
      }),
      prisma.session.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          expires: true,
        },
      }),
    ]);

    const payload = {
      metadata: {
        app: "Dinheiro com Direcao",
        exportType: "lgpd_user_data_export",
        schemaVersion: SCHEMA_VERSION,
        exportedAt: exportedAt.toISOString(),
        userId,
      },
      data: {
        user,
        diagnosticos,
        historicoMensal,
        consentimentos,
        chatSessions,
        auditLogs,
        accounts,
        sessions,
      },
    };

    const fileDate = exportedAt.toISOString().slice(0, 10);

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="dinheiro-com-direcao-lgpd-${fileDate}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/lgpd/export:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
