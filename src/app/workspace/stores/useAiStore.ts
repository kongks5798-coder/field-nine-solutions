import { create } from "zustand";
import type { AiMsg } from "../workspace.constants";
import { AI_HIST_KEY, LM_MODEL_KEY } from "../workspace.constants";
import type { LabAgent } from "@/lib/lab-agents";
import type { AgentContext, AgentEvent } from "../ai/agentStateMachine";
import { createInitialContext, transition, deriveAgentPhase } from "../ai/agentStateMachine";

interface AiState {
  aiInput: string;
  aiMsgs: AiMsg[];
  aiLoading: boolean;
  streamingText: string;
  /** @deprecated Use agentContext.state instead. Kept for backward compat. */
  agentPhase: "planning" | "coding" | "reviewing" | null;
  aiMode: string;
  selectedModelId: string;
  imageAtt: { base64: string; mime: string; preview: string } | null;
  isRecording: boolean;
  autoFixCountdown: number | null;
  autoTesting: boolean;
  showTemplates: boolean;
  showCompare: boolean;
  comparePrompt: string;
  showTeamPanel: boolean;
  teamAgents: LabAgent[];

  /** Structured agent state machine context */
  agentContext: AgentContext;

  setAiInput: (v: string | ((prev: string) => string)) => void;
  setAiMsgs: (v: AiMsg[] | ((prev: AiMsg[]) => AiMsg[])) => void;
  setAiLoading: (v: boolean) => void;
  setStreamingText: (v: string) => void;
  /** @deprecated Use dispatchAgent instead. Kept for backward compat. */
  setAgentPhase: (v: "planning" | "coding" | "reviewing" | null) => void;
  setAiMode: (v: string) => void;
  setSelectedModelId: (v: string) => void;
  setImageAtt: (v: { base64: string; mime: string; preview: string } | null) => void;
  setIsRecording: (v: boolean) => void;
  setAutoFixCountdown: (v: number | null) => void;
  setAutoTesting: (v: boolean) => void;
  setShowTemplates: (v: boolean) => void;
  setShowCompare: (v: boolean) => void;
  setComparePrompt: (v: string) => void;
  setShowTeamPanel: (v: boolean) => void;
  setTeamAgents: (v: LabAgent[]) => void;

  /** Dispatch an event to the agent state machine */
  dispatchAgent: (event: AgentEvent) => void;

  handleSelectModel: (modelId: string, provider: string) => void;
  persistAiMsgs: () => void;
}

export const useAiStore = create<AiState>((set, get) => ({
  aiInput: "",
  aiMsgs: typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem(AI_HIST_KEY) ?? "[]"); } catch { return []; } })()
    : [],
  aiLoading: false,
  streamingText: "",
  agentPhase: null,
  aiMode: "anthropic",
  selectedModelId: typeof window !== "undefined"
    ? localStorage.getItem(LM_MODEL_KEY) || "claude-sonnet-4-6"
    : "claude-sonnet-4-6",
  imageAtt: null,
  isRecording: false,
  autoFixCountdown: null,
  autoTesting: false,
  showTemplates: false,
  showCompare: false,
  comparePrompt: "",
  showTeamPanel: false,
  teamAgents: [],

  agentContext: createInitialContext(),

  setAiInput: (v) => set((s) => ({ aiInput: typeof v === "function" ? v(s.aiInput) : v })),
  setAiMsgs: (v) => set((s) => ({ aiMsgs: typeof v === "function" ? v(s.aiMsgs) : v })),
  setAiLoading: (v) => set({ aiLoading: v }),
  setStreamingText: (v) => set({ streamingText: v }),
  setAgentPhase: (v) => set({ agentPhase: v }),
  setAiMode: (v) => set({ aiMode: v }),
  setSelectedModelId: (v) => set({ selectedModelId: v }),
  setImageAtt: (v) => set({ imageAtt: v }),
  setIsRecording: (v) => set({ isRecording: v }),
  setAutoFixCountdown: (v) => set({ autoFixCountdown: v }),
  setAutoTesting: (v) => set({ autoTesting: v }),
  setShowTemplates: (v) => set({ showTemplates: v }),
  setShowCompare: (v) => set({ showCompare: v }),
  setComparePrompt: (v) => set({ comparePrompt: v }),
  setShowTeamPanel: (v) => set({ showTeamPanel: v }),
  setTeamAgents: (v) => set({ teamAgents: v }),

  dispatchAgent: (event) => {
    const { agentContext } = get();
    const nextCtx = transition(agentContext, event);
    set({
      agentContext: nextCtx,
      // Keep agentPhase in sync (backward compat)
      agentPhase: deriveAgentPhase(nextCtx.state),
    });
  },

  handleSelectModel: (modelId, provider) => {
    set({ selectedModelId: modelId, aiMode: provider });
    try { localStorage.setItem(LM_MODEL_KEY, modelId); } catch {}
  },

  persistAiMsgs: () => {
    const { aiMsgs } = get();
    try { localStorage.setItem(AI_HIST_KEY, JSON.stringify(aiMsgs.slice(-60))); } catch {}
  },
}));
