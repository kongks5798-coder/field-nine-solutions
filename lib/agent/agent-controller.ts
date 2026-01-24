// ---------------------------------------------------------
// Field Nine OS: Agent Controller (TypeScript)
// Level 3 Autonomous AI Agent with ReAct Framework
// ---------------------------------------------------------

// ============================================================
// Type Definitions
// ============================================================

export enum AgentState {
  IDLE = 'idle',
  THINKING = 'thinking',
  ACTING = 'acting',
  OBSERVING = 'observing',
  REVIEWING = 'reviewing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
}

export interface ThoughtProcess {
  reasoning: string;
  confidence: number; // 0.0 ~ 1.0
  plan: string[];
  timestamp: Date;
}

export interface Action {
  actionId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  expectedOutcome: string;
}

export interface Observation {
  actionId: string;
  success: boolean;
  result: unknown;
  error?: string;
  executionTimeMs: number;
}

export interface Feedback {
  qualityScore: number; // 0.0 ~ 1.0
  issues: string[];
  suggestions: string[];
  shouldRetry: boolean;
  retryModifications?: Record<string, unknown>;
}

export interface AgentMemory {
  shortTerm: MemoryEntry[];
  longTerm: Record<string, unknown>;
  workingContext: Record<string, unknown>;
}

export interface MemoryEntry {
  thought?: ThoughtProcess;
  action?: Action;
  observation?: Observation;
  timestamp: string;
}

export interface AgentConfig {
  agentId: string;
  maxIterations?: number;
  qualityThreshold?: number;
  verbose?: boolean;
  onStateChange?: (state: AgentState) => void;
  onIteration?: (iteration: number, data: IterationData) => void;
}

export interface IterationData {
  thought: ThoughtProcess;
  action: Action;
  observation: Observation;
  feedback?: Feedback;
}

export interface ExecutionResult {
  taskId: string;
  agentId: string;
  success: boolean;
  result: unknown;
  error?: string;
  state: AgentState;
  iterations: number;
  executionHistory: MemoryEntry[];
  timestamp: string;
}

// ============================================================
// Tool Interface
// ============================================================

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
}

export interface Tool {
  name: string;
  description: string;
  category: 'database' | 'web_search' | 'api_call' | 'computation' | 'communication';
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

// ============================================================
// Tool Registry
// ============================================================

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private aliases: Map<string, string> = new Map();

  register(tool: Tool, aliases?: string[]): void {
    this.tools.set(tool.name, tool);
    if (aliases) {
      aliases.forEach(alias => this.aliases.set(alias, tool.name));
    }
  }

  unregister(name: string): void {
    this.tools.delete(name);
    // Remove aliases
    for (const [alias, toolName] of this.aliases.entries()) {
      if (toolName === name) {
        this.aliases.delete(alias);
      }
    }
  }

  getTool(name: string): Tool | undefined {
    const actualName = this.aliases.get(name) || name;
    return this.tools.get(actualName);
  }

  getToolDescriptions(): ToolSchema[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object' as const,
        properties: Object.fromEntries(
          tool.parameters.map(p => [
            p.name,
            {
              type: p.type,
              description: p.description,
              ...(p.enum ? { enum: p.enum } : {}),
              ...(p.default !== undefined ? { default: p.default } : {}),
            },
          ])
        ),
        required: tool.parameters.filter(p => p.required !== false).map(p => p.name),
      },
    }));
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

// ============================================================
// Quality Agent (Self-Criticism)
// ============================================================

export interface QualityCheck {
  criteria: string;
  passed: boolean;
  score: number;
  details: string;
  weight: number;
}

export class QualityAgent {
  private minQualityThreshold: number;
  private maxRetries: number;
  private retryCount: number = 0;
  private llmProvider?: LLMProvider;

  constructor(
    llmProvider?: LLMProvider,
    minQualityThreshold: number = 0.7,
    maxRetries: number = 3
  ) {
    this.llmProvider = llmProvider;
    this.minQualityThreshold = minQualityThreshold;
    this.maxRetries = maxRetries;
  }

  async review(
    task: string,
    thought: ThoughtProcess,
    action: Action,
    observation: Observation
  ): Promise<Feedback> {
    const checks: QualityCheck[] = [];

    // Basic checks
    checks.push(...this.runBasicChecks(task, thought, action, observation));

    // Calculate weighted score
    const qualityScore = this.calculateWeightedScore(checks);
    const issues = checks.filter(c => !c.passed).map(c => c.details);
    const suggestions = this.generateSuggestions(checks, task);

    // Determine retry
    const shouldRetry =
      qualityScore < this.minQualityThreshold && this.retryCount < this.maxRetries;

    if (shouldRetry) {
      this.retryCount++;
    } else {
      this.retryCount = 0;
    }

    return {
      qualityScore,
      issues,
      suggestions,
      shouldRetry,
      retryModifications: shouldRetry
        ? {
            retryNumber: this.retryCount,
            failedCriteria: checks.filter(c => !c.passed).map(c => c.criteria),
            improvementFocus: suggestions,
          }
        : undefined,
    };
  }

  private runBasicChecks(
    task: string,
    thought: ThoughtProcess,
    action: Action,
    observation: Observation
  ): QualityCheck[] {
    const checks: QualityCheck[] = [];

    // Completeness check
    const completenessPass =
      observation.success && observation.result !== null && observation.result !== undefined;

    checks.push({
      criteria: 'completeness',
      passed: completenessPass,
      score: completenessPass ? 1.0 : 0.0,
      details: completenessPass ? 'Result is complete' : 'Result is empty or failed',
      weight: 1.0,
    });

    // Relevance check
    const taskWords = new Set(task.toLowerCase().split(/\s+/));
    const outcomeWords = new Set(action.expectedOutcome.toLowerCase().split(/\s+/));
    const overlap = [...taskWords].filter(w => outcomeWords.has(w)).length;
    const relevanceScore = Math.min(overlap / Math.max(taskWords.size, 1), 1.0);

    checks.push({
      criteria: 'relevance',
      passed: relevanceScore >= 0.3,
      score: relevanceScore,
      details: `Relevance score: ${relevanceScore.toFixed(2)}`,
      weight: 1.2,
    });

    // Consistency check
    const actionInPlan = thought.plan.some(
      step =>
        step.toLowerCase().includes(action.toolName.toLowerCase()) ||
        step.toLowerCase().includes(action.expectedOutcome.toLowerCase())
    );
    const consistencyScore = actionInPlan ? 1.0 : 0.5;

    checks.push({
      criteria: 'consistency',
      passed: consistencyScore >= 0.5,
      score: consistencyScore,
      details: actionInPlan ? 'Action aligns with plan' : 'Action may deviate from plan',
      weight: 0.8,
    });

    // Performance check
    let performanceScore = 1.0;
    if (observation.executionTimeMs > 30000) performanceScore = 0.3;
    else if (observation.executionTimeMs > 10000) performanceScore = 0.6;
    else if (observation.executionTimeMs > 5000) performanceScore = 0.8;

    checks.push({
      criteria: 'performance',
      passed: performanceScore >= 0.5,
      score: performanceScore,
      details: `Execution time: ${observation.executionTimeMs.toFixed(0)}ms`,
      weight: 0.5,
    });

    // Safety check
    const dangerousPatterns = [
      /delete\s+all/i,
      /drop\s+table/i,
      /rm\s+-rf/i,
      /eval\(/i,
    ];
    const actionStr = JSON.stringify(action.parameters);
    const isSafe = !dangerousPatterns.some(p => p.test(actionStr));

    checks.push({
      criteria: 'safety',
      passed: isSafe,
      score: isSafe ? 1.0 : 0.0,
      details: isSafe ? 'Action appears safe' : 'Potentially dangerous action detected',
      weight: 2.0,
    });

    return checks;
  }

  private calculateWeightedScore(checks: QualityCheck[]): number {
    if (checks.length === 0) return 1.0;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const check of checks) {
      weightedSum += check.score * check.weight;
      totalWeight += check.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private generateSuggestions(checks: QualityCheck[], task: string): string[] {
    const suggestions: string[] = [];
    const failedChecks = checks.filter(c => !c.passed);

    for (const check of failedChecks) {
      switch (check.criteria) {
        case 'completeness':
          suggestions.push('Provide a more complete response');
          break;
        case 'relevance':
          suggestions.push(`Focus on the task: "${task.slice(0, 50)}..."`);
          break;
        case 'consistency':
          suggestions.push('Ensure actions align with your plan');
          break;
        case 'safety':
          suggestions.push('Use safer alternatives');
          break;
        case 'performance':
          suggestions.push('Optimize for faster execution');
          break;
      }
    }

    return suggestions.slice(0, 5);
  }

  reset(): void {
    this.retryCount = 0;
  }
}

// ============================================================
// LLM Provider Interface
// ============================================================

export interface LLMProvider {
  chat(messages: ChatMessage[]): Promise<string>;
  complete(prompt: string): Promise<string>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ============================================================
// Agent Controller
// ============================================================

export class AgentController {
  private config: Required<AgentConfig>;
  private state: AgentState = AgentState.IDLE;
  private memory: AgentMemory = {
    shortTerm: [],
    longTerm: {},
    workingContext: {},
  };
  private tools: ToolRegistry;
  private qualityAgent?: QualityAgent;
  private llmProvider?: LLMProvider;
  private currentTaskId?: string;

  constructor(
    config: AgentConfig,
    tools: ToolRegistry,
    llmProvider?: LLMProvider,
    qualityAgent?: QualityAgent
  ) {
    this.config = {
      agentId: config.agentId,
      maxIterations: config.maxIterations ?? 10,
      qualityThreshold: config.qualityThreshold ?? 0.7,
      verbose: config.verbose ?? true,
      onStateChange: config.onStateChange ?? (() => {}),
      onIteration: config.onIteration ?? (() => {}),
    };
    this.tools = tools;
    this.llmProvider = llmProvider;
    this.qualityAgent = qualityAgent;
  }

  async execute(task: string, context?: Record<string, unknown>): Promise<ExecutionResult> {
    this.currentTaskId = this.generateTaskId();
    this.setState(AgentState.THINKING);

    this.memory.workingContext = {
      task,
      context: context ?? {},
      iterations: 0,
      startTime: new Date().toISOString(),
    };

    this.log(`Task Started: ${task}`);

    let finalResult: unknown = null;

    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      this.memory.workingContext.iterations = iteration + 1;
      this.log(`\n--- Iteration ${iteration + 1}/${this.config.maxIterations} ---`);

      try {
        // 1. THOUGHT
        this.setState(AgentState.THINKING);
        const thought = await this.think(task, iteration);
        this.log(`Thought: ${thought.reasoning.slice(0, 100)}...`);

        // Check completion
        if (this.isTaskComplete(thought)) {
          this.log('Task determined complete');
          break;
        }

        // 2. ACTION
        this.setState(AgentState.ACTING);
        const action = await this.decideAction(thought);
        this.log(`Action: ${action.toolName}`);

        // 3. OBSERVATION
        this.setState(AgentState.OBSERVING);
        const observation = await this.executeAction(action);
        this.log(`Observation: success=${observation.success}`);

        // Record in memory
        this.addToMemory({ thought, action, observation });

        // 4. FEEDBACK (if quality agent enabled)
        let feedback: Feedback | undefined;
        if (this.qualityAgent && observation.success) {
          this.setState(AgentState.REVIEWING);
          feedback = await this.qualityAgent.review(task, thought, action, observation);
          this.log(`Quality Score: ${feedback.qualityScore.toFixed(2)}`);

          if (feedback.shouldRetry && feedback.qualityScore < this.config.qualityThreshold) {
            this.log(`Retry triggered: ${feedback.issues.join(', ')}`);
            this.memory.workingContext.retryContext = feedback.retryModifications;
            continue;
          }
        }

        // Emit iteration event
        this.config.onIteration(iteration, { thought, action, observation, feedback });

        if (observation.success) {
          finalResult = observation.result;
        }
      } catch (error) {
        this.log(`Error in iteration ${iteration + 1}: ${error}`);
        this.setState(AgentState.FAILED);
        return this.buildResponse(false, undefined, String(error));
      }
    }

    this.setState(AgentState.COMPLETED);
    return this.buildResponse(true, finalResult);
  }

  private async think(task: string, iteration: number): Promise<ThoughtProcess> {
    const recentContext = this.memory.shortTerm.slice(-5);
    const retryContext = this.memory.workingContext.retryContext as Record<string, unknown> | undefined;

    // Build thinking prompt
    const prompt = this.buildThinkingPrompt(task, recentContext, retryContext, iteration);

    // Call LLM (or return mock for testing)
    if (this.llmProvider) {
      const response = await this.llmProvider.complete(prompt);
      try {
        const parsed = JSON.parse(response);
        return {
          reasoning: parsed.reasoning ?? '',
          confidence: parsed.confidence ?? 0.5,
          plan: parsed.plan ?? [],
          timestamp: new Date(),
        };
      } catch {
        return this.mockThought();
      }
    }

    return this.mockThought();
  }

  private async decideAction(thought: ThoughtProcess): Promise<Action> {
    const toolDescriptions = this.tools.getToolDescriptions();

    const prompt = `Based on the reasoning: ${thought.reasoning}
Plan: ${JSON.stringify(thought.plan)}

Available tools: ${JSON.stringify(toolDescriptions, null, 2)}

Respond with JSON: { "tool_name": "...", "parameters": {...}, "expected_outcome": "..." }`;

    if (this.llmProvider) {
      const response = await this.llmProvider.complete(prompt);
      try {
        const parsed = JSON.parse(response);
        return {
          actionId: this.generateActionId(),
          toolName: parsed.tool_name ?? 'none',
          parameters: parsed.parameters ?? {},
          expectedOutcome: parsed.expected_outcome ?? '',
        };
      } catch {
        return this.mockAction();
      }
    }

    return this.mockAction();
  }

  private async executeAction(action: Action): Promise<Observation> {
    const startTime = Date.now();

    try {
      const tool = this.tools.getTool(action.toolName);

      if (!tool) {
        return {
          actionId: action.actionId,
          success: false,
          result: null,
          error: `Tool '${action.toolName}' not found`,
          executionTimeMs: Date.now() - startTime,
        };
      }

      const result = await tool.execute(action.parameters);

      return {
        actionId: action.actionId,
        success: true,
        result,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        actionId: action.actionId,
        success: false,
        result: null,
        error: String(error),
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  private isTaskComplete(thought: ThoughtProcess): boolean {
    if (thought.confidence > 0.9) {
      const planText = thought.plan.join(' ').toLowerCase();
      const completeWords = ['complete', 'done', 'finished', '완료'];
      return completeWords.some(word => planText.includes(word));
    }
    return false;
  }

  private buildThinkingPrompt(
    task: string,
    context: MemoryEntry[],
    retryContext: Record<string, unknown> | undefined,
    iteration: number
  ): string {
    let prompt = `You are an autonomous AI agent executing a task.

TASK: ${task}
ITERATION: ${iteration + 1}

`;

    if (context.length > 0) {
      prompt += `PREVIOUS ACTIONS:\n${JSON.stringify(context.slice(-3), null, 2)}\n\n`;
    }

    if (retryContext) {
      prompt += `IMPROVEMENT REQUIRED:\n${JSON.stringify(retryContext, null, 2)}\n\n`;
    }

    prompt += `Respond with JSON:
{
  "reasoning": "step-by-step reasoning",
  "confidence": 0.0 to 1.0,
  "plan": ["step 1", "step 2", ...]
}`;

    return prompt;
  }

  private addToMemory(entry: Omit<MemoryEntry, 'timestamp'>): void {
    this.memory.shortTerm.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    // Keep last 100 entries
    if (this.memory.shortTerm.length > 100) {
      this.memory.shortTerm = this.memory.shortTerm.slice(-100);
    }
  }

  private setState(state: AgentState): void {
    this.state = state;
    this.config.onStateChange(state);
  }

  private buildResponse(
    success: boolean,
    result?: unknown,
    error?: string
  ): ExecutionResult {
    return {
      taskId: this.currentTaskId!,
      agentId: this.config.agentId,
      success,
      result: result ?? null,
      error,
      state: this.state,
      iterations: (this.memory.workingContext.iterations as number) ?? 0,
      executionHistory: this.memory.shortTerm.slice(-10),
      timestamp: new Date().toISOString(),
    };
  }

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[${this.config.agentId}] ${message}`);
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now().toString(36)}`;
  }

  private generateActionId(): string {
    return Math.random().toString(36).slice(2, 10);
  }

  private mockThought(): ThoughtProcess {
    return {
      reasoning: 'Analyzing task and determining next steps',
      confidence: 0.7,
      plan: ['Gather information', 'Process data', 'Generate output'],
      timestamp: new Date(),
    };
  }

  private mockAction(): Action {
    return {
      actionId: this.generateActionId(),
      toolName: 'web_search',
      parameters: { query: 'test' },
      expectedOutcome: 'Search results',
    };
  }

  // State management methods
  pause(): void {
    this.setState(AgentState.PAUSED);
  }

  resume(): void {
    if (this.state === AgentState.PAUSED) {
      this.setState(AgentState.THINKING);
    }
  }

  getState(): {
    agentId: string;
    state: AgentState;
    taskId?: string;
    memorySize: number;
    workingContext: Record<string, unknown>;
  } {
    return {
      agentId: this.config.agentId,
      state: this.state,
      taskId: this.currentTaskId,
      memorySize: this.memory.shortTerm.length,
      workingContext: this.memory.workingContext,
    };
  }
}

// ============================================================
// Factory Functions
// ============================================================

export function createAgentController(options: {
  agentId: string;
  llmProvider?: LLMProvider;
  tools?: ToolRegistry;
  enableQualityAgent?: boolean;
  qualityThreshold?: number;
  maxIterations?: number;
  verbose?: boolean;
}): AgentController {
  const tools = options.tools ?? new ToolRegistry();

  const qualityAgent = options.enableQualityAgent
    ? new QualityAgent(options.llmProvider, options.qualityThreshold)
    : undefined;

  return new AgentController(
    {
      agentId: options.agentId,
      maxIterations: options.maxIterations,
      qualityThreshold: options.qualityThreshold,
      verbose: options.verbose,
    },
    tools,
    options.llmProvider,
    qualityAgent
  );
}
