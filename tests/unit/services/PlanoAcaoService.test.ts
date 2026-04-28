import { describe, it, expect } from "vitest";
import { PlanoAcaoService } from "@/lib/services/PlanoAcaoService";

describe("PlanoAcaoService", () => {
  it("should generate plano for Sobrevivente", () => {
    const diagnostico = {
      perfil: "sobrevivente_financeiro",
      saldoMensal: -200,
      percentualComprometido: 110,
      rendaTotal: 3000,
      capacidade_poupanca: 0,
    };

    const plano = PlanoAcaoService.gerarPlano(diagnostico);
    expect(plano).toBeDefined();
    expect(plano.problemaPrincipal).toContain("gastando mais");
    expect(plano.prioridade).toBeDefined();
    expect(plano.acoes.length).toBeGreaterThan(0);
    expect(plano.metaEconomia).toBeGreaterThanOrEqual(0);
  });

  it("should suggest meta economia based on situation", () => {
    const diagnostico = {
      perfil: "organizador_em_construcao",
      saldoMensal: 800,
      rendaTotal: 3500,
      capacidade_poupanca: 800,
    };

    const plano = PlanoAcaoService.gerarPlano(diagnostico);
    expect(plano.metaEconomia).toBeGreaterThan(0);
    expect(plano.metaEconomia).toBeLessThanOrEqual(800);
  });

  it("should have habito semanal for gastador emocional", () => {
    const diagnostico = {
      perfil: "gastador_emocional",
      saldoMensal: 150,
      percentualComprometido: 85,
      rendaTotal: 3000,
      capacidade_poupanca: 150,
    };

    const plano = PlanoAcaoService.gerarPlano(diagnostico);
    expect(plano.habitoSemanal).toBeDefined();
    expect(plano.habitoSemanal.length).toBeGreaterThan(0);
  });

  it("should include alerta for acumulador ansioso", () => {
    const diagnostico = {
      perfil: "acumulador_ansioso",
      saldoMensal: 300,
      percentualComprometido: 70,
      rendaTotal: 3000,
      capacidade_poupanca: 300,
    };

    const plano = PlanoAcaoService.gerarPlano(diagnostico);
    expect(plano.alerta).toBeDefined();
    expect(plano.alerta.length).toBeGreaterThan(0);
  });

  it("should generate specific acoes array", () => {
    const diagnostico = {
      perfil: "potencial_travado",
      saldoMensal: 2500,
      percentualComprometido: 50,
      rendaTotal: 5000,
      capacidade_poupanca: 2500,
    };

    const plano = PlanoAcaoService.gerarPlano(diagnostico);
    expect(Array.isArray(plano.acoes)).toBe(true);
    expect(plano.acoes.length).toBeGreaterThanOrEqual(3);
    expect(plano.acoes[0]).toBeTruthy();
  });

  it("should handle construtor patrimonio profile", () => {
    const diagnostico = {
      perfil: "construtor_patrimonio",
      saldoMensal: 3000,
      percentualComprometido: 40,
      rendaTotal: 5000,
      capacidade_poupanca: 3000,
    };

    const plano = PlanoAcaoService.gerarPlano(diagnostico);
    expect(plano.problemaPrincipal).toContain("otimizar");
    expect(plano.metaEconomia).toBe(3000);
  });
});
