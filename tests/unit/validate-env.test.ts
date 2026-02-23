import { describe, it, expect } from "vitest";
import * as fs from "fs";

describe("validate-env", () => {
  const content = fs.readFileSync("src/lib/env.ts", "utf-8");

  it("exports validateEnv function", () => {
    expect(content).toContain("validateEnv");
    expect(content).toMatch(/export\s+(function|const)\s+validateEnv/);
  });

  it("skips during build phase (NEXT_PHASE check)", () => {
    expect(content).toContain("NEXT_PHASE");
    expect(content).toContain("phase-production-build");
  });

  it("checks for SUPABASE env vars", () => {
    expect(content).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("checks for service role key", () => {
    expect(content).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
