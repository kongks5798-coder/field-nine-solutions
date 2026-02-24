import { describe, it, expect } from "vitest";
import {
  buildDecompositionPrompt,
  parseDecompositionResponse,
  buildStepPrompt,
  buildSelfHealPrompt,
  validateStepOutput,
} from "../../src/app/workspace/ai/autonomousLoop";

describe("autonomousLoop", () => {
  describe("buildDecompositionPrompt", () => {
    it("includes user prompt", () => {
      const prompt = buildDecompositionPrompt("Build a todo app", ["index.html"], "");
      expect(prompt).toContain("Build a todo app");
    });

    it("includes file names", () => {
      const prompt = buildDecompositionPrompt("task", ["index.html", "style.css"], "");
      expect(prompt).toContain("index.html");
      expect(prompt).toContain("style.css");
    });

    it("handles empty project", () => {
      const prompt = buildDecompositionPrompt("task", [], "");
      expect(prompt).toContain("(empty project)");
    });

    it("requests JSON format", () => {
      const prompt = buildDecompositionPrompt("task", [], "");
      expect(prompt).toContain("JSON");
      expect(prompt).toContain('"steps"');
    });
  });

  describe("parseDecompositionResponse", () => {
    it("parses valid JSON steps", () => {
      const response = JSON.stringify({
        steps: [
          { title: "Step 1", description: "Do X", filesAffected: ["a.html"] },
          { title: "Step 2", description: "Do Y", filesAffected: ["b.css"] },
        ],
      });
      const steps = parseDecompositionResponse(response);
      expect(steps).toHaveLength(2);
      expect(steps[0].title).toBe("Step 1");
      expect(steps[1].filesAffected).toEqual(["b.css"]);
    });

    it("extracts JSON from surrounding text", () => {
      const response = `Here is my plan:\n${JSON.stringify({
        steps: [{ title: "Only step", description: "desc", filesAffected: [] }],
      })}\nDone!`;
      const steps = parseDecompositionResponse(response);
      expect(steps).toHaveLength(1);
    });

    it("returns empty array for invalid response", () => {
      expect(parseDecompositionResponse("no json here")).toEqual([]);
    });

    it("handles missing fields gracefully", () => {
      const response = JSON.stringify({
        steps: [{ title: "Step" }],
      });
      const steps = parseDecompositionResponse(response);
      expect(steps[0].description).toBe("");
      expect(steps[0].filesAffected).toEqual([]);
    });
  });

  describe("buildStepPrompt", () => {
    it("includes step info", () => {
      const prompt = buildStepPrompt(
        { title: "Add CSS", description: "Style the page", filesAffected: ["style.css"] },
        0, 3, [], "file context",
      );
      expect(prompt).toContain("step 1 of 3");
      expect(prompt).toContain("Add CSS");
      expect(prompt).toContain("Style the page");
    });

    it("includes previous results", () => {
      const prompt = buildStepPrompt(
        { title: "Step 2", description: "desc", filesAffected: [] },
        1, 3, ["Created HTML structure"], "context",
      );
      expect(prompt).toContain("Previous Steps");
      expect(prompt).toContain("Created HTML structure");
    });
  });

  describe("buildSelfHealPrompt", () => {
    it("includes errors", () => {
      const prompt = buildSelfHealPrompt(
        ["TypeError: x is not defined", "Missing semicolon"],
        "code context",
      );
      expect(prompt).toContain("TypeError: x is not defined");
      expect(prompt).toContain("Missing semicolon");
    });
  });

  describe("validateStepOutput", () => {
    it("returns no errors for valid output", () => {
      const errors = validateStepOutput(
        { "index.html": "<html><body>Hello</body></html>" },
        [],
      );
      expect(errors).toHaveLength(0);
    });

    it("catches empty files", () => {
      const errors = validateStepOutput({ "empty.js": "" }, []);
      expect(errors.some((e) => e.includes("Empty file"))).toBe(true);
    });

    it("catches console errors", () => {
      const errors = validateStepOutput(
        { "index.html": "<html></html>" },
        ["ReferenceError: foo is not defined"],
      );
      expect(errors.some((e) => e.includes("Console"))).toBe(true);
    });

    it("catches mismatched braces in JS", () => {
      const errors = validateStepOutput(
        { "script.js": "function foo() { if (true) {" },
        [],
      );
      expect(errors.some((e) => e.includes("braces"))).toBe(true);
    });
  });
});
