import { describe, it, expect } from "vitest";
import { DiagnosticoService } from "@/lib/services/DiagnosticoService";

describe("DiagnosticoService", () => {
  it("should calculate renda total correctly", () => {
    const result = DiagnosticoService.calcularRendaTotal(3000, 500);
    expect(result).toBe(3500);
  });

  it("should calculate gastos totais correctly", () => {
    const result = DiagnosticoService.calcularGastosTotais(2000, 800);
    expect(result).toBe(2800);
  });

  it("should calculate saldo mensal correctly", () => {
    const result = DiagnosticoService.calcularSaldoMensal(3500, 2800, 300);
    expect(result).toBe(400);
  });

  it("should calculate percentual comprometido correctly", () => {
    const result = DiagnosticoService.calcularPercentualComprometido(
      2800,
      300,
      3500
    );
    expect(result).toBeCloseTo(88.57, 1);
  });

  it("should calculate patrimonio liquido correctly", () => {
    const result = DiagnosticoService.calcularPatrimonioLiquido(
      1500,
      0,
      5000
    );
    expect(result).toBe(-3500);
  });
});
