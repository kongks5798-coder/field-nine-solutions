import { describe, it, expect } from "vitest";
import * as fs from "fs";

describe("middleware config", () => {
  it("middleware.ts exists and exports config", () => {
    const content = fs.readFileSync("src/middleware.ts", "utf-8");
    expect(content).toContain("export const config");
    expect(content).toContain("matcher");
  });

  it("middleware exports a default or named middleware function", () => {
    const content = fs.readFileSync("src/middleware.ts", "utf-8");
    expect(content).toMatch(/export (default |async )?function middleware/);
  });

  it("matcher includes protected routes", () => {
    const content = fs.readFileSync("src/middleware.ts", "utf-8");
    expect(content).toContain("/workspace");
    expect(content).toContain("/admin");
  });

  it("matcher includes API routes for rate limiting", () => {
    const content = fs.readFileSync("src/middleware.ts", "utf-8");
    expect(content).toContain("/api/");
  });

  it("imports Supabase for auth checks", () => {
    const content = fs.readFileSync("src/middleware.ts", "utf-8");
    expect(content).toContain("supabase");
  });
});
