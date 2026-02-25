import { describe, it, expect } from "vitest";

describe("AI Modules", () => {
  describe("modelRegistry", () => {
    it("should export model metadata", async () => {
      const { getModelMeta, getBestModelForTask } = await import(
        "@/app/workspace/ai/modelRegistry"
      );
      const meta = getModelMeta("gpt-4o-mini");
      expect(meta).toBeDefined();
      expect(meta?.provider).toBe("openai");

      const best = getBestModelForTask("code");
      expect(best).toBeDefined();
    });

    it("should return undefined for unknown model", async () => {
      const { getModelMeta } = await import(
        "@/app/workspace/ai/modelRegistry"
      );
      const meta = getModelMeta("nonexistent-model-xyz");
      expect(meta).toBeUndefined();
    });

    it("should list models by provider", async () => {
      const { getProviderModels } = await import(
        "@/app/workspace/ai/modelRegistry"
      );
      const openaiModels = getProviderModels("openai");
      expect(openaiModels.length).toBeGreaterThan(0);
      expect(openaiModels.every((m) => m.provider === "openai")).toBe(true);
    });

    it("should return cheapest model for fast task", async () => {
      const { getBestModelForTask } = await import(
        "@/app/workspace/ai/modelRegistry"
      );
      const fast = getBestModelForTask("fast");
      expect(fast).toBeDefined();
      expect(fast.strengthTags).toContain("fast");
    });
  });

  describe("diffParser", () => {
    it("should parse FILE blocks from AI response", async () => {
      const { parseAiResponse } = await import(
        "@/app/workspace/ai/diffParser"
      );
      const input = `[FILE: index.html]
<!DOCTYPE html>
<html><body>Hello</body></html>
[/FILE]`;
      const result = parseAiResponse(input);
      expect(result).toBeDefined();
      expect(result.type).toBe("full-file");
      expect(result.fullFiles["index.html"]).toContain("<!DOCTYPE html>");
    });

    it("should parse EDIT blocks with search/replace", async () => {
      const { parseAiResponse } = await import(
        "@/app/workspace/ai/diffParser"
      );
      const input = `[EDIT: script.js]
<<<<<<< SEARCH
console.log("old");
=======
console.log("new");
>>>>>>> REPLACE
[/EDIT]`;
      const result = parseAiResponse(input);
      expect(result).toBeDefined();
      expect(result.type).toBe("diff");
      expect(result.diffs.length).toBe(1);
      expect(result.diffs[0].filename).toBe("script.js");
    });

    it("should return text-only for plain text", async () => {
      const { parseAiResponse } = await import(
        "@/app/workspace/ai/diffParser"
      );
      const result = parseAiResponse("This is just a plain message.");
      expect(result.type).toBe("text-only");
      expect(Object.keys(result.fullFiles).length).toBe(0);
    });
  });

  describe("contextManager", () => {
    it("should create budget and estimate tokens", async () => {
      const { createBudget, estimateTokens } = await import(
        "@/app/workspace/ai/contextManager"
      );
      const budget = createBudget(4096, 500, 1000);
      expect(budget).toBeDefined();
      expect(budget.maxTokens).toBe(4096);
      expect(budget.availableForHistory).toBe(4096 - 500 - 1000);

      const tokens = estimateTokens("Hello world");
      expect(tokens).toBeGreaterThan(0);
    });

    it("should return 0 tokens for empty string", async () => {
      const { estimateTokens } = await import(
        "@/app/workspace/ai/contextManager"
      );
      expect(estimateTokens("")).toBe(0);
    });

    it("should trim history to fit budget", async () => {
      const { createBudget, trimHistory } = await import(
        "@/app/workspace/ai/contextManager"
      );
      const budget = createBudget(100, 0, 0);
      const messages = [
        { role: "user", content: "A".repeat(200) },
        { role: "assistant", content: "B".repeat(200) },
        { role: "user", content: "Short" },
        { role: "assistant", content: "Reply" },
      ];
      const trimmed = trimHistory(messages, budget);
      // Should keep at least 2 most recent messages
      expect(trimmed.length).toBeGreaterThanOrEqual(2);
      expect(trimmed[trimmed.length - 1].content).toBe("Reply");
    });

    it("should build file context with active file priority", async () => {
      const { buildFileContext } = await import(
        "@/app/workspace/ai/contextManager"
      );
      const files = {
        "main.js": { content: "const x = 1;" },
        "utils.js": { content: "export function helper() {}" },
      };
      const context = buildFileContext(files, "main.js", 1000);
      expect(context).toContain("main.js");
      expect(context).toContain("const x = 1;");
    });
  });

  describe("qualityValidator", () => {
    it("should validate code quality", async () => {
      const { validateCommercialQuality } = await import(
        "@/app/workspace/ai/qualityValidator"
      );
      const result = validateCommercialQuality(
        { "index.html": "<html><body>test</body></html>" },
        null,
      );
      expect(result).toBeDefined();
      expect(typeof result.score).toBe("number");
      expect(Array.isArray(result.issues)).toBe(true);
      expect(typeof result.passed).toBe("boolean");
    });

    it("should report missing files", async () => {
      const { validateCommercialQuality } = await import(
        "@/app/workspace/ai/qualityValidator"
      );
      const result = validateCommercialQuality({}, null);
      const missingHtml = result.issues.find(
        (i) => i.message === "Missing index.html",
      );
      expect(missingHtml).toBeDefined();
    });

    it("should build fix prompt for quality issues", async () => {
      const { validateCommercialQuality, buildQualityFixPrompt } =
        await import("@/app/workspace/ai/qualityValidator");
      const report = validateCommercialQuality({}, null);
      const prompt = buildQualityFixPrompt(report);
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe("performanceProfiler", () => {
    it("should profile HTML files", async () => {
      const { profilePerformance } = await import(
        "@/app/workspace/ai/performanceProfiler"
      );
      const result = profilePerformance({
        "index.html": { content: "<html><body>test</body></html>" },
      });
      expect(result).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(result.grade).toBeDefined();
      expect(typeof result.scores.overall).toBe("number");
      expect(typeof result.scores.performance).toBe("number");
      expect(typeof result.scores.accessibility).toBe("number");
    });

    it("should return grade A-F", async () => {
      const { profilePerformance } = await import(
        "@/app/workspace/ai/performanceProfiler"
      );
      const result = profilePerformance({
        "index.html": { content: "<html><body>test</body></html>" },
      });
      expect(["A", "B", "C", "D", "F"]).toContain(result.grade);
    });

    it("should generate performance prompt", async () => {
      const { buildPerformancePrompt } = await import(
        "@/app/workspace/ai/performanceProfiler"
      );
      const prompt = buildPerformancePrompt({
        "index.html": { content: "<html><body>test</body></html>" },
      });
      expect(prompt).toContain("Performance");
      expect(prompt).toContain("index.html");
    });
  });

  describe("snippetLibrary", () => {
    it("should return snippets by category", async () => {
      const { getSnippetsByCategory, SNIPPETS } = await import(
        "@/app/workspace/ai/snippetLibrary"
      );
      expect(SNIPPETS.length).toBeGreaterThan(0);

      const htmlSnippets = getSnippetsByCategory("HTML");
      expect(htmlSnippets.length).toBeGreaterThan(0);
      expect(htmlSnippets.every((s) => s.category === "HTML")).toBe(true);
    });

    it("should search snippets by query", async () => {
      const { searchSnippets } = await import(
        "@/app/workspace/ai/snippetLibrary"
      );
      const results = searchSnippets("fetch");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should have valid snippet structure", async () => {
      const { SNIPPETS } = await import(
        "@/app/workspace/ai/snippetLibrary"
      );
      for (const s of SNIPPETS) {
        expect(s.id).toBeTruthy();
        expect(s.category).toBeTruthy();
        expect(s.label).toBeTruthy();
        expect(s.code).toBeTruthy();
        expect(["html", "css", "javascript"]).toContain(s.language);
      }
    });
  });

  describe("securityScanner", () => {
    it("should scan for security issues", async () => {
      const { scanSecurity } = await import(
        "@/app/workspace/ai/securityScanner"
      );
      expect(scanSecurity).toBeDefined();

      const report = scanSecurity({
        "app.js": 'const key = "sk-abc123456789012345678901234567890";\neval(userInput);',
      });
      expect(report).toBeDefined();
      expect(report.score).toBeLessThan(100);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it("should report clean code with high score", async () => {
      const { scanSecurity } = await import(
        "@/app/workspace/ai/securityScanner"
      );
      const report = scanSecurity({
        "clean.js": "const greeting = 'Hello world';",
      });
      expect(report.score).toBe(100);
      expect(report.grade).toBe("A");
    });

    it("should provide grade labels", async () => {
      const { getSecurityGradeLabel } = await import(
        "@/app/workspace/ai/securityScanner"
      );
      expect(getSecurityGradeLabel("A")).toBe("안전");
      expect(getSecurityGradeLabel("F")).toBe("심각");
    });
  });

  describe("templateMarketplace", () => {
    it("should return templates", async () => {
      const { getTemplates, getTemplatesByCategory } = await import(
        "@/app/workspace/ai/templateMarketplace"
      );
      const templates = getTemplates();
      expect(templates.length).toBeGreaterThan(0);

      const starters = getTemplatesByCategory("starter");
      expect(starters.length).toBeGreaterThan(0);
      expect(starters.every((t) => t.category === "starter")).toBe(true);
    });

    it("should have valid template structure", async () => {
      const { getTemplates } = await import(
        "@/app/workspace/ai/templateMarketplace"
      );
      const templates = getTemplates();
      for (const t of templates) {
        expect(t.id).toBeTruthy();
        expect(t.name).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.category).toBeTruthy();
        expect(t.files).toBeDefined();
        expect(Object.keys(t.files).length).toBeGreaterThan(0);
      }
    });

    it("should list template categories", async () => {
      const { TEMPLATE_CATEGORIES } = await import(
        "@/app/workspace/ai/templateMarketplace"
      );
      expect(TEMPLATE_CATEGORIES.length).toBeGreaterThan(0);
      const ids = TEMPLATE_CATEGORIES.map((c) => c.id);
      expect(ids).toContain("starter");
      expect(ids).toContain("dashboard");
    });
  });
});
