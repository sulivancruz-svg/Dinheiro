import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { MentorInputSchema } from "@/lib/validation/mentor";
import { MentorIAService } from "@/lib/services/MentorIAService";
import { logSecureEvent } from "@/lib/utils/logger";
import { checkRateLimit } from "@/lib/security/rateLimiting";
import { prisma } from "@/lib/db/prisma";
import { Anthropic } from "@anthropic-ai/sdk";

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
    const rateLimitKey = `api:mentor:${userId}`;
    if (!checkRateLimit(rateLimitKey, 100, 60000)) {
      logSecureEvent("rate_limit_exceeded", userId, ipAddress, {
        route: "/api/mentor",
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
        route: "/api/mentor",
      });
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // Validate input
    const validation = MentorInputSchema.safeParse(body);
    if (!validation.success) {
      logSecureEvent("validation_failed", userId, ipAddress, {
        route: "/api/mentor",
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
    const pergunta = input.pergunta;

    // Fetch user's latest diagnostico
    const diagnostico = await prisma.diagnostico.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!diagnostico) {
      logSecureEvent("diagnostico_not_found", userId, ipAddress, {
        route: "/api/mentor",
      });
      return NextResponse.json(
        { error: "No financial diagnostico found. Please complete your profile first." },
        { status: 404 }
      );
    }

    // Fetch or create chat session
    let chatSession = await prisma.chatSession.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId,
          titulo: "Conversa com Mentor",
        },
      });
    }

    // Fetch last 10 messages for context (ordered by createdAt ascending)
    const lastMessages = await prisma.chatMessage.findMany({
      where: { sessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // Format messages for MentorIAService
    const formattedMessages = lastMessages.map((msg) => ({
      role: msg.role,
      content: msg.conteudo,
    }));

    // Prepare data for Claude using MentorIAService
    const diagnosticoParaMentor = {
      perfil: "unknown", // Will be updated based on data below
      rendaTotal: diagnostico.rendaFixa + diagnostico.rendaVariavel,
      saldoMensal:
        (diagnostico.rendaFixa + diagnostico.rendaVariavel) -
        (diagnostico.gastosFixos + diagnostico.gastosVariaveis) -
        diagnostico.parcelasMensais,
      percentualComprometido:
        ((diagnostico.gastosFixos +
          diagnostico.gastosVariaveis +
          diagnostico.parcelasMensais) /
          (diagnostico.rendaFixa + diagnostico.rendaVariavel)) *
        100,
      capacidade_poupanca:
        (diagnostico.rendaFixa + diagnostico.rendaVariavel) -
        (diagnostico.gastosFixos + diagnostico.gastosVariaveis) -
        diagnostico.parcelasMensais,
    };

    // Determine perfil for context
    const saldoMensal = diagnosticoParaMentor.saldoMensal;
    const percentualComprometido = diagnosticoParaMentor.percentualComprometido;

    if (saldoMensal < 0) {
      diagnosticoParaMentor.perfil = "sobrevivente_financeiro";
    } else if (percentualComprometido > 80) {
      diagnosticoParaMentor.perfil = "gastador_emocional";
    } else if (saldoMensal > 0 && saldoMensal < 500) {
      diagnosticoParaMentor.perfil = "potencial_travado";
    } else {
      diagnosticoParaMentor.perfil = "organizador_em_construcao";
    }

    // Prepare data using MentorIAService
    const claudeData = MentorIAService.prepararDadosParaClaude(
      diagnosticoParaMentor,
      pergunta,
      formattedMessages
    );

    // Initialize Claude API client
    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      logSecureEvent("missing_claude_key", userId, ipAddress, {
        route: "/api/mentor",
      });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    // Build messages array for Claude API
    const messages = [
      {
        role: "user" as const,
        content:
          claudeData.historicoContexto && claudeData.historicoContexto.length > 0
            ? `${claudeData.historicoContexto}\n\nNova pergunta: ${claudeData.userMessage}`
            : claudeData.userMessage,
      },
    ];

    // Call Claude API
    let mentorResponse: string;
    try {
      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        temperature: 0.7,
        system: claudeData.systemPrompt,
        messages: messages,
      });

      // Extract text from response
      const firstContent = response.content[0];
      if (firstContent.type === "text") {
        mentorResponse = firstContent.text;
      } else {
        mentorResponse =
          "Desculpe, não consegui gerar uma resposta apropriada.";
      }
    } catch (claudeError: unknown) {
      console.error("Claude API error:", claudeError);
      logSecureEvent("claude_api_error", userId, ipAddress, {
        route: "/api/mentor",
        errorType: claudeError instanceof Error ? claudeError.message : "unknown",
      });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Save user message to database
    try {
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: "USER",
          conteudo: pergunta,
        },
      });
    } catch (dbError) {
      console.error("Error saving user message to database:", dbError);
      logSecureEvent("mentor_message_save_failed", userId, ipAddress, {
        route: "/api/mentor",
        role: "USER",
        errorType: dbError instanceof Error ? dbError.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Falha ao salvar mensagem. Tente novamente." },
        { status: 500 }
      );
    }

    // Save mentor response to database
    try {
      await prisma.chatMessage.create({
        data: {
          sessionId: chatSession.id,
          role: "ASSISTANT",
          conteudo: mentorResponse,
        },
      });
    } catch (dbError) {
      console.error("Error saving assistant message to database:", dbError);
      logSecureEvent("mentor_message_save_failed", userId, ipAddress, {
        route: "/api/mentor",
        role: "ASSISTANT",
        errorType: dbError instanceof Error ? dbError.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Falha ao salvar resposta. Tente novamente." },
        { status: 500 }
      );
    }

    // Log secure event
    logSecureEvent("mentor_chat_created", userId, ipAddress, {
      route: "/api/mentor",
      sessionId: chatSession.id,
      messageCount: formattedMessages.length + 2,
    });

    // Return response
    return NextResponse.json({
      resposta: mentorResponse,
      sessionId: chatSession.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in POST /api/mentor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
