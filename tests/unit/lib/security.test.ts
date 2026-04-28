import { describe, it, expect, beforeEach, vi } from "vitest";
import { encryptData, decryptData, hashData } from "@/lib/security/encryption";
import { validateDiagnostico, sanitizeText } from "@/lib/security/validation";
import {
  checkRateLimit,
  clearRateLimits,
  getRateLimitStoreSize,
} from "@/lib/security/rateLimiting";
import { logSecureEvent } from "@/lib/utils/logger";

describe("Security", () => {
  describe("Encryption", () => {
    const key = "test-key-32-chars-minimum-length!";

    it("should encrypt and decrypt data", () => {
      const plaintext = "sensitive-data-12345";
      const encrypted = encryptData(plaintext, key);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length > plaintext.length).toBe(true);

      const decrypted = decryptData(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it("should return different ciphertexts for same plaintext", () => {
      const plaintext = "same-data";
      const encrypted1 = encryptData(plaintext, key);
      const encrypted2 = encryptData(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decryptData(encrypted1, key)).toBe(plaintext);
      expect(decryptData(encrypted2, key)).toBe(plaintext);
    });

    it("should throw error on empty plaintext", () => {
      expect(() => encryptData("", key)).toThrow();
    });

    it("should throw error on empty key", () => {
      expect(() => encryptData("plaintext", "")).toThrow();
    });

    it("should throw error on decryption with wrong key", () => {
      const plaintext = "secret";
      const encrypted = encryptData(plaintext, key);
      const wrongKey = "wrong-key-32-chars-minimum-length";

      expect(() => decryptData(encrypted, wrongKey)).toThrow();
    });

    it("should throw error on invalid ciphertext", () => {
      expect(() => decryptData("invalid-ciphertext", key)).toThrow();
    });

    it("should throw error on empty ciphertext", () => {
      expect(() => decryptData("", key)).toThrow();
    });

    it("should hash data with SHA256", () => {
      const data = "test-data";
      const hash = hashData(data);
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA256 produces 64 hex chars
    });

    it("should produce same hash for same data", () => {
      const data = "test-data";
      const hash1 = hashData(data);
      const hash2 = hashData(data);
      expect(hash1).toBe(hash2);
    });

    it("should throw error on empty data for hashing", () => {
      expect(() => hashData("")).toThrow();
    });
  });

  describe("Validation", () => {
    it("should validate valid diagnostico", () => {
      const valid = {
        rendaFixa: 3000,
        rendaVariavel: 500,
        gastosFixos: 2000,
        gastosVariaveis: 800,
        dividaTotal: 5000,
        parcelasMensais: 300,
        valorPoupado: 1500,
        valorInvestido: 0,
      };

      const result = validateDiagnostico(valid);
      expect(result.success).toBe(true);
    });

    it("should reject negative values", () => {
      const invalid = {
        rendaFixa: -100,
        rendaVariavel: 500,
        gastosFixos: 2000,
        gastosVariaveis: 800,
        dividaTotal: 5000,
        parcelasMensais: 300,
        valorPoupado: 1500,
        valorInvestido: 0,
      };

      const result = validateDiagnostico(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject values exceeding maximum", () => {
      const invalid = {
        rendaFixa: 2000000, // Exceeds max
        rendaVariavel: 500,
        gastosFixos: 2000,
        gastosVariaveis: 800,
        dividaTotal: 5000,
        parcelasMensais: 300,
        valorPoupado: 1500,
        valorInvestido: 0,
      };

      const result = validateDiagnostico(invalid);
      expect(result.success).toBe(false);
    });

    it("should sanitize HTML from text", () => {
      const text = "Hello <script>alert('xss')</script> world";
      const sanitized = sanitizeText(text);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("</script>");
    });

    it("should limit text to 500 characters", () => {
      const longText = "a".repeat(1000);
      const sanitized = sanitizeText(longText);
      expect(sanitized.length).toBeLessThanOrEqual(500);
    });

    it("should throw error on non-string text", () => {
      expect(() => sanitizeText(123 as unknown)).toThrow();
    });

    it("should throw error on null text", () => {
      expect(() => sanitizeText(null as unknown)).toThrow();
    });

    it("should return empty string for empty text", () => {
      const result = sanitizeText("");
      expect(result).toBe("");
    });

    it("should trim whitespace", () => {
      const text = "  hello world  ";
      const sanitized = sanitizeText(text);
      expect(sanitized).toBe("hello world");
    });
  });

  describe("Rate Limiting", () => {
    beforeEach(() => {
      clearRateLimits();
    });

    it("should allow first request", () => {
      const result = checkRateLimit("user:123", 5, 60000);
      expect(result).toBe(true);
    });

    it("should allow requests within limit", () => {
      const key = "user:123";
      const limit = 5;

      for (let i = 0; i < limit; i++) {
        expect(checkRateLimit(key, limit, 60000)).toBe(true);
      }
    });

    it("should reject requests exceeding limit", () => {
      const key = "user:123";
      const limit = 3;

      for (let i = 0; i < limit; i++) {
        checkRateLimit(key, limit, 60000);
      }

      expect(checkRateLimit(key, limit, 60000)).toBe(false);
    });

    it("should track multiple keys independently", () => {
      const limit = 2;
      checkRateLimit("user:1", limit, 60000);
      checkRateLimit("user:1", limit, 60000);

      // user:2 should still have capacity
      expect(checkRateLimit("user:2", limit, 60000)).toBe(true);
    });

    it("should clear all rate limits", () => {
      checkRateLimit("user:1", 2, 60000);
      expect(getRateLimitStoreSize()).toBeGreaterThan(0);

      clearRateLimits();
      expect(getRateLimitStoreSize()).toBe(0);
    });
  });

  describe("Logging", () => {
    it("should log secure event without sensitive data", () => {
      const consoleSpy = vi.spyOn(console, "log");

      logSecureEvent("test_event", "user123", "192.168.1.1", {
        action: "login",
        renda: 5000, // Should be filtered
        timestamp: Date.now(),
      });

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0] as string);

      expect(loggedData.event).toBe("test_event");
      expect(loggedData.userId).toBe("user123");
      expect(loggedData.ipAddress).toBe("192.168.1.1");
      expect(loggedData.action).toBe("login");
      expect(loggedData.renda).toBeUndefined(); // Should be filtered
      expect(loggedData.timestamp).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("should filter all sensitive fields", () => {
      const consoleSpy = vi.spyOn(console, "log");

      logSecureEvent("test_event", undefined, undefined, {
        safe: "value",
        rendaFixa: 3000,
        rendaVariavel: 500,
        dividaTotal: 5000,
        parcelasMensais: 300,
        gastosFixos: 2000,
        gastosVariaveis: 800,
        valorPoupado: 1500,
        valorInvestido: 0,
        senha: "secret",
        password: "pass123",
        token: "abc123",
        apiKey: "key123",
        creditCard: "1234",
      });

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0] as string);

      expect(loggedData.safe).toBe("value");
      expect(loggedData.rendaFixa).toBeUndefined();
      expect(loggedData.rendaVariavel).toBeUndefined();
      expect(loggedData.dividaTotal).toBeUndefined();
      expect(loggedData.parcelasMensais).toBeUndefined();
      expect(loggedData.gastosFixos).toBeUndefined();
      expect(loggedData.gastosVariaveis).toBeUndefined();
      expect(loggedData.valorPoupado).toBeUndefined();
      expect(loggedData.valorInvestido).toBeUndefined();
      expect(loggedData.senha).toBeUndefined();
      expect(loggedData.password).toBeUndefined();
      expect(loggedData.token).toBeUndefined();
      expect(loggedData.apiKey).toBeUndefined();
      expect(loggedData.creditCard).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it("should handle missing optional fields", () => {
      const consoleSpy = vi.spyOn(console, "log");

      logSecureEvent("test_event");

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0] as string);

      expect(loggedData.event).toBe("test_event");
      expect(loggedData.userId).toBeUndefined();
      expect(loggedData.ipAddress).toBeUndefined();
      expect(loggedData.timestamp).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("should handle case-insensitive field filtering", () => {
      const consoleSpy = vi.spyOn(console, "log");

      logSecureEvent("test_event", undefined, undefined, {
        RENDA: 5000, // Different case
        Token: "abc123",
      });

      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0] as string);

      expect(loggedData.RENDA).toBeUndefined();
      expect(loggedData.Token).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });
});
