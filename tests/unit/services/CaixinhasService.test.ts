import { describe, it, expect } from "vitest";
import { CaixinhasService } from "@/lib/services/CaixinhasService";

describe("CaixinhasService", () => {
  it("should suggest caixinhas for Crítico profile", () => {
    const diagnostico = {
      perfil: "sobrevivente_financeiro",
      rendaTotal: 3000,
      saldoMensal: -200,
    };

    const caixinhas = CaixinhasService.sugerirCaixinhas(diagnostico);
    expect(caixinhas.essencial).toBe(100);
    expect(caixinhas.prazer).toBe(0);
  });

  it("should suggest balanced caixinhas for Saudável", () => {
    const diagnostico = {
      perfil: "construtor_patrimonio",
      rendaTotal: 3500,
      saldoMensal: 1500,
    };

    const caixinhas = CaixinhasService.sugerirCaixinhas(diagnostico);
    expect(caixinhas.essencial).toBe(50);
    expect(caixinhas.futuro).toBeGreaterThan(10);
    expect(caixinhas.prazer).toBeGreaterThan(0);
  });

  it("should calculate actual values for caixinhas", () => {
    const percentuais = {
      essencial: 50,
      dividas: 20,
      futuro: 15,
      prazer: 10,
      crescimento: 3,
      grandes_planos: 1,
      generosidade: 1,
    };

    const valores = CaixinhasService.calcularValoresCaixinhas(3000, percentuais);

    expect(valores.essencial).toBe(1500);
    expect(valores.dividas).toBe(600);
    expect(valores.futuro).toBe(450);
    expect(valores.prazer).toBe(300);
    expect(valores.crescimento).toBe(90);
    expect(valores.grandes_planos).toBe(30);
    expect(valores.generosidade).toBe(30);
  });

  it("should suggest caixinhas for Gastador Emocional profile", () => {
    const diagnostico = {
      perfil: "gastador_emocional",
      rendaTotal: 2500,
      saldoMensal: 100,
    };

    const caixinhas = CaixinhasService.sugerirCaixinhas(diagnostico);
    expect(caixinhas.essencial).toBe(50);
    expect(caixinhas.dividas).toBe(30);
    expect(caixinhas.futuro).toBe(20);
    expect(caixinhas.prazer).toBe(0);
  });

  it("should suggest caixinhas for Acumulador Ansioso profile", () => {
    const diagnostico = {
      perfil: "acumulador_ansioso",
      rendaTotal: 3200,
      saldoMensal: 400,
    };

    const caixinhas = CaixinhasService.sugerirCaixinhas(diagnostico);
    expect(caixinhas.essencial).toBe(50);
    expect(caixinhas.dividas).toBe(20);
    expect(caixinhas.futuro).toBe(20);
    expect(caixinhas.prazer).toBeGreaterThan(0);
  });

  it("should suggest caixinhas for Organizador em Construção profile", () => {
    const diagnostico = {
      perfil: "organizador_em_construcao",
      rendaTotal: 3000,
      saldoMensal: 600,
    };

    const caixinhas = CaixinhasService.sugerirCaixinhas(diagnostico);
    expect(caixinhas.essencial).toBe(50);
    expect(caixinhas.prazer).toBeGreaterThan(0);
    expect(caixinhas.futuro).toBe(15);
  });

  it("should suggest caixinhas for Potencial Travado profile", () => {
    const diagnostico = {
      perfil: "potencial_travado",
      rendaTotal: 4000,
      saldoMensal: 2000,
      percentualDivida: 3,
    };

    const caixinhas = CaixinhasService.sugerirCaixinhas(diagnostico);
    expect(caixinhas.essencial).toBe(50);
    expect(caixinhas.futuro).toBe(20);
    expect(caixinhas.dividas).toBe(10);
  });

  it("should adjust dividas percentage based on percentualDivida for Potencial Travado", () => {
    const diagnosticoAltaDivida = {
      perfil: "potencial_travado",
      rendaTotal: 4000,
      saldoMensal: 2000,
      percentualDivida: 8,
    };

    const caixinhasAltaDivida = CaixinhasService.sugerirCaixinhas(
      diagnosticoAltaDivida
    );
    expect(caixinhasAltaDivida.dividas).toBe(15);

    const diagnosticoBaixaDivida = {
      perfil: "potencial_travado",
      rendaTotal: 4000,
      saldoMensal: 2000,
      percentualDivida: 2,
    };

    const caixinhasBaixaDivida =
      CaixinhasService.sugerirCaixinhas(diagnosticoBaixaDivida);
    expect(caixinhasBaixaDivida.dividas).toBe(10);
  });

  it("should sum to 100% for all profiles", () => {
    const profiles = [
      "sobrevivente_financeiro",
      "gastador_emocional",
      "acumulador_ansioso",
      "organizador_em_construcao",
      "potencial_travado",
      "construtor_patrimonio",
    ];

    profiles.forEach((profile) => {
      const diagnostico = {
        perfil: profile,
        rendaTotal: 3000,
        saldoMensal: 500,
        percentualDivida: 5,
      };

      const caixinhas = CaixinhasService.sugerirCaixinhas(diagnostico);
      const total =
        caixinhas.essencial +
        caixinhas.dividas +
        caixinhas.futuro +
        caixinhas.prazer +
        caixinhas.crescimento +
        caixinhas.grandes_planos +
        caixinhas.generosidade;

      expect(total).toBe(100);
    });
  });
});
