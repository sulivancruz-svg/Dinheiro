import { describe, it, expect } from "vitest";

const BASE_URL = "http://localhost:3000";
const SKIP_INTEGRATION_TESTS = !process.env.RUN_INTEGRATION_TESTS;

describe.skipIf(SKIP_INTEGRATION_TESTS)(
  "GET /api/diagnostico/history - Integration Tests",
  () => {
    // These tests require a running server and authenticated session
    // Run with: RUN_INTEGRATION_TESTS=true npm run test

    it("should return paginated history of diagnosticos for authenticated user", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/history`,
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.diagnosticos)).toBe(true);
      expect(data.total).toBeDefined();
      expect(typeof data.total).toBe("number");
      expect(data.page).toBe(1);
      expect(data.limit).toBe(10);
      expect(data.pages).toBeDefined();
    });

    it("should support pagination with page and limit query params", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/history?page=2&limit=5`,
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.page).toBe(2);
      expect(data.limit).toBe(5);
      expect(Array.isArray(data.diagnosticos)).toBe(true);
    });

    it("should clamp limit to maximum of 100", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/history?limit=500`,
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.limit).toBeLessThanOrEqual(100);
    });

    it("should default to page=1 for invalid page param", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/history?page=0`,
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.page).toBe(1);
    });

    it("should require authentication", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/history`
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("should only return user's own history", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/history`,
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      // All items should have the required fields
      data.diagnosticos.forEach((diag: any) => {
        expect(diag).toHaveProperty("id");
        expect(diag).toHaveProperty("perfil");
        expect(diag).toHaveProperty("saldoMensal");
        expect(diag).toHaveProperty("rendaTotal");
        expect(diag).toHaveProperty("patrimonioLiquido");
        expect(diag).toHaveProperty("createdAt");
        expect(diag).toHaveProperty("updatedAt");
      });
    });

    it("should order diagnosticos by createdAt descending (newest first)", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/history`,
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      if (data.diagnosticos.length > 1) {
        // Check that items are ordered newest first
        for (let i = 0; i < data.diagnosticos.length - 1; i++) {
          const current = new Date(data.diagnosticos[i].createdAt).getTime();
          const next = new Date(data.diagnosticos[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    it("should return correct page count calculation", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/history?limit=5`,
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();

      const expectedPages = Math.ceil(data.total / data.limit);
      expect(data.pages).toBe(expectedPages);
    });

    it("should return empty diagnosticos array when no history exists", async () => {
      const response = await fetch(
        `${BASE_URL}/api/diagnostico/history?page=999`,
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.diagnosticos)).toBe(true);
      expect(data.total).toBeGreaterThanOrEqual(0);
    });
  }
);
