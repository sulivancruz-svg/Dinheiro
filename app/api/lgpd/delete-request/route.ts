import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { logSecureEvent } from "@/lib/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const requestedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: requestedAt,
        },
      });

      await tx.consentimento.updateMany({
        where: { userId },
        data: {
          aceito: false,
        },
      });

      await tx.session.deleteMany({
        where: { userId },
      });

      await tx.auditLog.create({
        data: {
          evento: "lgpd_delete_requested",
          userId,
          ipAddress,
          userAgent,
          detalhes: JSON.stringify({
            requestedAt: requestedAt.toISOString(),
            deletionType: "soft_delete",
          }),
        },
      });
    });

    logSecureEvent("lgpd_delete_requested", userId, ipAddress, {
      deletionType: "soft_delete",
    });

    return NextResponse.json({
      ok: true,
      deletedAt: requestedAt.toISOString(),
      message: "Solicitacao de exclusao registrada.",
    });
  } catch (error) {
    console.error("Error in POST /api/lgpd/delete-request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
