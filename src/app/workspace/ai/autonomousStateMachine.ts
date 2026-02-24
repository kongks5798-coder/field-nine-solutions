/**
 * Pure-function state machine for the autonomous agent loop.
 * Extends the existing agent state machine with multi-step task management.
 *
 * States flow: idle → decomposing → executing_step → validating →
 *   (self_healing | awaiting_approval | completing_step) → ... → completed
 */

export type AutonomousState =
  | "idle"
  | "decomposing"
  | "executing_step"
  | "validating"
  | "self_healing"
  | "awaiting_approval"
  | "completing_step"
  | "rolling_back"
  | "completed"
  | "failed"
  | "cancelled";

export type AutonomousEvent =
  | { type: "START_TASK"; prompt: string }
  | { type: "DECOMPOSITION_COMPLETE"; stepCount: number }
  | { type: "DECOMPOSITION_FAILED"; error: string }
  | { type: "STEP_BEGIN"; stepIndex: number }
  | { type: "STEP_STREAM_COMPLETE" }
  | { type: "VALIDATION_PASS" }
  | { type: "VALIDATION_FAIL"; errors: string[] }
  | { type: "HEAL_COMPLETE" }
  | { type: "HEAL_FAILED"; error: string }
  | { type: "APPROVAL_REQUIRED" }
  | { type: "APPROVE" }
  | { type: "REJECT" }
  | { type: "STEP_COMPLETE" }
  | { type: "ALL_STEPS_DONE" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "CANCEL" }
  | { type: "ROLLBACK" }
  | { type: "ROLLBACK_COMPLETE" }
  | { type: "ERROR"; error: string }
  | { type: "RESET" };

export interface AutonomousContext {
  state: AutonomousState;
  currentStepIndex: number;
  totalSteps: number;
  iterationCount: number;
  maxIterations: number;
  lastError: string | null;
  healAttempts: number;
  maxHealAttempts: number;
}

export function createInitialContext(): AutonomousContext {
  return {
    state: "idle",
    currentStepIndex: -1,
    totalSteps: 0,
    iterationCount: 0,
    maxIterations: 20,
    lastError: null,
    healAttempts: 0,
    maxHealAttempts: 3,
  };
}

/**
 * Pure transition function. Takes current context + event → new context.
 */
export function autonomousTransition(
  ctx: AutonomousContext,
  event: AutonomousEvent,
): AutonomousContext {
  const { state } = ctx;

  // Global events handled from any state
  if (event.type === "RESET") {
    return createInitialContext();
  }
  if (event.type === "CANCEL") {
    return { ...ctx, state: "cancelled", lastError: null };
  }
  if (event.type === "ERROR") {
    if (ctx.iterationCount >= ctx.maxIterations) {
      return { ...ctx, state: "failed", lastError: event.error };
    }
    return { ...ctx, state: "failed", lastError: event.error };
  }

  switch (state) {
    case "idle":
      if (event.type === "START_TASK") {
        return { ...ctx, state: "decomposing", lastError: null, healAttempts: 0 };
      }
      break;

    case "decomposing":
      if (event.type === "DECOMPOSITION_COMPLETE") {
        return {
          ...ctx,
          state: "executing_step",
          totalSteps: event.stepCount,
          currentStepIndex: 0,
          iterationCount: ctx.iterationCount + 1,
        };
      }
      if (event.type === "DECOMPOSITION_FAILED") {
        return { ...ctx, state: "failed", lastError: event.error };
      }
      break;

    case "executing_step":
      if (event.type === "STEP_STREAM_COMPLETE") {
        return { ...ctx, state: "validating" };
      }
      if (event.type === "PAUSE") {
        return { ...ctx, state: "awaiting_approval" };
      }
      break;

    case "validating":
      if (event.type === "VALIDATION_PASS") {
        return { ...ctx, state: "completing_step", healAttempts: 0 };
      }
      if (event.type === "VALIDATION_FAIL") {
        if (ctx.healAttempts < ctx.maxHealAttempts) {
          return {
            ...ctx,
            state: "self_healing",
            lastError: event.errors.join("; "),
            healAttempts: ctx.healAttempts + 1,
          };
        }
        // Max heal attempts reached, complete step anyway
        return { ...ctx, state: "completing_step", healAttempts: 0 };
      }
      if (event.type === "APPROVAL_REQUIRED") {
        return { ...ctx, state: "awaiting_approval" };
      }
      break;

    case "self_healing":
      if (event.type === "HEAL_COMPLETE") {
        return { ...ctx, state: "validating", iterationCount: ctx.iterationCount + 1 };
      }
      if (event.type === "HEAL_FAILED") {
        if (ctx.healAttempts < ctx.maxHealAttempts) {
          return {
            ...ctx,
            state: "self_healing",
            lastError: event.error,
            healAttempts: ctx.healAttempts + 1,
          };
        }
        return { ...ctx, state: "completing_step", lastError: event.error };
      }
      break;

    case "awaiting_approval":
      if (event.type === "APPROVE" || event.type === "RESUME") {
        return { ...ctx, state: "completing_step" };
      }
      if (event.type === "REJECT") {
        return { ...ctx, state: "rolling_back" };
      }
      break;

    case "completing_step":
      if (event.type === "STEP_COMPLETE") {
        const nextIndex = ctx.currentStepIndex + 1;
        if (nextIndex >= ctx.totalSteps) {
          return { ...ctx, state: "completed", currentStepIndex: nextIndex };
        }
        return {
          ...ctx,
          state: "executing_step",
          currentStepIndex: nextIndex,
          iterationCount: ctx.iterationCount + 1,
        };
      }
      if (event.type === "ALL_STEPS_DONE") {
        return { ...ctx, state: "completed" };
      }
      break;

    case "rolling_back":
      if (event.type === "ROLLBACK_COMPLETE") {
        // After rollback, go back to awaiting or failed
        return { ...ctx, state: "failed", lastError: "Step rolled back by user" };
      }
      break;

    case "completed":
    case "failed":
    case "cancelled":
      if (event.type === "START_TASK") {
        return {
          ...createInitialContext(),
          state: "decomposing",
        };
      }
      break;
  }

  // No valid transition — return unchanged
  return ctx;
}
