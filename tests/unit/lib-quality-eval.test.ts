// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { evaluateAIResponseQuality } from "@/lib/ai/quality-eval";

describe("lib/ai/quality-eval", () => {
  it("returns a quality evaluation result", async () => {
    const result = await evaluateAIResponseQuality({
      prompt: "Hello",
      response: "Hi there",
    });
    expect(result).toBeDefined();
    expect(result.prompt).toBe("Hello");
    expect(result.response).toBe("Hi there");
    expect(result.score).toBe(100);
    expect(result.feedback).toBe("OK");
  });

  it("includes expected field when provided", async () => {
    const result = await evaluateAIResponseQuality({
      prompt: "What is 2+2?",
      response: "4",
      expected: "4",
    });
    expect(result.expected).toBe("4");
  });

  it("includes a timestamp in ISO format", async () => {
    const result = await evaluateAIResponseQuality({
      prompt: "test",
      response: "test response",
    });
    expect(result.timestamp).toBeDefined();
    // ISO 8601 format check
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it("handles empty strings", async () => {
    const result = await evaluateAIResponseQuality({
      prompt: "",
      response: "",
    });
    expect(result.prompt).toBe("");
    expect(result.response).toBe("");
    expect(result.score).toBe(100);
  });
});
