import { describe, it, expect } from "vitest";

const BASE_URL = "http://localhost:3000";
const SKIP_INTEGRATION_TESTS = !process.env.RUN_INTEGRATION_TESTS;

describe.skipIf(SKIP_INTEGRATION_TESTS)(
  "GET /api/diagnostico/[id] - Integration Tests",
  () => {
    // These tests require a running server and authenticated session
    // Run with: RUN_INTEGRATION_TESTS=true npm run test

    it("should require authentication", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/some-invalid-id`,
        {
          method: "GET",
        }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("should return 404 for non-existent diagnostico", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/invalid-id-that-does-not-exist`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it("should return 403 for unauthorized access to other user's diagnostico", async () => {
      // This assumes there's a diagnostico owned by a different user
      // In practice, this would be set up in test fixtures
      const otherUsersId = "other-user-id";
      const response = await fetch(`${BASE_URL}/api/diagnostico/${otherUsersId}`, {
        method: "GET",
        headers: {
          Authorization: "Bearer different-user-token",
        },
      });

      // Either 403 (if diagnostico exists and belongs to another user)
      // or 404 (if the ID doesn't exist)
      expect([403, 404]).toContain(response.status);
    });

    // Note: The following tests require proper test fixtures and authenticated sessions
    it.skip("should fetch diagnostico by id for authenticated user", async () => {
      // This test would require:
      // 1. Creating a diagnostico via POST first
      // 2. Getting an authenticated session token
      // 3. Then fetching that diagnostico by ID

      const diagnosticoId = "test-id-123";
      const authToken = "valid-test-token";

      const response = await fetch(`${BASE_URL}/api/diagnostico/${diagnosticoId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(diagnosticoId);
      expect(data.userId).toBeDefined();
      expect(data.rendaFixa).toBeDefined();
      expect(data.rendaVariavel).toBeDefined();
      expect(data.gastosFixos).toBeDefined();
      expect(data.gastosVariaveis).toBeDefined();
      expect(data.parcelasMensais).toBeDefined();
      expect(data.valorPoupado).toBeDefined();
      expect(data.valorInvestido).toBeDefined();
      expect(data.dividaTotal).toBeDefined();
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it.skip("should return complete diagnostico data", async () => {
      // Assumes a valid diagnostico exists
      const diagnosticoId = "valid-id";
      const authToken = "valid-test-token";

      const response = await fetch(`${BASE_URL}/api/diagnostico/${diagnosticoId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify all fields are present
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("userId");
      expect(data).toHaveProperty("rendaFixa");
      expect(data).toHaveProperty("rendaVariavel");
      expect(data).toHaveProperty("gastosFixos");
      expect(data).toHaveProperty("gastosVariaveis");
      expect(data).toHaveProperty("parcelasMensais");
      expect(data).toHaveProperty("valorPoupado");
      expect(data).toHaveProperty("valorInvestido");
      expect(data).toHaveProperty("dividaTotal");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");

      // Verify types
      expect(typeof data.id).toBe("string");
      expect(typeof data.userId).toBe("string");
      expect(typeof data.rendaFixa).toBe("number");
      expect(typeof data.createdAt).toBe("string");
    });
  }
);
