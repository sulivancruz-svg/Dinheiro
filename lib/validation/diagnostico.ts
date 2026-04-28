import { z } from "zod";

export const DiagnosticoInputSchema = z.object({
  rendaFixa: z
    .number()
    .min(0, "Renda fixa não pode ser negativa")
    .describe("Monthly fixed income"),
  rendaVariavel: z
    .number()
    .min(0, "Renda variável não pode ser negativa")
    .describe("Monthly variable income"),
  gastosFixos: z
    .number()
    .min(0, "Gastos fixos não podem ser negativos")
    .describe("Monthly fixed expenses"),
  gastosVariaveis: z
    .number()
    .min(0, "Gastos variáveis não podem ser negativos")
    .describe("Monthly variable expenses"),
  parcelasMensais: z
    .number()
    .min(0, "Parcelas não podem ser negativas")
    .describe("Monthly debt payments"),
  valorPoupado: z
    .number()
    .min(0, "Poupança não pode ser negativa")
    .describe("Current savings"),
  valorInvestido: z
    .number()
    .min(0, "Investimentos não podem ser negativos")
    .describe("Current investments"),
  dividaTotal: z
    .number()
    .min(0, "Dívida não pode ser negativa")
    .describe("Total debt"),
});

export type DiagnosticoInput = z.infer<typeof DiagnosticoInputSchema>;
