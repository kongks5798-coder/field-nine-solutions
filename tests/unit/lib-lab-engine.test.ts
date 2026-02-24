// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createTeams,
  createBracketStructure,
  ROUND_ORDER,
  ROUND_LABELS,
  buildInnovationPrompt,
  buildJudgePrompt,
  parseAiJson,
  calcTotal,
  type LabTeam,
  type MatchScore,
  type Innovation,
  type RoundName,
  type BracketMatch,
} from "@/lib/lab-engine";

describe("lib/lab-engine", () => {
  describe("createTeams()", () => {
    it("creates exactly 10 teams", () => {
      const teams = createTeams();
      expect(teams).toHaveLength(10);
    });

    it("each team has 3 agents", () => {
      const teams = createTeams();
      for (const team of teams) {
        expect(team.agentIds).toHaveLength(3);
      }
    });

    it("seeds are 1 through 10", () => {
      const teams = createTeams();
      const seeds = teams.map((t) => t.seed).sort((a, b) => a - b);
      expect(seeds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it("all 30 agent IDs are used exactly once", () => {
      const teams = createTeams();
      const allIds = teams.flatMap((t) => t.agentIds).sort((a, b) => a - b);
      expect(allIds).toHaveLength(30);
      expect(new Set(allIds).size).toBe(30);
    });

    it("no team is eliminated at creation", () => {
      const teams = createTeams();
      for (const team of teams) {
        expect(team.eliminated).toBe(false);
      }
    });

    it("each team has a non-empty teamName", () => {
      const teams = createTeams();
      for (const team of teams) {
        expect(team.teamName.length).toBeGreaterThan(0);
      }
    });
  });

  describe("createBracketStructure()", () => {
    it("returns 9 matches total", () => {
      const bracket = createBracketStructure();
      expect(bracket).toHaveLength(9);
    });

    it("has 2 play-in matches", () => {
      const bracket = createBracketStructure();
      const playIn = bracket.filter((m) => m.round === "play_in");
      expect(playIn).toHaveLength(2);
    });

    it("has 4 round-of-8 matches", () => {
      const bracket = createBracketStructure();
      const r8 = bracket.filter((m) => m.round === "round_8");
      expect(r8).toHaveLength(4);
    });

    it("has 2 semi-final matches", () => {
      const bracket = createBracketStructure();
      const semi = bracket.filter((m) => m.round === "semi");
      expect(semi).toHaveLength(2);
    });

    it("has 1 final match", () => {
      const bracket = createBracketStructure();
      const finals = bracket.filter((m) => m.round === "final");
      expect(finals).toHaveLength(1);
    });
  });

  describe("ROUND_ORDER / ROUND_LABELS", () => {
    it("ROUND_ORDER has 4 rounds in correct sequence", () => {
      expect(ROUND_ORDER).toEqual(["play_in", "round_8", "semi", "final"]);
    });

    it("ROUND_LABELS has Korean labels for each round", () => {
      expect(ROUND_LABELS.play_in).toBe("플레이인");
      expect(ROUND_LABELS.round_8).toBe("8강");
      expect(ROUND_LABELS.semi).toBe("4강");
      expect(ROUND_LABELS.final).toBe("결승");
    });
  });

  describe("buildInnovationPrompt()", () => {
    it("includes team member info", () => {
      const prompt = buildInnovationPrompt([1, 2, 3]);
      expect(prompt).toContain("Dr. Neural");
      expect(prompt).toContain("Lex Parse");
      expect(prompt).toContain("Iris Vision");
    });

    it("includes JSON format instructions", () => {
      const prompt = buildInnovationPrompt([1, 2, 3]);
      expect(prompt).toContain("JSON");
      expect(prompt).toContain("title");
      expect(prompt).toContain("summary");
      expect(prompt).toContain("techStack");
    });

    it("includes parent innovation context when provided", () => {
      const parent: Innovation = {
        title: "Test Innovation",
        summary: "A test",
        architecture: "Test arch",
        codeSnippet: "console.log('test')",
        techStack: ["TypeScript"],
      };
      const prompt = buildInnovationPrompt([1, 2, 3], parent);
      expect(prompt).toContain("Test Innovation");
      expect(prompt).toContain("재도전");
    });

    it("does not include parent context when not provided", () => {
      const prompt = buildInnovationPrompt([1, 2, 3]);
      expect(prompt).not.toContain("재도전");
    });
  });

  describe("buildJudgePrompt()", () => {
    const innovA: Innovation = {
      title: "Innovation A",
      summary: "Summary A",
      architecture: "Arch A",
      codeSnippet: "code A",
      techStack: ["React", "Node.js"],
    };
    const innovB: Innovation = {
      title: "Innovation B",
      summary: "Summary B",
      architecture: "Arch B",
      codeSnippet: "code B",
      techStack: ["Python", "Django"],
    };

    it("includes both team innovations", () => {
      const prompt = buildJudgePrompt(innovA, innovB);
      expect(prompt).toContain("Innovation A");
      expect(prompt).toContain("Innovation B");
    });

    it("includes scoring criteria", () => {
      const prompt = buildJudgePrompt(innovA, innovB);
      expect(prompt).toContain("innovation");
      expect(prompt).toContain("feasibility");
      expect(prompt).toContain("impact");
      expect(prompt).toContain("quality");
    });

    it("includes tech stacks", () => {
      const prompt = buildJudgePrompt(innovA, innovB);
      expect(prompt).toContain("React, Node.js");
      expect(prompt).toContain("Python, Django");
    });
  });

  describe("parseAiJson()", () => {
    it("parses valid JSON string", () => {
      const result = parseAiJson<{ a: number }>('{"a":1}');
      expect(result).toEqual({ a: 1 });
    });

    it("strips markdown code blocks", () => {
      const result = parseAiJson<{ b: string }>('```json\n{"b":"test"}\n```');
      expect(result).toEqual({ b: "test" });
    });

    it("strips code blocks without language tag", () => {
      const result = parseAiJson<{ c: boolean }>('```\n{"c":true}\n```');
      expect(result).toEqual({ c: true });
    });

    it("returns null for invalid JSON", () => {
      expect(parseAiJson("not json")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseAiJson("")).toBeNull();
    });
  });

  describe("calcTotal()", () => {
    it("sums all score components", () => {
      const result = calcTotal({
        innovation: 25,
        feasibility: 20,
        impact: 20,
        quality: 15,
      });
      expect(result.total).toBe(80);
    });

    it("preserves original fields", () => {
      const result = calcTotal({
        innovation: 30,
        feasibility: 25,
        impact: 25,
        quality: 20,
      });
      expect(result.innovation).toBe(30);
      expect(result.feasibility).toBe(25);
      expect(result.impact).toBe(25);
      expect(result.quality).toBe(20);
      expect(result.total).toBe(100);
    });

    it("handles zero scores", () => {
      const result = calcTotal({
        innovation: 0,
        feasibility: 0,
        impact: 0,
        quality: 0,
      });
      expect(result.total).toBe(0);
    });
  });
});
