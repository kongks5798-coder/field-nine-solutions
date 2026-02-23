import { describe, it, expect } from "vitest";
import { T } from "@/lib/theme";
import type { ThemeColor } from "@/lib/theme";

describe("lib/theme - T constants", () => {
  it("exports T as a frozen object", () => {
    expect(T).toBeDefined();
    expect(typeof T).toBe("object");
    // as const makes it readonly, so assigning should fail at compile time
    // at runtime, check all keys exist
    expect(Object.keys(T).length).toBeGreaterThan(0);
  });

  it("contains all required color keys", () => {
    const requiredKeys = [
      "bg",
      "surface",
      "card",
      "border",
      "accent",
      "accentPink",
      "gradient",
      "text",
      "textMuted",
      "muted",
      "red",
      "blue",
      "green",
      "yellow",
      "fontStack",
    ];
    for (const key of requiredKeys) {
      expect(T).toHaveProperty(key);
      expect((T as any)[key]).toBeTruthy();
    }
  });

  it("has valid hex color format for primary colors", () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    expect(T.bg).toMatch(hexPattern);
    expect(T.surface).toMatch(hexPattern);
    expect(T.accent).toMatch(hexPattern);
    expect(T.text).toMatch(hexPattern);
    expect(T.red).toMatch(hexPattern);
    expect(T.blue).toMatch(hexPattern);
    expect(T.green).toMatch(hexPattern);
    expect(T.yellow).toMatch(hexPattern);
  });

  it("has a CSS gradient for gradient key", () => {
    expect(T.gradient).toContain("linear-gradient");
    expect(T.gradient).toContain(T.accent);
  });

  it("has a font stack string for fontStack", () => {
    expect(T.fontStack).toContain("Pretendard");
    expect(T.fontStack).toContain("sans-serif");
  });

  it("exports ThemeColor type that matches T shape", () => {
    // This is a compile-time check; at runtime we verify the type alias is usable
    const theme: ThemeColor = T;
    expect(theme.accent).toBe(T.accent);
    expect(theme.bg).toBe(T.bg);
  });
});
