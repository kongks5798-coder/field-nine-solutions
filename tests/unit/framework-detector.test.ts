import { describe, it, expect } from "vitest";
import {
  detectFramework,
  getDefaultBuildCommand,
  getDefaultOutputDir,
  getFrameworkLabel,
} from "../../src/app/workspace/deploy/frameworkDetector";
import type { FilesMap } from "../../src/app/workspace/workspace.constants";

function makeFiles(entries: Record<string, string>): FilesMap {
  const files: FilesMap = {};
  for (const [name, content] of Object.entries(entries)) {
    const ext = name.split(".").pop() ?? "txt";
    const langMap: Record<string, string> = {
      html: "html", css: "css", js: "javascript", ts: "typescript", json: "json",
    };
    files[name] = {
      name,
      language: (langMap[ext] ?? "javascript") as FilesMap[string]["language"],
      content,
    };
  }
  return files;
}

describe("frameworkDetector", () => {
  it("detects Next.js from package.json", () => {
    const files = makeFiles({
      "package.json": JSON.stringify({ dependencies: { next: "14.0.0", react: "18.0.0" } }),
    });
    expect(detectFramework(files)).toBe("next");
  });

  it("detects React from package.json", () => {
    const files = makeFiles({
      "package.json": JSON.stringify({ dependencies: { react: "18.0.0" } }),
    });
    expect(detectFramework(files)).toBe("react");
  });

  it("detects Vue from package.json", () => {
    const files = makeFiles({
      "package.json": JSON.stringify({ dependencies: { vue: "3.0.0" } }),
    });
    expect(detectFramework(files)).toBe("vue");
  });

  it("detects Svelte from package.json", () => {
    const files = makeFiles({
      "package.json": JSON.stringify({ devDependencies: { svelte: "4.0.0" } }),
    });
    expect(detectFramework(files)).toBe("svelte");
  });

  it("detects vanilla from index.html only", () => {
    const files = makeFiles({
      "index.html": "<html></html>",
    });
    expect(detectFramework(files)).toBe("vanilla");
  });

  it("returns unknown for empty project", () => {
    expect(detectFramework({})).toBe("unknown");
  });

  it("gets correct build command", () => {
    expect(getDefaultBuildCommand("next")).toBe("npm run build");
    expect(getDefaultBuildCommand("vanilla")).toBe("");
  });

  it("gets correct output dir", () => {
    expect(getDefaultOutputDir("next")).toBe(".next");
    expect(getDefaultOutputDir("react")).toBe("build");
    expect(getDefaultOutputDir("vue")).toBe("dist");
    expect(getDefaultOutputDir("vanilla")).toBe(".");
  });

  it("gets framework label", () => {
    expect(getFrameworkLabel("next")).toBe("Next.js");
    expect(getFrameworkLabel("react")).toBe("React");
    expect(getFrameworkLabel("unknown")).toBe("Unknown");
  });
});
