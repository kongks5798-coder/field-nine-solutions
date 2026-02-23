import { describe, it, expect, beforeEach } from "vitest";
import { t, setLocale, getLocale, getSupportedLocales } from "@/lib/i18n";

describe("i18n", () => {
  beforeEach(() => {
    setLocale("ko");
  });

  it("returns Korean translation by default", () => {
    expect(t("common.loading")).toBe("로딩 중...");
  });

  it("returns English translation when locale is en", () => {
    setLocale("en");
    expect(t("common.loading")).toBe("Loading...");
  });

  it("returns Japanese translation", () => {
    expect(t("common.loading", "ja")).toBe("読み込み中...");
  });

  it("falls back to Korean for missing keys", () => {
    setLocale("en");
    expect(t("nonexistent.key")).toBe("nonexistent.key");
  });

  it("getLocale returns current locale", () => {
    expect(getLocale()).toBe("ko");
    setLocale("en");
    expect(getLocale()).toBe("en");
  });

  it("getSupportedLocales returns all locales", () => {
    const locales = getSupportedLocales();
    expect(locales).toContain("ko");
    expect(locales).toContain("en");
    expect(locales).toContain("ja");
  });

  it("navigation keys exist in all locales", () => {
    const navKeys = ["nav.home", "nav.workspace", "nav.dashboard", "nav.settings"];
    for (const key of navKeys) {
      expect(t(key, "ko")).not.toBe(key);
      expect(t(key, "en")).not.toBe(key);
      expect(t(key, "ja")).not.toBe(key);
    }
  });
});
