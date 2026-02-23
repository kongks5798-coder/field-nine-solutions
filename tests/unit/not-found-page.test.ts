import { describe, it, expect } from "vitest";
import * as fs from "fs";

describe("not-found page", () => {
  const content = fs.readFileSync("src/app/not-found.tsx", "utf-8");

  it("contains 404 text", () => {
    expect(content).toContain("404");
  });

  it("has Korean error message", () => {
    expect(content).toContain("\ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4");
  });

  it("has link back to home", () => {
    expect(content).toMatch(/href.*\//);
  });

  it("exports metadata", () => {
    expect(content).toContain("metadata");
  });

  it("is a Server Component (no 'use client')", () => {
    expect(content).not.toMatch(/^["']use client["']/);
  });

  it("uses dark background #07080f", () => {
    expect(content).toContain("#07080f");
  });

  it("uses accent gradient", () => {
    expect(content).toContain("#f97316");
  });

  it("has workspace link as secondary action", () => {
    expect(content).toContain("/workspace");
  });
});
