import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { clearRateLimits } from "@/lib/security/rateLimiting";
import { getServerSession } from "next-auth";

// Mock getServerSession
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

const BASE_URL = "http://localhost:3000";
const SKIP_INTEGRATION_TESTS = !process.env.RUN_INTEGRATION_TESTS;

// Test helpers
let testUserId: string;
let testConsentId: string;
const testUserEmail = `test-consent-${Date.now()}@example.com`;

describe.skipIf(SKIP_INTEGRATION_TESTS)("Consent API - Integration Tests", () => {
  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        name: "Test User Consent",
        email: testUserEmail,
        emailVerified: new Date(),
      },
    });
    testUserId = user.id;
  });

  beforeEach(() => {
    // Set up mock session for authenticated requests
    const mockSession = {
      user: {
        id: testUserId,
        email: testUserEmail,
        name: "Test User Consent",
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      // Delete all consents for this user
      await prisma.consentimento.deleteMany({
        where: { userId: testUserId },
      });
      // Delete the test user
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
    clearRateLimits();
  });

  describe("POST /api/consent - Create/Update Consent", () => {
    it("should reject requests without authentication", async () => {
      const response = await fetch(`${BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "WHATSAPP",
          aceito: true,
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("should reject invalid input - missing tipo", async () => {
      const response = await fetch(`${BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aceito: true,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(Array.isArray(data.details)).toBe(true);
    });

    it("should reject invalid input - missing aceito", async () => {
      const response = await fetch(`${BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "WHATSAPP",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(Array.isArray(data.details)).toBe(true);
    });

    it("should reject invalid input - invalid tipo value", async () => {
      const response = await fetch(`${BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "INVALID_TYPE",
          aceito: true,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(Array.isArray(data.details)).toBe(true);
    });

    it("should reject invalid input - aceito not boolean", async () => {
      const response = await fetch(`${BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "WHATSAPP",
          aceito: "yes",
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(Array.isArray(data.details)).toBe(true);
    });

    it("should return 400 for invalid JSON", async () => {
      const response = await fetch(`${BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json {",
      });

      expect(response.status).toBe(400);
    });

    it("should enforce rate limiting - 100 req/min per user", async () => {
      // This test verifies rate limiting by checking if the 101st request is blocked
      // We use the testUserId to simulate multiple requests from the same user
      const responses: number[] = [];

      // Make 101 requests rapidly (use a simple body for speed)
      for (let i = 0; i < 101; i++) {
        const response = await fetch(`${BASE_URL}/api/consent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tipo: i % 2 === 0 ? "WHATSAPP" : "EMAIL_MARKETING",
            aceito: i % 3 === 0,
          }),
        });
        responses.push(response.status);
      }

      // First 100 requests should succeed (200 or 201, or maybe 400 for validation but not 429)
      const successCount = responses.filter(s => s !== 429).length;
      expect(successCount).toBeGreaterThanOrEqual(100);

      // The 101st request should be rate limited (429)
      // At least one of the last few requests should hit rate limit
      const lastRequest = responses[responses.length - 1];
      expect(lastRequest).toBe(429);
    });

    it("should create new consent successfully", async () => {
      const response = await fetch(`${BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "WHATSAPP",
          aceito: true,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("userId");
      expect(data).toHaveProperty("tipo");
      expect(data).toHaveProperty("aceito");
      expect(data).toHaveProperty("origin");
      expect(data).toHaveProperty("updatedAt");

      // Verify values
      expect(data.userId).toBe(testUserId);
      expect(data.tipo).toBe("WHATSAPP");
      expect(data.aceito).toBe(true);
      expect(data.origin).toBe("api");

      testConsentId = data.id;
    });

    it("should update existing consent successfully", async () => {
      // First create a consent
      let createResponse = await fetch(`${BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "EMAIL_MARKETING",
          aceito: true,
        }),
      });

      expect(createResponse.status).toBe(200);
      let data = await createResponse.json();
      const consentId = data.id;

      // Now update it
      const updateResponse = await fetch(`${BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo: "EMAIL_MARKETING",
          aceito: false, // Changed from true to false
        }),
      });

      expect(updateResponse.status).toBe(200);
      data = await updateResponse.json();

      // Verify it's the same record (same ID) but with updated value
      expect(data.id).toBe(consentId);
      expect(data.aceito).toBe(false);
      expect(data.updatedAt).toBeDefined();
    });
  });

  describe("GET /api/consent/[id] - Fetch Consent by ID", () => {
    it("should reject requests without authentication", async () => {
      const response = await fetch(`${BASE_URL}/api/consent/some-id`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("should return 404 for non-existent consent", async () => {
      const response = await fetch(
        `${BASE_URL}/api/consent/nonexistent-id-12345`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain("not found");
    });

    it("should return 403 for consent belonging to different user", async () => {
      // Create a different user and consent for them
      const otherUser = await prisma.user.create({
        data: {
          name: "Other User",
          email: `other-user-${Date.now()}@example.com`,
          emailVerified: new Date(),
        },
      });

      const otherConsent = await prisma.consentimento.create({
        data: {
          userId: otherUser.id,
          tipo: "WHATSAPP",
          aceito: true,
          origin: "api",
        },
      });

      try {
        // Try to fetch with testUser's session
        const response = await fetch(`${BASE_URL}/api/consent/${otherConsent.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toContain("Unauthorized");
      } finally {
        // Clean up
        await prisma.consentimento.delete({
          where: { id: otherConsent.id },
        });
        await prisma.user.delete({
          where: { id: otherUser.id },
        });
      }
    });

    it("should fetch consent successfully for authenticated user", async () => {
      const response = await fetch(`${BASE_URL}/api/consent/${testConsentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("userId");
      expect(data).toHaveProperty("tipo");
      expect(data).toHaveProperty("aceito");
      expect(data).toHaveProperty("origin");
      expect(data).toHaveProperty("updatedAt");

      // Verify values
      expect(data.id).toBe(testConsentId);
      expect(data.userId).toBe(testUserId);
    });
  });
});
