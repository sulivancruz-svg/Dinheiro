import { describe, it, expect } from "vitest";
import { DiagnosticoInputSchema } from "@/lib/validation/diagnostico";

describe("DiagnosticoInputSchema", () => {
  const validInput = {
    rendaFixa: 2000,
    rendaVariavel: 500,
    gastosFixos: 1800,
    gastosVariaveis: 400,
    parcelasMensais: 200,
    valorPoupado: 500,
    valorInvestido: 1000,
    dividaTotal: 5000,
  };

  it("should validate correct input", () => {
    const result = DiagnosticoInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validInput);
    }
  });

  it("should reject negative rendaFixa", () => {
    const result = DiagnosticoInputSchema.safeParse({
      ...validInput,
      rendaFixa: -100,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative rendaVariavel", () => {
    const result = DiagnosticoInputSchema.safeParse({
      ...validInput,
      rendaVariavel: -50,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative gastosFixos", () => {
    const result = DiagnosticoInputSchema.safeParse({
      ...validInput,
      gastosFixos: -1000,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative gastosVariaveis", () => {
    const result = DiagnosticoInputSchema.safeParse({
      ...validInput,
      gastosVariaveis: -200,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative parcelasMensais", () => {
    const result = DiagnosticoInputSchema.safeParse({
      ...validInput,
      parcelasMensais: -100,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative valorPoupado", () => {
    const result = DiagnosticoInputSchema.safeParse({
      ...validInput,
      valorPoupado: -500,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative valorInvestido", () => {
    const result = DiagnosticoInputSchema.safeParse({
      ...validInput,
      valorInvestido: -1000,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative dividaTotal", () => {
    const result = DiagnosticoInputSchema.safeParse({
      ...validInput,
      dividaTotal: -5000,
    });
    expect(result.success).toBe(false);
  });

  it("should reject missing fields", () => {
    const result = DiagnosticoInputSchema.safeParse({
      rendaFixa: 2000,
      // Missing other required fields
    });
    expect(result.success).toBe(false);
  });

  it("should accept zero values", () => {
    const zeroInput = {
      rendaFixa: 0,
      rendaVariavel: 0,
      gastosFixos: 0,
      gastosVariaveis: 0,
      parcelasMensais: 0,
      valorPoupado: 0,
      valorInvestido: 0,
      dividaTotal: 0,
    };
    const result = DiagnosticoInputSchema.safeParse(zeroInput);
    expect(result.success).toBe(true);
  });

  it("should reject non-numeric values", () => {
    const result = DiagnosticoInputSchema.safeParse({
      ...validInput,
      rendaFixa: "2000", // string instead of number
    });
    expect(result.success).toBe(false);
  });

  it("should handle large numbers", () => {
    const largeInput = {
      ...validInput,
      rendaFixa: 1000000,
      dividaTotal: 500000,
    };
    const result = DiagnosticoInputSchema.safeParse(largeInput);
    expect(result.success).toBe(true);
  });
});
