-- AddColumn origin to Consentimento
ALTER TABLE "consentimentos" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'api';
