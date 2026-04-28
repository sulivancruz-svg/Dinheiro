import { z } from "zod";

export const MentorInputSchema = z.object({
  pergunta: z
    .string()
    .min(1, "Pergunta não pode ser vazia")
    .max(500, "Pergunta não pode ter mais de 500 caracteres")
    .describe("User question for the financial mentor"),
});

export type MentorInput = z.infer<typeof MentorInputSchema>;
