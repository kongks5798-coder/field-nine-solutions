import { create } from "zustand";
import {
  type AutonomousContext,
  createInitialContext,
  autonomousTransition,
} from "../ai/autonomousStateMachine";
import {
  buildDecompositionPrompt,
  parseDecompositionResponse,
  buildStepPrompt,
  buildSelfHealPrompt,
  validateStepOutput,
  type TaskStepDef,
} from "../ai/autonomousLoop";

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

  /** Build the decomposition prompt for the AI */
  getDecompositionPrompt: (files: Record<string, { content: string }>) => string | null;
  /** Parse AI decomposition response and create steps */
  applyDecomposition: (aiResponse: string) => TaskStep[];
  /** Build prompt for executing current step */
  getStepPrompt: (files: Record<string, { content: string }>) => string | null;
  /** Build self-heal prompt when errors occur */
  getSelfHealPrompt: (errors: string[], files: Record<string, { content: string }>) => string | null;
  /** Validate step output files */
  validateCurrentStep: (generatedFiles: Record<string, string>, consoleErrors: string[]) => string[];
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

  getDecompositionPrompt: (files) => {
    const task = get().currentTask;
    if (!task) return null;
    const fileNames = Object.keys(files);
    const fileContext = fileNames.slice(0, 5).map(n => `--- ${n} ---\n${files[n].content.slice(0, 500)}`).join("\n\n");
    return buildDecompositionPrompt(task.userPrompt, fileNames, fileContext);
  },

  applyDecomposition: (aiResponse) => {
    const defs: TaskStepDef[] = parseDecompositionResponse(aiResponse);
    const steps: TaskStep[] = defs.map((d, i) => ({
      id: `step-${Date.now()}-${i}`,
      index: i,
      title: d.title,
      description: d.description,
      filesAffected: d.filesAffected,
      status: "pending",
      filesModified: [],
      gitSnapshotId: null,
      result: null,
      error: null,
      startedAt: null,
      completedAt: null,
      retryCount: 0,
    }));
    get().setSteps(steps);
    get().dispatch({ type: "DECOMPOSITION_COMPLETE", stepCount: steps.length });
    return steps;
  },

  getStepPrompt: (files) => {
    const task = get().currentTask;
    if (!task || task.currentStepIndex < 0) return null;
    const step = task.steps[task.currentStepIndex];
    if (!step) return null;
    const prevResults = task.steps
      .filter(s => s.status === "completed" && s.result)
      .map(s => s.result!);
    const fileNames = Object.keys(files);
    const fileContext = fileNames.slice(0, 8).map(n => `--- ${n} ---\n${files[n].content.slice(0, 800)}`).join("\n\n");
    const def: TaskStepDef = { title: step.title, description: step.description, filesAffected: step.filesAffected };
    return buildStepPrompt(def, step.index, task.steps.length, prevResults, fileContext);
  },

  getSelfHealPrompt: (errors, files) => {
    const fileNames = Object.keys(files);
    const fileContext = fileNames.slice(0, 8).map(n => `--- ${n} ---\n${files[n].content.slice(0, 800)}`).join("\n\n");
    return buildSelfHealPrompt(errors, fileContext);
  },

  validateCurrentStep: (generatedFiles, consoleErrors) => {
    return validateStepOutput(generatedFiles, consoleErrors);
  },
}));
