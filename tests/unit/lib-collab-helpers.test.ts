// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase client before importing collab
vi.mock("@/utils/supabase/client", () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

import {
  generateUserId,
  pickColor,
  type CursorPayload,
  type ContentPayload,
  type PresenceMeta,
  type CollabUser,
} from "@/lib/collab";

describe("lib/collab helpers", () => {
  describe("generateUserId()", () => {
    it("returns a string starting with 'u_'", () => {
      const id = generateUserId();
      expect(id).toMatch(/^u_/);
    });

    it("generates unique IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateUserId()));
      expect(ids.size).toBe(100);
    });

    it("has reasonable length", () => {
      const id = generateUserId();
      expect(id.length).toBeGreaterThan(5);
      expect(id.length).toBeLessThan(30);
    });
  });

  describe("pickColor()", () => {
    it("returns a valid hex color string", () => {
      const color = pickColor("user-123");
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it("returns same color for same userId (deterministic)", () => {
      const color1 = pickColor("user-abc");
      const color2 = pickColor("user-abc");
      expect(color1).toBe(color2);
    });

    it("returns different colors for different userIds", () => {
      // Not guaranteed but very likely for sufficiently different inputs
      const colors = new Set(
        Array.from({ length: 20 }, (_, i) => pickColor(`user-${i}`)),
      );
      // Should have at least 2 different colors from 20 different users
      expect(colors.size).toBeGreaterThan(1);
    });

    it("returns one of the 7 predefined colors", () => {
      const PRESENCE_COLORS = [
        "#3b82f6",
        "#8b5cf6",
        "#22c55e",
        "#f43f5e",
        "#14b8a6",
        "#eab308",
        "#ec4899",
      ];
      for (let i = 0; i < 50; i++) {
        const color = pickColor(`test-user-${i}`);
        expect(PRESENCE_COLORS).toContain(color);
      }
    });
  });

  describe("type checks", () => {
    it("CursorPayload has required fields", () => {
      const payload: CursorPayload = {
        userId: "u1",
        userName: "Test",
        position: 42,
        color: "#3b82f6",
      };
      expect(payload.userId).toBe("u1");
      expect(payload.position).toBe(42);
    });

    it("ContentPayload has required fields", () => {
      const payload: ContentPayload = {
        content: "Hello world",
        sender: "u1",
        cursorPos: 11,
      };
      expect(payload.content).toBe("Hello world");
    });

    it("PresenceMeta has required fields", () => {
      const meta: PresenceMeta = {
        name: "User",
        color: "#3b82f6",
        cursor: "editing",
        joinedAt: new Date().toISOString(),
      };
      expect(meta.cursor).toBe("editing");
    });

    it("CollabUser has required fields", () => {
      const user: CollabUser = {
        id: "u1",
        name: "Test User",
        color: "#3b82f6",
        initial: "T",
        cursor: "viewing",
      };
      expect(user.initial).toBe("T");
    });
  });
});
