// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  PATROL_AGENTS,
  PATROL_TEAMS,
  getPatrolAgent,
  getTeamAgents,
  getTeamMeta,
  PATROL_TEAM_COUNT,
  PATROL_AGENT_COUNT,
  type PatrolTeam,
  type PatrolAgent,
  type PatrolTeamMeta,
} from "@/lib/patrol-agents";

describe("lib/patrol-agents", () => {
  describe("PATROL_AGENTS constant", () => {
    it("contains exactly 9 agents", () => {
      expect(PATROL_AGENTS).toHaveLength(9);
    });

    it("each agent has all required fields", () => {
      for (const agent of PATROL_AGENTS) {
        expect(agent).toHaveProperty("id");
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("nameKo");
        expect(agent).toHaveProperty("emoji");
        expect(agent).toHaveProperty("team");
        expect(agent).toHaveProperty("teamName");
        expect(agent).toHaveProperty("role");
        expect(agent).toHaveProperty("specialty");
        expect(agent).toHaveProperty("bio");
      }
    });

    it("all agent IDs are unique", () => {
      const ids = PATROL_AGENTS.map((a) => a.id);
      expect(new Set(ids).size).toBe(9);
    });

    it("IDs are sequential 1-9", () => {
      const ids = PATROL_AGENTS.map((a) => a.id).sort((a, b) => a - b);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe("PATROL_TEAMS constant", () => {
    it("contains exactly 3 teams", () => {
      expect(PATROL_TEAMS).toHaveLength(3);
    });

    it("has management, maintenance, and repair teams", () => {
      const teamIds = PATROL_TEAMS.map((t) => t.id);
      expect(teamIds).toContain("management");
      expect(teamIds).toContain("maintenance");
      expect(teamIds).toContain("repair");
    });

    it("each team has required metadata fields", () => {
      for (const team of PATROL_TEAMS) {
        expect(team).toHaveProperty("id");
        expect(team).toHaveProperty("name");
        expect(team).toHaveProperty("nameKo");
        expect(team).toHaveProperty("emoji");
        expect(team).toHaveProperty("description");
      }
    });
  });

  describe("getPatrolAgent()", () => {
    it("returns agent by ID", () => {
      const agent = getPatrolAgent(1);
      expect(agent).toBeDefined();
      expect(agent!.name).toBe("Captain");
      expect(agent!.team).toBe("management");
    });

    it("returns last agent (id=9)", () => {
      const agent = getPatrolAgent(9);
      expect(agent).toBeDefined();
      expect(agent!.name).toBe("Patcher");
    });

    it("returns undefined for non-existent ID", () => {
      expect(getPatrolAgent(0)).toBeUndefined();
      expect(getPatrolAgent(10)).toBeUndefined();
      expect(getPatrolAgent(-1)).toBeUndefined();
    });
  });

  describe("getTeamAgents()", () => {
    it("returns 3 agents for management team", () => {
      const agents = getTeamAgents("management");
      expect(agents).toHaveLength(3);
      agents.forEach((a) => expect(a.team).toBe("management"));
    });

    it("returns 3 agents for maintenance team", () => {
      const agents = getTeamAgents("maintenance");
      expect(agents).toHaveLength(3);
      agents.forEach((a) => expect(a.team).toBe("maintenance"));
    });

    it("returns 3 agents for repair team", () => {
      const agents = getTeamAgents("repair");
      expect(agents).toHaveLength(3);
      agents.forEach((a) => expect(a.team).toBe("repair"));
    });
  });

  describe("getTeamMeta()", () => {
    it("returns metadata for management team", () => {
      const meta = getTeamMeta("management");
      expect(meta).toBeDefined();
      expect(meta!.name).toBe("Team Shield");
      expect(meta!.nameKo).toBe("관리");
    });

    it("returns metadata for maintenance team", () => {
      const meta = getTeamMeta("maintenance");
      expect(meta).toBeDefined();
      expect(meta!.name).toBe("Team Engine");
    });

    it("returns metadata for repair team", () => {
      const meta = getTeamMeta("repair");
      expect(meta).toBeDefined();
      expect(meta!.name).toBe("Team Medic");
    });
  });

  describe("constants", () => {
    it("PATROL_TEAM_COUNT is 3", () => {
      expect(PATROL_TEAM_COUNT).toBe(3);
    });

    it("PATROL_AGENT_COUNT is 9", () => {
      expect(PATROL_AGENT_COUNT).toBe(9);
    });
  });
});
