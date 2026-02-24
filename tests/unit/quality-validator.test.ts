import { describe, it, expect } from "vitest";
import {
  validateCommercialQuality,
  buildQualityFixPrompt,
} from "../../src/app/workspace/ai/qualityValidator";

describe("validateCommercialQuality", () => {
  const minFiles = {
    "index.html": "<!DOCTYPE html><html><head></head><body><header><nav></nav></header><main></main></body></html>",
    "style.css": "@media (max-width: 768px) { body { padding: 0; } }\n" + "a { color: red; }\n".repeat(100),
    "script.js": "document.addEventListener('DOMContentLoaded', function() {\n" + "const el = document.getElementById('x');\n".repeat(100) + "});",
  };

  describe("file completeness", () => {
    it("passes with all 3 files present", () => {
      const report = validateCommercialQuality(minFiles, null);
      expect(report.issues.filter(i => i.category === "completeness")).toHaveLength(0);
    });

    it("errors when index.html is missing", () => {
      const files = { "style.css": "a{}", "script.js": "console.log(1)" };
      const report = validateCommercialQuality(files, null);
      expect(report.issues.some(i => i.severity === "error" && i.file === "index.html")).toBe(true);
    });

    it("errors when style.css is missing", () => {
      const files = { "index.html": "<html></html>", "script.js": "x" };
      const report = validateCommercialQuality(files, null);
      expect(report.issues.some(i => i.severity === "error" && i.file === "style.css")).toBe(true);
    });

    it("errors when script.js is missing", () => {
      const files = { "index.html": "<html></html>", "style.css": "a{}" };
      const report = validateCommercialQuality(files, null);
      expect(report.issues.some(i => i.severity === "error" && i.file === "script.js")).toBe(true);
    });
  });

  describe("platform-specific size checks", () => {
    it("warns for short files when platformType is set", () => {
      const shortFiles = {
        "index.html": "<html><body><header></header></body></html>",
        "style.css": "body { color: red; }",
        "script.js": "console.log('hi');",
      };
      const report = validateCommercialQuality(shortFiles, "ecommerce");
      const sizeWarnings = report.issues.filter(i => i.category === "size");
      expect(sizeWarnings.length).toBeGreaterThanOrEqual(2);
    });

    it("does not warn about size for non-platform apps", () => {
      const shortFiles = {
        "index.html": "<html><head></head><body><nav></nav></body></html>\n".repeat(60),
        "style.css": "a { color: red; }\n".repeat(50),
        "script.js": "const x = 1;\n".repeat(40),
      };
      const report = validateCommercialQuality(shortFiles, null);
      const sizeWarnings = report.issues.filter(i => i.category === "size");
      expect(sizeWarnings.length).toBe(0);
    });
  });

  describe("responsive design", () => {
    it("warns when no @media queries in CSS", () => {
      const files = {
        ...minFiles,
        "style.css": "body { color: red; }\n".repeat(100),
      };
      const report = validateCommercialQuality(files, null);
      expect(report.issues.some(i => i.category === "responsive")).toBe(true);
    });

    it("passes when @media queries exist", () => {
      const report = validateCommercialQuality(minFiles, null);
      expect(report.issues.filter(i => i.category === "responsive")).toHaveLength(0);
    });
  });

  describe("JS brace balance", () => {
    it("errors on mismatched braces", () => {
      const files = {
        ...minFiles,
        "script.js": "function test() {\n  if (true) {\n    console.log('oops');\n",
      };
      const report = validateCommercialQuality(files, null);
      expect(report.issues.some(i => i.category === "syntax" && i.file === "script.js")).toBe(true);
    });

    it("passes on balanced braces", () => {
      const report = validateCommercialQuality(minFiles, null);
      expect(report.issues.filter(i => i.category === "syntax")).toHaveLength(0);
    });
  });

  describe("DOMContentLoaded", () => {
    it("warns when no DOMContentLoaded wrapper", () => {
      const files = {
        ...minFiles,
        "script.js": "const x = document.getElementById('y');\n".repeat(50),
      };
      const report = validateCommercialQuality(files, null);
      expect(report.issues.some(i => i.category === "runtime")).toBe(true);
    });
  });

  describe("HTML closing tag", () => {
    it("errors when </html> is missing (truncation)", () => {
      const files = {
        ...minFiles,
        "index.html": "<!DOCTYPE html><html><head></head><body><header><nav>",
      };
      const report = validateCommercialQuality(files, null);
      expect(report.issues.some(i => i.severity === "error" && i.message.includes("</html>"))).toBe(true);
    });
  });

  describe("scoring", () => {
    it("returns high score for well-formed files", () => {
      const report = validateCommercialQuality(minFiles, null);
      expect(report.score).toBeGreaterThanOrEqual(90);
      expect(report.passed).toBe(true);
    });

    it("returns low score for many issues", () => {
      const badFiles = {
        "index.html": "<div>no html close",
        "style.css": "",
        "script.js": "function() {",
      };
      const report = validateCommercialQuality(badFiles, "ecommerce");
      expect(report.score).toBeLessThan(70);
      expect(report.passed).toBe(false);
    });

    it("deducts 20 per error, 5 per warning", () => {
      // Only script.js missing = 1 error = score 80
      const files = {
        "index.html": "<html><head></head><body><nav></nav></body></html>\n".repeat(20),
        "style.css": "@media (min-width: 768px) { body {} }\n" + "a{}\n".repeat(100),
      };
      const report = validateCommercialQuality(files, null);
      const errors = report.issues.filter(i => i.severity === "error").length;
      const warnings = report.issues.filter(i => i.severity === "warning").length;
      expect(report.score).toBe(Math.max(0, 100 - errors * 20 - warnings * 5));
    });
  });
});

describe("buildQualityFixPrompt", () => {
  it("returns empty string when no errors", () => {
    const report = { score: 100, issues: [], passed: true };
    expect(buildQualityFixPrompt(report)).toBe("");
  });

  it("builds fix prompt for error issues", () => {
    const report = {
      score: 40,
      issues: [
        { severity: "error" as const, category: "syntax", message: "Mismatched braces", file: "script.js" },
        { severity: "warning" as const, category: "responsive", message: "No @media", file: "style.css" },
      ],
      passed: false,
    };
    const prompt = buildQualityFixPrompt(report);
    expect(prompt).toContain("Mismatched braces");
    expect(prompt).not.toContain("No @media"); // Only errors, not warnings
  });
});
