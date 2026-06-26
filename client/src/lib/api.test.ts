import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, getApiBaseUrl, isApiConfigured, getApiBaseUrlOrNull } from "./api";

describe("api URL helpers", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  const env = (values: Record<string, string>): ImportMetaEnv =>
    ({
      BASE_URL: "/",
      MODE: "test",
      DEV: false,
      PROD: false,
      SSR: false,
      ...values,
    }) as ImportMetaEnv;

  describe("isApiConfigured", () => {
    it("returns true when VITE_API_BASE_URL is set", () => {
      expect(
        isApiConfigured(env({
          VITE_API_BASE_URL: "https://api.example.com",
        })),
      ).toBe(true);
    });

    it("returns true when VITE_API_URL is set", () => {
      expect(
        isApiConfigured(env({
          VITE_API_URL: "https://api.example.com",
        })),
      ).toBe(true);
    });

    it("returns true when on localhost (even without env vars)", () => {
      global.window = { location: { hostname: 'localhost' } } as any;
      expect(isApiConfigured(env({}))).toBe(true);
    });

    it("returns true when on 127.0.0.1 (even without env vars)", () => {
      global.window = { location: { hostname: '127.0.0.1' } } as any;
      expect(isApiConfigured(env({}))).toBe(true);
    });

    it("returns false when not configured and on preview environment", () => {
      global.window = { location: { hostname: 'stellar-yield-preview.vercel.app' } } as any;
      expect(isApiConfigured(env({}))).toBe(false);
    });
  });

  describe("getApiBaseUrl", () => {
    it("uses the local backend by default when on localhost", () => {
      global.window = { location: { hostname: 'localhost' } } as any;
      expect(getApiBaseUrl(env({}))).toBe("http://localhost:3001");
    });

    it("prefers VITE_API_BASE_URL and trims trailing slashes", () => {
      expect(
        getApiBaseUrl(env({
          VITE_API_BASE_URL: "https://api.example.com///",
          VITE_API_URL: "https://ignored.example.com",
        })),
      ).toBe("https://api.example.com");
    });

    it("falls back to VITE_API_URL", () => {
      expect(
        getApiBaseUrl(env({
          VITE_API_URL: "https://staging.example.com/",
        })),
      ).toBe("https://staging.example.com");
    });

    it("builds normalized API paths", () => {
      const configuredEnv = env({ VITE_API_BASE_URL: "https://api.example.com/" });
      expect(apiUrl("api/yields", configuredEnv)).toBe("https://api.example.com/api/yields");
      expect(apiUrl("/api/yields", configuredEnv)).toBe("https://api.example.com/api/yields");
    });

    it("throws error if no env vars set and hostname is not localhost (preview env)", () => {
      global.window = { location: { hostname: 'stellar-yield-preview.vercel.app' } } as any;
      expect(() => getApiBaseUrl(env({}))).toThrow('API_UNAVAILABLE: Backend URL not configured for preview environment. Please set VITE_API_BASE_URL.');
    });

    it("trims whitespace from configured URLs", () => {
      expect(
        getApiBaseUrl(env({
          VITE_API_BASE_URL: "  https://api.example.com  ",
        })),
      ).toBe("https://api.example.com");
    });

    it("handles URLs with multiple trailing slashes", () => {
      expect(
        getApiBaseUrl(env({
          VITE_API_BASE_URL: "https://api.example.com/////",
        })),
      ).toBe("https://api.example.com");
    });
  });

  describe("getApiBaseUrlOrNull", () => {
    it("returns the API URL when configured", () => {
      expect(
        getApiBaseUrlOrNull(env({
          VITE_API_BASE_URL: "https://api.example.com",
        })),
      ).toBe("https://api.example.com");
    });

    it("returns null instead of throwing when not configured on preview", () => {
      global.window = { location: { hostname: 'stellar-yield-preview.vercel.app' } } as any;
      expect(getApiBaseUrlOrNull(env({}))).toBeNull();
    });

    it("returns localhost default when on localhost", () => {
      global.window = { location: { hostname: 'localhost' } } as any;
      expect(getApiBaseUrlOrNull(env({}))).toBe("http://localhost:3001");
    });
  });

  describe("apiUrl", () => {
    it("appends path without leading slash", () => {
      const configuredEnv = env({ VITE_API_BASE_URL: "https://api.example.com" });
      expect(apiUrl("yields", configuredEnv)).toBe("https://api.example.com/yields");
    });

    it("appends path with leading slash", () => {
      const configuredEnv = env({ VITE_API_BASE_URL: "https://api.example.com" });
      expect(apiUrl("/yields", configuredEnv)).toBe("https://api.example.com/yields");
    });

    it("preserves nested paths", () => {
      const configuredEnv = env({ VITE_API_BASE_URL: "https://api.example.com" });
      expect(apiUrl("api/v1/yields", configuredEnv)).toBe("https://api.example.com/api/v1/yields");
    });
  });
});
