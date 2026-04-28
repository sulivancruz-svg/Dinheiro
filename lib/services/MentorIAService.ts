import { MENTOR_SYSTEM_PROMPT } from "@/lib/prompts/systemPrompts";

interface DiagnosticoParaMentor {
  perfil: string;
  saldoMensal: number;
  rendaTotal: number;
  percentualComprometido?: number;
  capacidade_poupanca?: number;
}

interface SanitizadoParaMentor {
  perfil: string;
  rendaFaixa: string;
  saldoFaixa: string;
  situacao: string;
}

/**
 * Service for AI mentor interactions with Claude API
 * Sanitizes financial data and prepares context for Claude
 */
export class MentorIAService {
  /**
   * Sanitizes diagnostico to send to Claude
   * Removes exact values, uses income/balance ranges for LGPD compliance
   * @param diagnostico Financial diagnostico from user
   * @returns Sanitized data with ranges instead of exact values
   */
  static sanitizarDiagnostico(
    diagnostico: DiagnosticoParaMentor
  ): SanitizadoParaMentor {
    const {
      perfil,
      rendaTotal,
      saldoMensal,
      percentualComprometido = 0,
    } = diagnostico;

    // Render renda em faixa (nunca valor exato)
    const rendaFaixa = this.gerarFaixaRenda(rendaTotal);

    // Render saldo em faixa
    const saldoFaixa = this.gerarFaixaSaldo(saldoMensal);

    // Gera descrição textual da situação baseada no perfil
    const situacao = this.descreverSituacao(
      perfil,
      saldoMensal,
      percentualComprometido
    );

    return {
      perfil,
      rendaFaixa,
      saldoFaixa,
      situacao,
    };
  }

  /**
   * Generates income range bands
   * @param renda Total monthly income
   * @returns Income range as string (e.g., "R$ 3-4 mil")
   */
  private static gerarFaixaRenda(renda: number): string {
    if (renda < 1000) return "R$ 500-1 mil";
    if (renda < 2000) return "R$ 1-2 mil";
    if (renda < 3000) return "R$ 2-3 mil";
    if (renda < 4000) return "R$ 3-4 mil";
    if (renda < 5000) return "R$ 4-5 mil";
    return "R$ 5+ mil";
  }

  /**
   * Generates balance range bands
   * @param saldo Monthly balance/surplus
   * @returns Balance range as string (e.g., "R$ 800-900")
   */
  private static gerarFaixaSaldo(saldo: number): string {
    if (saldo < -500) return "Negativo (> -R$ 500)";
    if (saldo < 0) return "Negativo (< -R$ 500)";
    if (saldo < 500) return "R$ 0-500";
    if (saldo < 1000) return "R$ 500-1 mil";
    if (saldo < 2000) return "R$ 1-2 mil";
    return "R$ 2+ mil";
  }

  /**
   * Describes financial situation based on profile
   * @param perfil User's financial profile
   * @param saldoMensal Monthly balance
   * @param percentualComprometido Percentage of income committed
   * @returns Descriptive text about financial situation
   */
  private static descreverSituacao(
    perfil: string,
    saldoMensal: number,
    percentualComprometido: number
  ): string {
    if (perfil === "sobrevivente_financeiro") {
      return "Gasta mais do que ganha. Situação crítica.";
    } else if (perfil === "gastador_emocional") {
      return "Gastos altos. Dinheiro desaparece rápido.";
    } else if (perfil === "acumulador_ansioso") {
      return "Guarda dinheiro mas vive com medo da dívida.";
    } else if (perfil === "organizador_em_construcao") {
      return "Tem método. Pode crescer mais com disciplina.";
    } else if (perfil === "potencial_travado") {
      return "Saldo bom mas não consegue começar a guardar.";
    }
    return "Já tem patrimônio construído. Hora de otimizar.";
  }

  /**
   * Generates system prompt with user context
   * @param diagnostico Financial diagnostico with user context
   * @returns System prompt enriched with user context
   */
  static gerarPromptComContexto(diagnostico: DiagnosticoParaMentor): string {
    const sanitizado = this.sanitizarDiagnostico(diagnostico);

    return `${MENTOR_SYSTEM_PROMPT}

CONTEXTO DO USUÁRIO:
- Perfil: ${sanitizado.perfil}
- Renda aproximada: ${sanitizado.rendaFaixa}
- Saldo mensal: ${sanitizado.saldoFaixa}
- Situação: ${sanitizado.situacao}

Baseado neste contexto, responda ao usuário de forma educacional, acolhedora e realista.`;
  }

  /**
   * Formats last chat messages for Claude context
   * @param messages Array of chat messages
   * @returns Formatted context string (max last 5 messages)
   */
  static formatarContextoChat(
    messages: Array<{ role: string; content: string }>
  ): string {
    if (messages.length === 0) return "";

    return messages
      .slice(-5) // Últimas 5 mensagens
      .map((msg) => {
        const roleName = msg.role === "user" ? "Usuário" : "Mentor";
        return `${roleName}: ${msg.content}`;
      })
      .join("\n");
  }

  /**
   * Prepares all data to send to Claude API
   * @param diagnostico User's financial diagnostico
   * @param pergunta Current user question
   * @param historicoChat Chat history for context
   * @returns Object with systemPrompt, userMessage, and historicoContexto
   */
  static prepararDadosParaClaude(
    diagnostico: DiagnosticoParaMentor,
    pergunta: string,
    historicoChat: Array<{ role: string; content: string }>
  ): {
    systemPrompt: string;
    userMessage: string;
    historicoContexto: string;
  } {
    return {
      systemPrompt: this.gerarPromptComContexto(diagnostico),
      userMessage: pergunta,
      historicoContexto: this.formatarContextoChat(historicoChat),
    };
  }
}
