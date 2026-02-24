// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import { type AIMode } from "@/lib/ai/multiAI";

describe("lib/ai/multiAI", () => {
  it("AIMode type accepts openai", () => {
    const mode: AIMode = "openai";
    expect(mode).toBe("openai");
  });

  it("AIMode type accepts anthropic", () => {
    const mode: AIMode = "anthropic";
    expect(mode).toBe("anthropic");
  });

  it("AIMode type accepts gemini", () => {
    const mode: AIMode = "gemini";
    expect(mode).toBe("gemini");
  });

  it("AIMode type accepts grok", () => {
    const mode: AIMode = "grok";
    expect(mode).toBe("grok");
  });
});
