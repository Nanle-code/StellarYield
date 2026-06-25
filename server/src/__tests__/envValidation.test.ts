import { validateServerEnv, assertValidServerEnv } from "../config/env";

describe("validateServerEnv", () => {
  it("warns for missing local development values without failing startup", () => {
    const result = validateServerEnv({ NODE_ENV: "development" });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("DATABASE_URL"),
        expect.stringContaining("MONGODB_URI"),
        expect.stringContaining("RELAYER_SECRET_KEY"),
      ]),
    );
  });

  it("requires production values that protect routes and jobs", () => {
    const result = validateServerEnv({ NODE_ENV: "production" });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("DATABASE_URL"),
        expect.stringContaining("MONGODB_URI"),
        expect.stringContaining("METRICS_TOKEN"),
        expect.stringContaining("RELAYER_SECRET_KEY"),
      ]),
    );
  });

  it("requires zap router simulation settings to be configured together", () => {
    const result = validateServerEnv({
      NODE_ENV: "development",
      DEX_ROUTER_CONTRACT_ID: "CROUTER",
    });

    expect(result.errors).toContain(
      "DEX_ROUTER_CONTRACT_ID and ZAP_QUOTE_SIM_SOURCE_ACCOUNT must be configured together.",
    );
  });

  // ── Placeholder relayer key detection ─────────────────────────────────

  it("warns in development when RELAYER_SECRET_KEY is the placeholder value", () => {
    const result = validateServerEnv({
      NODE_ENV: "development",
      RELAYER_SECRET_KEY: "SAH2...",
    });

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("RELAYER_SECRET_KEY"),
      ]),
    );
  });

  it("errors in production when RELAYER_SECRET_KEY is the placeholder value", () => {
    const result = validateServerEnv({
      NODE_ENV: "production",
      DATABASE_URL: "postgres://db",
      MONGODB_URI: "mongodb://mongo",
      METRICS_TOKEN: "tok",
      RELAYER_SECRET_KEY: "SAH2...",
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("RELAYER_SECRET_KEY"),
      ]),
    );
  });

  it("accepts a non-placeholder RELAYER_SECRET_KEY without error or warning", () => {
    const result = validateServerEnv({
      NODE_ENV: "development",
      RELAYER_SECRET_KEY: "SREAL_SECRET_KEY_VALUE",
    });

    const relayerMessages = [...result.errors, ...result.warnings].filter((m) =>
      m.includes("RELAYER_SECRET_KEY"),
    );
    expect(relayerMessages).toHaveLength(0);
  });

  // ── Missing database messaging ─────────────────────────────────────────

  it("warning message for missing DATABASE_URL references Prisma and postgres", () => {
    const result = validateServerEnv({ NODE_ENV: "development" });
    const dbWarning = result.warnings.find((w) => w.includes("DATABASE_URL"));
    expect(dbWarning).toBeDefined();
    expect(dbWarning).toMatch(/Prisma/i);
  });

  it("warning message for missing MONGODB_URI references database-backed routes", () => {
    const result = validateServerEnv({ NODE_ENV: "development" });
    const mongoWarning = result.warnings.find((w) => w.includes("MONGODB_URI"));
    expect(mongoWarning).toBeDefined();
    expect(mongoWarning).toMatch(/database/i);
  });

  it("missing DATABASE_URL becomes an error in production", () => {
    const result = validateServerEnv({ NODE_ENV: "production" });
    expect(result.errors.some((e) => e.includes("DATABASE_URL"))).toBe(true);
  });

  it("missing MONGODB_URI becomes an error in production", () => {
    const result = validateServerEnv({ NODE_ENV: "production" });
    expect(result.errors.some((e) => e.includes("MONGODB_URI"))).toBe(true);
  });

  // ── Production-only METRICS_TOKEN ─────────────────────────────────────

  it("does not require METRICS_TOKEN outside of production", () => {
    const result = validateServerEnv({ NODE_ENV: "development" });
    expect(result.errors.some((e) => e.includes("METRICS_TOKEN"))).toBe(false);
  });

  it("requires METRICS_TOKEN in production to protect /api/metrics", () => {
    const result = validateServerEnv({ NODE_ENV: "production" });
    const metricsError = result.errors.find((e) => e.includes("METRICS_TOKEN"));
    expect(metricsError).toBeDefined();
    expect(metricsError).toMatch(/production/i);
  });

  // ── PORT validation ───────────────────────────────────────────────────

  it("errors when PORT is not numeric", () => {
    const result = validateServerEnv({ NODE_ENV: "development", PORT: "abc" });
    expect(result.errors).toContain("PORT must be a number when provided.");
  });

  it("accepts a numeric PORT without errors", () => {
    const result = validateServerEnv({ NODE_ENV: "development", PORT: "3000" });
    expect(result.errors.some((e) => e.includes("PORT"))).toBe(false);
  });

  // ── Supplementary URL warnings ────────────────────────────────────────

  it("warns when SOROBAN_RPC_URL is absent", () => {
    const result = validateServerEnv({ NODE_ENV: "development" });
    expect(result.warnings.some((w) => w.includes("SOROBAN_RPC_URL"))).toBe(true);
  });

  it("warns when STELLAR_HORIZON_URL is absent", () => {
    const result = validateServerEnv({ NODE_ENV: "development" });
    expect(result.warnings.some((w) => w.includes("STELLAR_HORIZON_URL"))).toBe(true);
  });
});

// ── assertValidServerEnv ──────────────────────────────────────────────────

describe("assertValidServerEnv", () => {
  it("throws with all error messages when environment is invalid in production", () => {
    expect(() => assertValidServerEnv({ NODE_ENV: "production" })).toThrow(
      /Invalid server environment/,
    );
  });

  it("returns the validation result when environment is valid for development", () => {
    const result = assertValidServerEnv({ NODE_ENV: "development" });
    expect(result.errors).toHaveLength(0);
  });
});
