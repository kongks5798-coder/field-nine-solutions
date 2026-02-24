import { describe, it, expect } from "vitest";
import * as fs from "fs";

describe("security headers config", () => {
  const config = fs.readFileSync("next.config.ts", "utf-8");

  it("includes X-Frame-Options DENY", () => {
    expect(config).toContain("X-Frame-Options");
    expect(config).toContain("DENY");
  });

  it("includes Content-Security-Policy", () => {
    expect(config).toContain("Content-Security-Policy");
  });

  it("includes Strict-Transport-Security with preload", () => {
    expect(config).toContain("Strict-Transport-Security");
    expect(config).toContain("preload");
  });

  it("disables poweredByHeader", () => {
    expect(config).toContain("poweredByHeader: false");
  });

  it("CSP allows required external domains", () => {
    expect(config).toContain("supabase.co");
    expect(config).toContain("tosspayments.com");
    expect(config).toContain("api.openai.com");
    expect(config).toContain("api.anthropic.com");
    expect(config).toContain("api.x.ai");
  });

  it("includes Referrer-Policy and Permissions-Policy", () => {
    expect(config).toContain("Referrer-Policy");
    expect(config).toContain("Permissions-Policy");
  });
});
