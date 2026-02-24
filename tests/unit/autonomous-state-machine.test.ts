import { describe, it, expect } from "vitest";
import {
  createInitialContext,
  autonomousTransition,
  type AutonomousContext,
  type AutonomousEvent,
} from "../../src/app/workspace/ai/autonomousStateMachine";

function dispatch(ctx: AutonomousContext, ...events: AutonomousEvent[]): AutonomousContext {
  return events.reduce((c, e) => autonomousTransition(c, e), ctx);
}

describe("autonomousStateMachine", () => {
  it("starts in idle state", () => {
    const ctx = createInitialContext();
    expect(ctx.state).toBe("idle");
    expect(ctx.currentStepIndex).toBe(-1);
    expect(ctx.totalSteps).toBe(0);
  });

  it("transitions idle → decomposing on START_TASK", () => {
    const ctx = dispatch(createInitialContext(), { type: "START_TASK", prompt: "build todo" });
    expect(ctx.state).toBe("decomposing");
  });

  it("transitions decomposing → executing_step on DECOMPOSITION_COMPLETE", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx,
      { type: "START_TASK", prompt: "test" },
      { type: "DECOMPOSITION_COMPLETE", stepCount: 3 },
    );
    expect(ctx.state).toBe("executing_step");
    expect(ctx.totalSteps).toBe(3);
    expect(ctx.currentStepIndex).toBe(0);
  });

  it("transitions executing_step → validating on STEP_STREAM_COMPLETE", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx,
      { type: "START_TASK", prompt: "test" },
      { type: "DECOMPOSITION_COMPLETE", stepCount: 3 },
      { type: "STEP_STREAM_COMPLETE" },
    );
    expect(ctx.state).toBe("validating");
  });

  it("transitions validating → completing_step on VALIDATION_PASS", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx,
      { type: "START_TASK", prompt: "test" },
      { type: "DECOMPOSITION_COMPLETE", stepCount: 3 },
      { type: "STEP_STREAM_COMPLETE" },
      { type: "VALIDATION_PASS" },
    );
    expect(ctx.state).toBe("completing_step");
  });

  it("advances to next step after STEP_COMPLETE", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx,
      { type: "START_TASK", prompt: "test" },
      { type: "DECOMPOSITION_COMPLETE", stepCount: 3 },
      { type: "STEP_STREAM_COMPLETE" },
      { type: "VALIDATION_PASS" },
      { type: "STEP_COMPLETE" },
    );
    expect(ctx.state).toBe("executing_step");
    expect(ctx.currentStepIndex).toBe(1);
  });

  it("completes when all steps are done", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx,
      { type: "START_TASK", prompt: "test" },
      { type: "DECOMPOSITION_COMPLETE", stepCount: 1 },
      { type: "STEP_STREAM_COMPLETE" },
      { type: "VALIDATION_PASS" },
      { type: "STEP_COMPLETE" },
    );
    expect(ctx.state).toBe("completed");
  });

  it("enters self_healing on VALIDATION_FAIL", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx,
      { type: "START_TASK", prompt: "test" },
      { type: "DECOMPOSITION_COMPLETE", stepCount: 2 },
      { type: "STEP_STREAM_COMPLETE" },
      { type: "VALIDATION_FAIL", errors: ["syntax error"] },
    );
    expect(ctx.state).toBe("self_healing");
    expect(ctx.healAttempts).toBe(1);
  });

  it("returns to validating after HEAL_COMPLETE", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx,
      { type: "START_TASK", prompt: "test" },
      { type: "DECOMPOSITION_COMPLETE", stepCount: 2 },
      { type: "STEP_STREAM_COMPLETE" },
      { type: "VALIDATION_FAIL", errors: ["error"] },
      { type: "HEAL_COMPLETE" },
    );
    expect(ctx.state).toBe("validating");
  });

  it("skips to completing_step after max heal attempts", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx, { type: "START_TASK", prompt: "test" });
    ctx = dispatch(ctx, { type: "DECOMPOSITION_COMPLETE", stepCount: 2 });
    ctx = dispatch(ctx, { type: "STEP_STREAM_COMPLETE" });
    // 3 validation failures = max heal attempts (3)
    ctx = dispatch(ctx, { type: "VALIDATION_FAIL", errors: ["e1"] });
    ctx = dispatch(ctx, { type: "HEAL_COMPLETE" });
    ctx = dispatch(ctx, { type: "VALIDATION_FAIL", errors: ["e2"] });
    ctx = dispatch(ctx, { type: "HEAL_COMPLETE" });
    ctx = dispatch(ctx, { type: "VALIDATION_FAIL", errors: ["e3"] });
    ctx = dispatch(ctx, { type: "HEAL_COMPLETE" });
    ctx = dispatch(ctx, { type: "VALIDATION_FAIL", errors: ["e4"] }); // 4th fail, max=3 reached
    expect(ctx.state).toBe("completing_step"); // gives up healing
  });

  it("cancels from any state", () => {
    let ctx = dispatch(createInitialContext(), { type: "START_TASK", prompt: "test" });
    ctx = dispatch(ctx, { type: "CANCEL" });
    expect(ctx.state).toBe("cancelled");
  });

  it("resets from any state", () => {
    let ctx = dispatch(createInitialContext(), { type: "START_TASK", prompt: "test" });
    ctx = dispatch(ctx, { type: "RESET" });
    expect(ctx.state).toBe("idle");
  });

  it("transitions awaiting_approval → completing_step on APPROVE", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx,
      { type: "START_TASK", prompt: "test" },
      { type: "DECOMPOSITION_COMPLETE", stepCount: 2 },
      { type: "STEP_STREAM_COMPLETE" },
      { type: "VALIDATION_PASS" },
    );
    // Simulate approval required
    ctx = { ...ctx, state: "awaiting_approval" };
    ctx = dispatch(ctx, { type: "APPROVE" });
    expect(ctx.state).toBe("completing_step");
  });

  it("transitions awaiting_approval → rolling_back on REJECT", () => {
    let ctx: AutonomousContext = {
      ...createInitialContext(),
      state: "awaiting_approval",
      totalSteps: 2,
      currentStepIndex: 0,
    };
    ctx = dispatch(ctx, { type: "REJECT" });
    expect(ctx.state).toBe("rolling_back");
  });

  it("can restart after completion", () => {
    let ctx = createInitialContext();
    ctx = dispatch(ctx,
      { type: "START_TASK", prompt: "first" },
      { type: "DECOMPOSITION_COMPLETE", stepCount: 1 },
      { type: "STEP_STREAM_COMPLETE" },
      { type: "VALIDATION_PASS" },
      { type: "STEP_COMPLETE" },
    );
    expect(ctx.state).toBe("completed");
    ctx = dispatch(ctx, { type: "START_TASK", prompt: "second" });
    expect(ctx.state).toBe("decomposing");
  });
});
