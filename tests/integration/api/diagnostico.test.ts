import { describe, it, expect } from "vitest";

const BASE_URL = "http://localhost:3000";
const SKIP_INTEGRATION_TESTS = !process.env.RUN_INTEGRATION_TESTS;

describe.skipIf(SKIP_INTEGRATION_TESTS)(
  "POST /api/diagnostico - Integration Tests",
  () => {
    // These tests require a running server and authenticated session
    // Run with: RUN_INTEGRATION_TESTS=true npm run test

    it("should reject requests without authentication", async () => {
      const response = await fetch(`${BASE_URL}/api/diagnostico`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rendaFixa: 2000,
          rendaVariavel: 500,
          gastosFixos: 1800,
          gastosVariaveis: 400,
          parcelasMensais: 200,
          valorPoupado: 500,
          valorInvestido: 1000,
          dividaTotal: 5000,
        }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("should reject invalid data (negative values)", async () => {
      const response = await fetch(`${BASE_URL}/api/diagnostico`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          rendaFixa: -100, // Invalid: negative
          rendaVariavel: 0,
          gastosFixos: 0,
          gastosVariaveis: 0,
          parcelasMensais: 0,
          valorPoupado: 0,
          valorInvestido: 0,
          dividaTotal: 0,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
      expect(Array.isArray(data.details)).toBe(true);
    });

    it("should reject incomplete data", async () => {
      const response = await fetch(`${BASE_URL}/api/diagnostico`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({
          rendaFixa: 2000,
          // Missing other required fields
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 for invalid JSON", async () => {
      const response = await fetch(`${BASE_URL}/api/diagnostico`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: "invalid json {",
      });

      expect(response.status).toBe(400);
    });

  // Note: The following test requires a valid authenticated session
  // and would need proper test fixtures to run
  it.skip("should create diagnóstico and return profile classification", async () => {
    const requestBody = {
      rendaFixa: 2000,
      rendaVariavel: 500,
      gastosFixos: 1800,
      gastosVariaveis: 400,
      parcelasMensais: 200,
      valorPoupado: 500,
      valorInvestido: 1000,
      dividaTotal: 5000,
    };

    const response = await fetch(`${BASE_URL}/api/diagnostico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    expect(response.status).toBe(200);
    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("perfil");
    expect(data).toHaveProperty("saldoMensal");
    expect(data).toHaveProperty("rendaTotal");
    expect(data).toHaveProperty("gastosTotais");
    expect(data).toHaveProperty("percentualComprometido");
    expect(data).toHaveProperty("patrimonioLiquido");
    expect(data).toHaveProperty("caixinhas");

    // Verify values
    expect(data.saldoMensal).toBeGreaterThan(0);
    expect(data.rendaTotal).toBe(2500); // 2000 + 500
    expect(data.gastosTotais).toBe(2200); // 1800 + 400
    expect(typeof data.perfil).toBe("string");
    expect(typeof data.caixinhas).toBe("object");
  });
});
