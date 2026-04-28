import { describe, it, expect } from "vitest";
import { PerfilService } from "@/lib/services/PerfilService";

describe("PerfilService", () => {
  it("should classify Sobrevivente (saldo negativo)", () => {
    const diagnostico = {
      saldoMensal: -200,
      percentualComprometido: 110,
      percentualDivida: 15,
      patrimonio_liquido: -1000,
      valor_poupado: 0,
      capacidade_poupanca: 0,
    };

    const perfil = PerfilService.classificarPerfil(diagnostico);
    expect(perfil).toBe("sobrevivente_financeiro");
  });

  it("should classify Organizador em Construção", () => {
    const diagnostico = {
      saldoMensal: 800,
      percentualComprometido: 70,
      percentualDivida: 8,
      patrimonio_liquido: 5000,
      valor_poupado: 5000,
      capacidade_poupanca: 800,
    };

    const perfil = PerfilService.classificarPerfil(diagnostico);
    expect(perfil).toBe("organizador_em_construcao");
  });

  it("should classify Construtor de Patrimônio", () => {
    const diagnostico = {
      saldoMensal: 2000,
      percentualComprometido: 55,
      percentualDivida: 2,
      patrimonio_liquido: 50000,
      valor_poupado: 40000,
      capacidade_poupanca: 2000,
    };

    const perfil = PerfilService.classificarPerfil(diagnostico);
    expect(perfil).toBe("construtor_patrimonio");
  });
});
