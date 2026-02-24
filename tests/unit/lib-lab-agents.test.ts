// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  LAB_AGENTS,
  AGENT_FIELDS,
  getAgent,
  generateTeamName,
  type LabAgent,
} from "@/lib/lab-agents";

describe("lib/lab-agents", () => {
  describe("LAB_AGENTS constant", () => {
    it("contains exactly 30 agents", () => {
      expect(LAB_AGENTS).toHaveLength(30);
    });

    it("each agent has all required fields", () => {
      for (const agent of LAB_AGENTS) {
        expect(agent).toHaveProperty("id");
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("nameKo");
        expect(agent).toHaveProperty("emoji");
        expect(agent).toHaveProperty("field");
        expect(agent).toHaveProperty("fieldKo");
        expect(agent).toHaveProperty("specialty");
        expect(agent).toHaveProperty("bio");
      }
    });

    it("all agent IDs are unique and sequential 1-30", () => {
      const ids = LAB_AGENTS.map((a) => a.id).sort((a, b) => a - b);
      expect(ids).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    });

    it("all agent names are unique", () => {
      const names = LAB_AGENTS.map((a) => a.name);
      expect(new Set(names).size).toBe(30);
    });

    it("each agent belongs to one of the 10 known fields", () => {
      for (const agent of LAB_AGENTS) {
        expect(AGENT_FIELDS).toContain(agent.field);
      }
    });

    it("each field has exactly 3 agents", () => {
      for (const field of AGENT_FIELDS) {
        const count = LAB_AGENTS.filter((a) => a.field === field).length;
        expect(count).toBe(3);
      }
    });
  });

  describe("AGENT_FIELDS", () => {
    it("contains exactly 10 fields", () => {
      expect(AGENT_FIELDS).toHaveLength(10);
    });

    it("includes expected fields", () => {
      expect(AGENT_FIELDS).toContain("AI/ML");
      expect(AGENT_FIELDS).toContain("Security");
      expect(AGENT_FIELDS).toContain("Frontend");
      expect(AGENT_FIELDS).toContain("Backend");
    });
  });

  describe("getAgent()", () => {
    it("returns the correct agent by ID", () => {
      const agent = getAgent(1);
      expect(agent).toBeDefined();
      expect(agent!.name).toBe("Dr. Neural");
      expect(agent!.field).toBe("AI/ML");
    });

    it("returns undefined for non-existent ID", () => {
      expect(getAgent(0)).toBeUndefined();
      expect(getAgent(31)).toBeUndefined();
      expect(getAgent(-1)).toBeUndefined();
    });

    it("returns agent 30 (last agent)", () => {
      const agent = getAgent(30);
      expect(agent).toBeDefined();
      expect(agent!.name).toBe("Helix");
    });
  });

  describe("generateTeamName()", () => {
    it("returns a string containing field names", () => {
      const name = generateTeamName([1, 4, 7]); // AI/ML, Security, Cloud
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    });

    it("includes the Korean field names from team members", () => {
      // Agents 10, 11, 12 are all Frontend
      const name = generateTeamName([10, 11, 12]);
      expect(name).toContain("프론트엔드");
    });

    it("handles agents from multiple fields with deduplication", () => {
      // Two AI/ML agents (1, 2) and one Security agent (4) -> unique fields
      const name = generateTeamName([1, 2, 4]);
      expect(name).toContain("AI/ML");
      expect(name).toContain("보안");
    });

    it("returns a name with a Greek letter prefix", () => {
      const name = generateTeamName([1, 2, 3]);
      // The prefix should be one of the Korean transliterations
      const koreanPrefixes = [
        "알파", "베타", "감마", "델타", "엡실론", "제타", "에타", "세타",
        "이오타", "카파", "시그마", "오메가", "람다", "뮤", "파이", "로",
        "타우", "업실론", "크시", "오미크론",
      ];
      const prefix = name.split(" ")[0];
      expect(koreanPrefixes).toContain(prefix);
    });
  });
});
