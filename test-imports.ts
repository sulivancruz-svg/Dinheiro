// Test that all security modules can be imported
import { encryptData, decryptData, hashData } from "@/lib/security/encryption";
import { validateDiagnostico, sanitizeText } from "@/lib/security/validation";
import { checkRateLimit } from "@/lib/security/rateLimiting";
import { logSecureEvent } from "@/lib/utils/logger";

console.log("All imports successful!");
console.log({
  encryption: { encryptData, decryptData, hashData },
  validation: { validateDiagnostico, sanitizeText },
  rateLimiting: { checkRateLimit },
  logger: { logSecureEvent },
});
