import { create } from "zustand";
import {
  type AutonomousContext,
  createInitialContext,
  autonomousTransition,
} from "../ai/autonomousStateMachine";

// ── Types ──────────────────────────────────────────────────────────────────────

export type TaskStepStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "skipped"
  | "rolled_back";

export interface TaskStep {
  id: string;
  index: number;
  title: string;
  description: string;
  filesAffected: string[];
  status: TaskStepStatus;
  filesModified: string[];
  gitSnapshotId: string | null;
  result: string | null;
  error: string | null;
  startedAt: number | null;
  completedAt: number | null;
  retryCount: number;
}

export type ApprovalMode = "auto" | "step" | "plan_only";

export interface AutonomousTask {
  id: string;
  userPrompt: string;
  steps: TaskStep[];
  currentStepIndex: number;
  totalTokensUsed: number;
  startedAt: number | null;
  completedAt: number | null;
  preExecutionCommitId: string | null;
}

// ── Store ──────────────────────────────────────────────────────────────────────

interface AutonomousState {
  currentTask: AutonomousTask | null;
  taskHistory: AutonomousTask[];
  approvalMode: ApprovalMode;
  maxRetries: number;
  maxSteps: number;
  isAutonomousMode: boolean;
  ctx: AutonomousContext;

  setCurrentTask: (v: AutonomousTask | null) => void;
  setApprovalMode: (v: ApprovalMode) => void;
  setIsAutonomousMode: (v: boolean) => void;
  dispatch: (event: Parameters<typeof autonomousTransition>[1]) => void;

  startTask: (prompt: string) => void;
  pauseTask: () => void;
  resumeTask: () => void;
  cancelTask: () => void;
  approveStep: (stepId: string) => void;
  rejectStep: (stepId: string) => void;
  rollbackAll: () => void;
  updateStep: (stepId: string, patch: Partial<TaskStep>) => void;
  completeStep: (stepId: string, result: string, filesModified: string[]) => void;
  failStep: (stepId: string, error: string) => void;
  setSteps: (steps: TaskStep[]) => void;
  reset: () => void;
}

export const useAutonomousStore = create<AutonomousState>((set, get) => ({
  currentTask: null,
  taskHistory: [],
  approvalMode: "auto",
  maxRetries: 3,
  maxSteps: 10,
  isAutonomousMode: false,
  ctx: createInitialContext(),

  setCurrentTask: (v) => set({ currentTask: v }),
  setApprovalMode: (v) => set({ approvalMode: v }),
  setIsAutonomousMode: (v) => set({ isAutonomousMode: v }),

  dispatch: (event) => {
    const newCtx = autonomousTransition(get().ctx, event);
    set({ ctx: newCtx });
  },

  startTask: (prompt) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const task: AutonomousTask = {
      id: taskId,
      userPrompt: prompt,
      steps: [],
      currentStepIndex: -1,
      totalTokensUsed: 0,
      startedAt: Date.now(),
      completedAt: null,
      preExecutionCommitId: null,
    };
    set({ currentTask: task, ctx: createInitialContext() });
    get().dispatch({ type: "START_TASK", prompt });
  },

  pauseTask: () => {
    get().dispatch({ type: "PAUSE" });
  },

  resumeTask: () => {
    get().dispatch({ type: "RESUME" });
  },

  cancelTask: () => {
    get().dispatch({ type: "CANCEL" });
    const task = get().currentTask;
    if (task) {
      const history = [...get().taskHistory, { ...task, completedAt: Date.now() }];
      set({ taskHistory: history.slice(-10), currentTask: null });
    }
  },

  approveStep: (_stepId) => {
    get().dispatch({ type: "APPROVE" });
  },

  rejectStep: (_stepId) => {
    get().dispatch({ type: "REJECT" });
  },

  rollbackAll: () => {
    get().dispatch({ type: "ROLLBACK" });
    const task = get().currentTask;
    if (task?.preExecutionCommitId) {
      // Rollback logic handled by the caller via VirtualGit
    }
  },

  updateStep: (stepId, patch) => {
    const task = get().currentTask;
    if (!task) return;
    const steps = task.steps.map((s) =>
      s.id === stepId ? { ...s, ...patch } : s,
    );
    set({ currentTask: { ...task, steps } });
  },

  completeStep: (stepId, result, filesModified) => {
    const task = get().currentTask;
    if (!task) return;
    const steps = task.steps.map((s) =>
      s.id === stepId
        ? { ...s, status: "completed" as const, result, filesModified, completedAt: Date.now() }
        : s,
    );
    set({ currentTask: { ...task, steps } });
    get().dispatch({ type: "STEP_COMPLETE" });
  },

  failStep: (stepId, error) => {
    const task = get().currentTask;
    if (!task) return;
    const steps = task.steps.map((s) =>
      s.id === stepId
        ? { ...s, status: "failed" as const, error, completedAt: Date.now() }
        : s,
    );
    set({ currentTask: { ...task, steps } });
  },

  setSteps: (steps) => {
    const task = get().currentTask;
    if (!task) return;
    set({ currentTask: { ...task, steps, currentStepIndex: 0 } });
  },

  reset: () => {
    set({ currentTask: null, ctx: createInitialContext() });
  },
}));
