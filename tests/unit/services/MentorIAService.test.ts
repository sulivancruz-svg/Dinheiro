import { describe, it, expect, beforeEach, vi } from "vitest";
import { MentorIAService } from "@/lib/services/MentorIAService";

describe("MentorIAService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sanitize diagnostico data before sending to Claude", () => {
    const diagnostico = {
      perfil: "organizador_em_construcao",
      saldoMensal: 850,
      rendaTotal: 3500,
      percentualComprometido: 45,
    };

    const sanitized = MentorIAService.sanitizarDiagnostico(diagnostico);

    expect(sanitized.rendaFaixa).toBe("R$ 3-4 mil");
    expect(sanitized.saldoFaixa).toBe("R$ 500-1 mil");
    expect(sanitized.situacao).toContain("método");
    expect(sanitized.perfil).toBe("organizador_em_construcao");
  });

  it("should handle sobrevivente profile with negative balance", () => {
    const diagnostico = {
      perfil: "sobrevivente_financeiro",
      saldoMensal: -200,
      rendaTotal: 2000,
      percentualComprometido: 110,
    };

    const sanitized = MentorIAService.sanitizarDiagnostico(diagnostico);

    expect(sanitized.saldoFaixa).toContain("Negativo");
    expect(sanitized.situacao).toContain("Gasta mais");
  });

  it("should generate appropriate system prompt with context", () => {
    const diagnostico = {
      perfil: "acumulador_ansioso",
      saldoMensal: 300,
      rendaTotal: 2500,
      percentualComprometido: 35,
    };

    const prompt = MentorIAService.gerarPromptComContexto(diagnostico);

    expect(prompt).toContain("acumulador_ansioso");
    expect(prompt).toContain("educacional");
    expect(prompt).toContain("sem julgamentos");
  });

  it("should format last messages for Claude context", () => {
    const messages = [
      { role: "user", content: "Como faço para economizar?" },
      { role: "assistant", content: "Uma estratégia simples..." },
    ];

    const context = MentorIAService.formatarContextoChat(messages);

    expect(context).toContain("Como faço");
    expect(context).toContain("Uma estratégia");
    expect(typeof context).toBe("string");
  });

  it("should prepare data for Claude with all components", () => {
    const diagnostico = {
      perfil: "organizador_em_construcao",
      saldoMensal: 500,
      rendaTotal: 3000,
      percentualComprometido: 50,
    };

    const messages = [
      { role: "user", content: "Devo fazer uma poupança?" },
      { role: "assistant", content: "Sim, é importante..." },
    ];

    const resultado = MentorIAService.prepararDadosParaClaude(
      diagnostico,
      "Como começar a poupar?",
      messages
    );

    expect(resultado.systemPrompt).toContain("educacional");
    expect(resultado.userMessage).toBe("Como começar a poupar?");
    expect(resultado.historicoContexto).toContain("Devo fazer");
  });

  it("should handle all income ranges correctly", () => {
    const testCases = [
      { rendaTotal: 500, expected: "R$ 500-1 mil" },
      { rendaTotal: 1500, expected: "R$ 1-2 mil" },
      { rendaTotal: 2500, expected: "R$ 2-3 mil" },
      { rendaTotal: 3500, expected: "R$ 3-4 mil" },
      { rendaTotal: 4500, expected: "R$ 4-5 mil" },
      { rendaTotal: 6000, expected: "R$ 5+ mil" },
    ];

    testCases.forEach(({ rendaTotal, expected }) => {
      const sanitized = MentorIAService.sanitizarDiagnostico({
        perfil: "teste",
        saldoMensal: 0,
        rendaTotal,
      });
      expect(sanitized.rendaFaixa).toBe(expected);
    });
  });

  it("should handle all balance ranges correctly", () => {
    const testCases = [
      { saldoMensal: -600, expected: "Negativo (> -R$ 500)" },
      { saldoMensal: -200, expected: "Negativo (< -R$ 500)" },
      { saldoMensal: 0, expected: "R$ 0-500" },
      { saldoMensal: 300, expected: "R$ 0-500" },
      { saldoMensal: 800, expected: "R$ 500-1 mil" },
      { saldoMensal: 1500, expected: "R$ 1-2 mil" },
      { saldoMensal: 2500, expected: "R$ 2+ mil" },
    ];

    testCases.forEach(({ saldoMensal, expected }) => {
      const sanitized = MentorIAService.sanitizarDiagnostico({
        perfil: "teste",
        saldoMensal,
        rendaTotal: 3000,
      });
      expect(sanitized.saldoFaixa).toBe(expected);
    });
  });

  it("should describe all financial profiles correctly", () => {
    const profiles = [
      { perfil: "sobrevivente_financeiro", expectation: "Gasta mais" },
      { perfil: "gastador_emocional", expectation: "desaparece rápido" },
      { perfil: "acumulador_ansioso", expectation: "medo da dívida" },
      { perfil: "organizador_em_construcao", expectation: "método" },
      { perfil: "potencial_travado", expectation: "não consegue" },
      { perfil: "patrimonio_crescente", expectation: "patrimônio" },
    ];

    profiles.forEach(({ perfil, expectation }) => {
      const sanitized = MentorIAService.sanitizarDiagnostico({
        perfil,
        saldoMensal: 500,
        rendaTotal: 3000,
      });
      expect(sanitized.situacao).toContain(expectation);
    });
  });

  it("should handle empty chat history", () => {
    const context = MentorIAService.formatarContextoChat([]);
    expect(context).toBe("");
  });

  it("should limit chat context to last 5 messages", () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `Message ${i + 1}`,
    }));

    const context = MentorIAService.formatarContextoChat(messages);

    // Should contain messages 6-10 (last 5)
    expect(context).toContain("Message 6");
    expect(context).toContain("Message 10");
    // Message 5 should NOT be present (not in last 5)
    expect(context).not.toContain("Message 5");
    // Message 4 should NOT be present (not in last 5)
    expect(context).not.toContain("Message 4");
  });
});
