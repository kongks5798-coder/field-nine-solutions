// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const unsafeFn = vi.fn() as ReturnType<typeof vi.fn> & {
    unsafe: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  };
  unsafeFn.unsafe = vi.fn();
  unsafeFn.end = vi.fn();
  return {
    sql: unsafeFn,
    fetch: vi.fn(),
  };
});

vi.mock("postgres", () => {
  return {
    default: () => mocks.sql,
  };
});

import { runMigrations, type MigrationResult } from "@/lib/migrate";

beforeEach(() => {
  vi.clearAllMocks();
  // Reset env vars
  delete process.env.SUPABASE_DATABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  global.fetch = mocks.fetch as unknown as typeof fetch;
});

describe("lib/migrate", () => {
  describe("runMigrations()", () => {
    it("returns skip for all migrations when SUPABASE_DATABASE_URL is not set", async () => {
      const results = await runMigrations();
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.status).toBe("skip");
        expect(r.message).toContain("SUPABASE_DATABASE_URL");
      }
    });

    it("returns results with correct structure", async () => {
      const results = await runMigrations();
      for (const r of results) {
        expect(r).toHaveProperty("id");
        expect(r).toHaveProperty("label");
        expect(r).toHaveProperty("status");
        expect(["ok", "skip", "error"]).toContain(r.status);
      }
    });

    it("includes all expected migration IDs", async () => {
      const results = await runMigrations();
      const ids = results.map((r) => r.id);
      expect(ids).toContain("097");
      expect(ids).toContain("098");
      expect(ids).toContain("099");
      expect(ids).toContain("099a");
      expect(ids).toContain("100a");
      expect(ids).toContain("100b");
    });

    it("runs SQL when SUPABASE_DATABASE_URL is set", async () => {
      process.env.SUPABASE_DATABASE_URL = "postgres://localhost:5432/test";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

      // Mock fetch for checkMigrationNeeded - all need migration
      mocks.fetch.mockResolvedValue({ status: 404 });
      mocks.sql.mockResolvedValue([]);
      mocks.sql.unsafe.mockResolvedValue([]);
      mocks.sql.end.mockResolvedValue(undefined);

      const results = await runMigrations();
      expect(results.length).toBeGreaterThan(0);
      // At least some should be "ok"
      const okResults = results.filter((r) => r.status === "ok");
      expect(okResults.length).toBeGreaterThan(0);
      expect(mocks.sql.end).toHaveBeenCalled();
    });

    it("handles SQL errors gracefully", async () => {
      process.env.SUPABASE_DATABASE_URL = "postgres://localhost:5432/test";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

      mocks.fetch.mockResolvedValue({ status: 404 });
      mocks.sql.mockRejectedValue(new Error("SQL syntax error"));
      mocks.sql.unsafe.mockRejectedValue(new Error("SQL syntax error"));
      mocks.sql.end.mockResolvedValue(undefined);

      const results = await runMigrations();
      const errorResults = results.filter((r) => r.status === "error");
      expect(errorResults.length).toBeGreaterThan(0);
      expect(errorResults[0].message).toContain("SQL syntax error");
    });
  });

  describe("MigrationResult type", () => {
    it("has correct structure", () => {
      const result: MigrationResult = {
        id: "097",
        label: "test",
        status: "ok",
      };
      expect(result.id).toBe("097");
      expect(result.label).toBe("test");
      expect(result.status).toBe("ok");
    });

    it("accepts optional message field", () => {
      const result: MigrationResult = {
        id: "097",
        label: "test",
        status: "error",
        message: "Something went wrong",
      };
      expect(result.message).toBe("Something went wrong");
    });
  });
});
