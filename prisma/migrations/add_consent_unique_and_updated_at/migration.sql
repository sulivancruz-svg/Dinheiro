-- AddField updatedAt to Consentimento and AddUnique constraint
ALTER TABLE "consentimentos" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add unique constraint on userId + tipo
ALTER TABLE "consentimentos" ADD CONSTRAINT "consentimentos_userId_tipo_key" UNIQUE ("userId", "tipo");
