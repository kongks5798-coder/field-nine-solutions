/**
 * Pure functions for detecting project framework and providing build defaults.
 */
import type { FilesMap } from "../workspace.constants";

export type FrameworkType = "next" | "react" | "vue" | "svelte" | "angular" | "vanilla" | "unknown";

/**
 * Detect framework from project files.
 * Checks package.json dependencies, config files, and file patterns.
 */
export function detectFramework(files: FilesMap): FrameworkType {
  const pkgJson = files["package.json"];
  if (pkgJson) {
    try {
      const parsed = JSON.parse(pkgJson.content);
      const allDeps = {
        ...parsed.dependencies,
        ...parsed.devDependencies,
      };
      if (allDeps["next"]) return "next";
      if (allDeps["@angular/core"]) return "angular";
      if (allDeps["svelte"]) return "svelte";
      if (allDeps["vue"]) return "vue";
      if (allDeps["react"]) return "react";
    } catch { /* invalid JSON */ }
  }

  // Check config files
  if (files["next.config.js"] || files["next.config.ts"] || files["next.config.mjs"]) return "next";
  if (files["svelte.config.js"]) return "svelte";
  if (files["vue.config.js"] || files["nuxt.config.ts"]) return "vue";
  if (files["angular.json"]) return "angular";
  if (files["vite.config.ts"] || files["vite.config.js"]) return "react";

  // Fallback: if has index.html → vanilla
  if (files["index.html"]) return "vanilla";

  return "unknown";
}

/**
 * Get default build command for a framework.
 */
export function getDefaultBuildCommand(fw: FrameworkType): string {
  switch (fw) {
    case "next":    return "npm run build";
    case "react":   return "npm run build";
    case "vue":     return "npm run build";
    case "svelte":  return "npm run build";
    case "angular": return "npm run build";
    case "vanilla": return ""; // no build step needed
    default:        return "npm run build";
  }
}

/**
 * Get default output directory for a framework.
 */
export function getDefaultOutputDir(fw: FrameworkType): string {
  switch (fw) {
    case "next":    return ".next";
    case "react":   return "build";
    case "vue":     return "dist";
    case "svelte":  return "build";
    case "angular": return "dist";
    case "vanilla": return ".";
    default:        return "dist";
  }
}

/**
 * Get framework display label.
 */
export function getFrameworkLabel(fw: FrameworkType): string {
  switch (fw) {
    case "next":    return "Next.js";
    case "react":   return "React";
    case "vue":     return "Vue.js";
    case "svelte":  return "Svelte";
    case "angular": return "Angular";
    case "vanilla": return "Vanilla HTML";
    default:        return "Unknown";
  }
}

/**
 * Get framework icon/color.
 */
export function getFrameworkColor(fw: FrameworkType): string {
  switch (fw) {
    case "next":    return "#ffffff";
    case "react":   return "#61dafb";
    case "vue":     return "#42b883";
    case "svelte":  return "#ff3e00";
    case "angular": return "#dd0031";
    case "vanilla": return "#f7df1e";
    default:        return "#888888";
  }
}
