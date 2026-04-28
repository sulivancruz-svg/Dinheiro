import { z } from "zod";

const DiagnosticoSchema = z.object({
  rendaFixa: z
    .number()
    .min(0)
    .max(1000000, "Renda fixa não pode ser maior que 1 milhão"),
  rendaVariavel: z
    .number()
    .min(0)
    .max(1000000, "Renda variável não pode ser maior que 1 milhão"),
  gastosFixos: z
    .number()
    .min(0)
    .max(1000000, "Gastos fixos não podem ser maiores que 1 milhão"),
  gastosVariaveis: z
    .number()
    .min(0)
    .max(1000000, "Gastos variáveis não podem ser maiores que 1 milhão"),
  dividaTotal: z
    .number()
    .min(0)
    .max(10000000, "Dívida não pode exceder 10 milhões"),
  parcelasMensais: z
    .number()
    .min(0)
    .max(1000000, "Parcelas não podem exceder 1 milhão"),
  valorPoupado: z
    .number()
    .min(0)
    .max(10000000, "Poupança não pode exceder 10 milhões"),
  valorInvestido: z
    .number()
    .min(0)
    .max(10000000, "Investimento não pode exceder 10 milhões"),
  objetivoCurto: z.string().optional(),
  objetivoLongo: z.string().optional(),
});

export type DiagnosticoInput = z.infer<typeof DiagnosticoSchema>;

/**
 * Validates financial diagnostico data
 * @param data - Input data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateDiagnostico(data: unknown) {
  return DiagnosticoSchema.safeParse(data);
}

/**
 * Sanitizes text by removing HTML and limiting length
 * @param text - Raw text input
 * @returns Sanitized text (max 500 chars, no HTML)
 * @throws Error if text is null/undefined
 */
export function sanitizeText(text: unknown): string {
  if (typeof text !== "string") {
    throw new Error("Text must be a string");
  }
  if (!text) {
    return "";
  }
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .trim()
    .substring(0, 500); // Limit to 500 chars
}
