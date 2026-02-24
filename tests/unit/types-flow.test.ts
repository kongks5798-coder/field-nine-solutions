// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

import type {
  FlowNode,
  FlowEdge,
  FlowExecutionResult,
  FlowRunResult,
} from "@/types/flow";

describe("types/flow", () => {
  describe("FlowNode type", () => {
    it("accepts valid node types", () => {
      const nodeTypes = [
        "trigger",
        "http_request",
        "ai_chat",
        "send_email",
        "transform",
        "condition",
      ] as const;
      for (const type of nodeTypes) {
        const node: FlowNode = {
          id: "n1",
          type,
          label: "Test Node",
          config: {},
          position: { x: 0, y: 0 },
        };
        expect(node.type).toBe(type);
      }
    });

    it("has required fields", () => {
      const node: FlowNode = {
        id: "node-1",
        type: "trigger",
        label: "Start",
        config: { cron: "0 * * * *" },
        position: { x: 100, y: 200 },
      };
      expect(node.id).toBe("node-1");
      expect(node.type).toBe("trigger");
      expect(node.label).toBe("Start");
      expect(node.config).toEqual({ cron: "0 * * * *" });
      expect(node.position).toEqual({ x: 100, y: 200 });
    });
  });

  describe("FlowEdge type", () => {
    it("has required fields", () => {
      const edge: FlowEdge = {
        id: "e1",
        source: "n1",
        target: "n2",
      };
      expect(edge.id).toBe("e1");
      expect(edge.source).toBe("n1");
      expect(edge.target).toBe("n2");
    });

    it("accepts optional label", () => {
      const edge: FlowEdge = {
        id: "e1",
        source: "n1",
        target: "n2",
        label: "on success",
      };
      expect(edge.label).toBe("on success");
    });
  });

  describe("FlowExecutionResult type", () => {
    it("accepts success status", () => {
      const result: FlowExecutionResult = {
        nodeId: "n1",
        status: "success",
        output: { data: "hello" },
        duration: 100,
      };
      expect(result.status).toBe("success");
    });

    it("accepts error status with error message", () => {
      const result: FlowExecutionResult = {
        nodeId: "n1",
        status: "error",
        output: null,
        error: "Something went wrong",
        duration: 50,
      };
      expect(result.status).toBe("error");
      expect(result.error).toBe("Something went wrong");
    });

    it("accepts skipped status", () => {
      const result: FlowExecutionResult = {
        nodeId: "n1",
        status: "skipped",
        output: null,
        duration: 0,
      };
      expect(result.status).toBe("skipped");
    });
  });

  describe("FlowRunResult type", () => {
    it("represents a successful flow run", () => {
      const result: FlowRunResult = {
        success: true,
        results: [
          { nodeId: "n1", status: "success", output: {}, duration: 10 },
          { nodeId: "n2", status: "success", output: {}, duration: 20 },
        ],
        totalDuration: 30,
      };
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.totalDuration).toBe(30);
    });

    it("represents a failed flow run", () => {
      const result: FlowRunResult = {
        success: false,
        results: [
          { nodeId: "n1", status: "success", output: {}, duration: 10 },
          {
            nodeId: "n2",
            status: "error",
            output: null,
            error: "fail",
            duration: 5,
          },
        ],
        totalDuration: 15,
      };
      expect(result.success).toBe(false);
    });
  });
});
