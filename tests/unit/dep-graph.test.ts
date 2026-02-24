import { describe, it, expect } from "vitest";
import {
  buildDepGraph,
  flattenDeps,
  detectCircular,
} from "../../src/app/workspace/package/depGraph";

describe("depGraph", () => {
  const packages = [
    { name: "react", version: "18.2.0", dependencies: ["loose-envify"] },
    { name: "loose-envify", version: "1.4.0", dependencies: [] },
    { name: "axios", version: "1.6.0", dependencies: [] },
  ];

  describe("buildDepGraph", () => {
    it("builds tree with children", () => {
      const roots = buildDepGraph(packages);
      expect(roots).toHaveLength(3);
      const react = roots.find((n) => n.name === "react");
      expect(react).toBeDefined();
      expect(react!.children).toHaveLength(1);
      expect(react!.children[0].name).toBe("loose-envify");
    });

    it("handles empty packages", () => {
      expect(buildDepGraph([])).toEqual([]);
    });

    it("marks circular dependencies", () => {
      const circular = [
        { name: "a", version: "1.0.0", dependencies: ["b"] },
        { name: "b", version: "1.0.0", dependencies: ["a"] },
      ];
      const roots = buildDepGraph(circular);
      const a = roots.find((n) => n.name === "a");
      // a -> b -> a (circular)
      expect(a!.children[0].children[0].isCircular).toBe(true);
    });
  });

  describe("flattenDeps", () => {
    it("returns unique names", () => {
      const roots = buildDepGraph(packages);
      const flat = flattenDeps(roots);
      expect(flat).toContain("react");
      expect(flat).toContain("loose-envify");
      expect(flat).toContain("axios");
      expect(new Set(flat).size).toBe(flat.length);
    });
  });

  describe("detectCircular", () => {
    it("finds no cycles in acyclic graph", () => {
      const cycles = detectCircular(packages);
      expect(cycles).toHaveLength(0);
    });

    it("detects circular dependency", () => {
      const circular = [
        { name: "a", version: "1.0.0", dependencies: ["b"] },
        { name: "b", version: "1.0.0", dependencies: ["a"] },
      ];
      const cycles = detectCircular(circular);
      expect(cycles.length).toBeGreaterThan(0);
    });
  });
});
