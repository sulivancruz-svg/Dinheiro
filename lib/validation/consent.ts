import { z } from "zod";

export const ConsentInputSchema = z.object({
  tipo: z
    .enum(["WHATSAPP", "EMAIL_MARKETING"], {
      message: "Tipo de consentimento invalido. Use 'WHATSAPP' ou 'EMAIL_MARKETING'",
    })
    .describe("Tipo de consentimento"),
  aceito: z
    .boolean({
      message: "Aceito deve ser um booleano (verdadeiro ou falso)",
    })
    .describe("Se o consentimento foi aceito ou revogado"),
});

export type ConsentInput = z.infer<typeof ConsentInputSchema>;
