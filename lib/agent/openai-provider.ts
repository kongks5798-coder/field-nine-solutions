// ---------------------------------------------------------
// Field Nine OS: OpenAI Provider (TypeScript)
// GPT-4o Integration with Streaming & Error Handling
// ---------------------------------------------------------

import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

// ============================================================
// Type Definitions
// ============================================================

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  name?: string;
  toolCalls?: ToolCallData[];
  toolCallId?: string;
}

export interface ToolCallData {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMResponse {
  content: string | null;
  toolCalls: ToolCallData[];
  finishReason: string;
  usage: TokenUsage;
  model: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  toolCalls?: ToolCallData[];
  finishReason?: string;
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
// Error Classes
// ============================================================

export class LLMError extends Error {
  constructor(
    message: string,
    public errorType: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export class TokenLimitError extends LLMError {
  constructor(
    message: string,
    public usedTokens: number = 0,
    public maxTokens: number = 0
  ) {
    super(message, 'token_limit', true);
    this.name = 'TokenLimitError';
  }
}

export class RateLimitError extends LLMError {
  constructor(message: string, public retryAfter: number = 60) {
    super(message, 'rate_limit', true);
    this.name = 'RateLimitError';
  }
}

// ============================================================
// OpenAI Provider
// ============================================================

export interface OpenAIProviderConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  onTokenUsage?: (usage: TokenUsage) => void;
  onError?: (error: LLMError) => void;
  onStreamChunk?: (content: string) => void;
}

export class OpenAIProvider {
  private client: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens?: number;
  private maxRetries: number;
  private retryDelay: number;

  // Callbacks
  private onTokenUsage?: (usage: TokenUsage) => void;
  private onError?: (error: LLMError) => void;
  private onStreamChunk?: (content: string) => void;

  // Usage tracking
  public totalTokensUsed: number = 0;
  public sessionCost: number = 0;

  // Model token limits
  private static readonly MODEL_TOKEN_LIMITS: Record<string, number> = {
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-4-turbo': 128000,
    'gpt-4': 8192,
    'gpt-3.5-turbo': 16385,
  };

  constructor(config: OpenAIProviderConfig = {}) {
    this.model = config.model ?? 'gpt-4o';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    this.onTokenUsage = config.onTokenUsage;
    this.onError = config.onError;
    this.onStreamChunk = config.onStreamChunk;

    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout ?? 60000,
      maxRetries: 0, // 직접 재시도 구현
    });
  }

  /**
   * 채팅 완성 API 호출
   */
  async chat(
    messages: ChatMessage[],
    tools?: ToolSchema[],
    options: { model?: string; temperature?: number; maxTokens?: number } = {}
  ): Promise<LLMResponse> {
    const formattedMessages = this.formatMessages(messages);
    const formattedTools = tools?.map(t => this.convertToolSchema(t));

    const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
      model: options.model ?? this.model,
      messages: formattedMessages,
      temperature: options.temperature ?? this.temperature,
    };

    if (this.maxTokens || options.maxTokens) {
      requestParams.max_tokens = options.maxTokens ?? this.maxTokens;
    }

    if (formattedTools && formattedTools.length > 0) {
      requestParams.tools = formattedTools;
      requestParams.tool_choice = 'auto';
    }

    let lastError: LLMError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create(requestParams);
        return this.parseResponse(response);
      } catch (error) {
        lastError = this.handleError(error as Error);

        if (!lastError.retryable || attempt >= this.maxRetries) {
          throw lastError;
        }

        const waitTime =
          lastError instanceof RateLimitError
            ? lastError.retryAfter * 1000
            : this.retryDelay * (attempt + 1);

        await this.sleep(waitTime);
      }
    }

    throw lastError!;
  }

  /**
   * 스트리밍 채팅 API 호출
   */
  async *chatStream(
    messages: ChatMessage[],
    tools?: ToolSchema[],
    options: { model?: string; temperature?: number; maxTokens?: number } = {}
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const formattedMessages = this.formatMessages(messages);
    const formattedTools = tools?.map(t => this.convertToolSchema(t));

    const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
      model: options.model ?? this.model,
      messages: formattedMessages,
      temperature: options.temperature ?? this.temperature,
      stream: true,
    };

    if (this.maxTokens || options.maxTokens) {
      requestParams.max_tokens = options.maxTokens ?? this.maxTokens;
    }

    if (formattedTools && formattedTools.length > 0) {
      requestParams.tools = formattedTools;
      requestParams.tool_choice = 'auto';
    }

    try {
      const stream = await this.client.chat.completions.create(requestParams);

      let collectedToolCalls: Map<number, { id: string; name: string; arguments: string }> =
        new Map();

      for await (const chunk of stream as AsyncIterable<ChatCompletionChunk>) {
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        if (delta?.content) {
          if (this.onStreamChunk) {
            this.onStreamChunk(delta.content);
          }

          yield {
            content: delta.content,
            isComplete: false,
          };
        }

        // Tool calls 수집
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index;
            if (!collectedToolCalls.has(idx)) {
              collectedToolCalls.set(idx, {
                id: tc.id ?? '',
                name: tc.function?.name ?? '',
                arguments: '',
              });
            }
            const existing = collectedToolCalls.get(idx)!;
            if (tc.function?.arguments) {
              existing.arguments += tc.function.arguments;
            }
          }
        }

        // 완료 체크
        if (finishReason) {
          const toolCalls: ToolCallData[] = [];

          for (const tcData of collectedToolCalls.values()) {
            try {
              const args = tcData.arguments ? JSON.parse(tcData.arguments) : {};
              toolCalls.push({
                id: tcData.id,
                name: tcData.name,
                arguments: args,
              });
            } catch {
              toolCalls.push({
                id: tcData.id,
                name: tcData.name,
                arguments: {},
              });
            }
          }

          yield {
            content: '',
            isComplete: true,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            finishReason,
          };
        }
      }
    } catch (error) {
      const llmError = this.handleError(error as Error);
      throw llmError;
    }
  }

  /**
   * 도구 스키마를 OpenAI Function Calling 형식으로 변환
   */
  convertToolSchema(schema: ToolSchema): ChatCompletionTool {
    return {
      type: 'function',
      function: {
        name: schema.name,
        description: schema.description,
        parameters: schema.parameters,
      },
    };
  }

  private formatMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
    return messages.map(msg => {
      const base: ChatCompletionMessageParam = {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      };

      if (msg.name) {
        (base as any).name = msg.name;
      }

      if (msg.toolCalls && msg.role === 'assistant') {
        (base as any).tool_calls = msg.toolCalls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        }));
      }

      if (msg.toolCallId && msg.role === 'tool') {
        (base as any).tool_call_id = msg.toolCallId;
      }

      return base;
    });
  }

  private parseResponse(response: ChatCompletion): LLMResponse {
    const message = response.choices[0].message;
    const finishReason = response.choices[0].finish_reason;

    const toolCalls: ToolCallData[] = [];
    if (message.tool_calls) {
      for (const tc of message.tool_calls) {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: args,
          });
        } catch {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: {},
          });
        }
      }
    }

    const usage: TokenUsage = {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    };

    this.totalTokensUsed += usage.totalTokens;
    this.updateCost(usage);

    if (this.onTokenUsage) {
      this.onTokenUsage(usage);
    }

    return {
      content: message.content,
      toolCalls,
      finishReason,
      usage,
      model: response.model,
    };
  }

  private handleError(error: Error): LLMError {
    const message = error.message || String(error);

    // Rate limit
    if (message.includes('rate_limit') || message.includes('429')) {
      const retryAfter = this.extractRetryAfter(message);
      const llmError = new RateLimitError(message, retryAfter);
      if (this.onError) this.onError(llmError);
      return llmError;
    }

    // Token limit
    if (message.includes('maximum context length') || message.includes('context_length_exceeded')) {
      const llmError = new TokenLimitError(
        message,
        0,
        OpenAIProvider.MODEL_TOKEN_LIMITS[this.model] ?? 0
      );
      if (this.onError) this.onError(llmError);
      return llmError;
    }

    // Timeout
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      const llmError = new LLMError(message, 'timeout', true);
      if (this.onError) this.onError(llmError);
      return llmError;
    }

    // Generic error
    const llmError = new LLMError(message, 'api_error', false);
    if (this.onError) this.onError(llmError);
    return llmError;
  }

  private extractRetryAfter(errorMessage: string): number {
    const match = errorMessage.match(/retry after (\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return 60;
  }

  private updateCost(usage: TokenUsage): void {
    // GPT-4o pricing (approximate)
    const inputCostPer1k = 0.005;
    const outputCostPer1k = 0.015;

    const inputCost = (usage.promptTokens / 1000) * inputCostPer1k;
    const outputCost = (usage.completionTokens / 1000) * outputCostPer1k;

    this.sessionCost += inputCost + outputCost;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getUsageStats(): { totalTokens: number; estimatedCostUsd: number; model: string } {
    return {
      totalTokens: this.totalTokensUsed,
      estimatedCostUsd: Math.round(this.sessionCost * 10000) / 10000,
      model: this.model,
    };
  }

  resetUsageStats(): void {
    this.totalTokensUsed = 0;
    this.sessionCost = 0;
  }
}

// ============================================================
// Thought Streamer
// ============================================================

export class ThoughtStreamer {
  private collectedContent: string = '';
  private started: boolean = false;

  constructor(
    private onChunk?: (content: string) => void,
    private onComplete?: (fullContent: string) => void,
    private onToolCall?: (toolCall: ToolCallData) => void,
    private prefix: string = '💭 ',
    private showTimestamp: boolean = true
  ) {}

  process(chunk: StreamChunk): string {
    if (!this.started && chunk.content) {
      this.started = true;
      if (this.showTimestamp) {
        const timestamp = new Date().toLocaleTimeString();
        const header = `\n[${timestamp}] ${this.prefix}`;
        if (this.onChunk) this.onChunk(header);
      } else {
        if (this.onChunk) this.onChunk(`\n${this.prefix}`);
      }
    }

    if (chunk.content) {
      this.collectedContent += chunk.content;
      if (this.onChunk) this.onChunk(chunk.content);
    }

    if (chunk.isComplete) {
      this.started = false;

      if (this.onComplete) {
        this.onComplete(this.collectedContent);
      }

      if (chunk.toolCalls && this.onToolCall) {
        for (const tc of chunk.toolCalls) {
          this.onToolCall(tc);
        }
      }

      const result = this.collectedContent;
      this.collectedContent = '';
      return result;
    }

    return '';
  }

  reset(): void {
    this.collectedContent = '';
    this.started = false;
  }
}

// ============================================================
// Error Recovery Handler
// ============================================================

export interface RecoveryDecision {
  shouldRetry: boolean;
  strategy: string;
  modifications: Record<string, unknown>;
  waitSeconds?: number;
}

export class ErrorRecoveryHandler {
  private errorHistory: Array<{
    errorType: string;
    message: string;
    timestamp: number;
  }> = [];

  async handleError(error: LLMError, context: Record<string, unknown>): Promise<RecoveryDecision> {
    this.errorHistory.push({
      errorType: error.errorType,
      message: error.message,
      timestamp: Date.now(),
    });

    if (error instanceof TokenLimitError) {
      return {
        shouldRetry: true,
        strategy: 'reduce_context',
        modifications: {
          action: 'truncate_history',
          keepLastN: 5,
          summarizeOld: true,
        },
      };
    }

    if (error instanceof RateLimitError) {
      return {
        shouldRetry: true,
        strategy: 'wait_and_retry',
        modifications: {
          action: 'delay',
        },
        waitSeconds: error.retryAfter,
      };
    }

    return {
      shouldRetry: error.retryable,
      strategy: 'default',
      modifications: {},
    };
  }

  getErrorStats(): {
    totalErrors: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    for (const err of this.errorHistory) {
      byType[err.errorType] = (byType[err.errorType] ?? 0) + 1;
    }

    return {
      totalErrors: this.errorHistory.length,
      byType,
    };
  }
}

// ============================================================
// Agent LLM Interface
// ============================================================

export interface AgentLLMInterfaceConfig {
  apiKey?: string;
  model?: string;
  enableStreaming?: boolean;
  verbose?: boolean;
  onThought?: (content: string) => void;
  onToolCall?: (toolCall: ToolCallData) => void;
  onError?: (error: LLMError) => void;
}

export class AgentLLMInterface {
  public provider: OpenAIProvider;
  private errorHandler: ErrorRecoveryHandler;
  private thoughtStreamer: ThoughtStreamer;
  private enableStreaming: boolean;
  private verbose: boolean;
  private onThought?: (content: string) => void;

  private systemPrompt = `You are an autonomous AI agent operating within the Field Nine OS.
Your task is to reason step-by-step and execute actions using available tools.

When thinking, always structure your response as JSON:
{
    "reasoning": "Your step-by-step analysis",
    "confidence": 0.0-1.0,
    "plan": ["step1", "step2", ...],
    "next_action": "The tool to use next or 'complete' if done"
}

Always think in Korean when the task is in Korean.`;

  constructor(config: AgentLLMInterfaceConfig = {}) {
    this.enableStreaming = config.enableStreaming ?? true;
    this.verbose = config.verbose ?? true;
    this.onThought = config.onThought;

    this.provider = new OpenAIProvider({
      apiKey: config.apiKey,
      model: config.model ?? 'gpt-4o',
      onError: config.onError,
      onStreamChunk: this.enableStreaming ? content => this.handleStreamChunk(content) : undefined,
    });

    this.errorHandler = new ErrorRecoveryHandler();

    this.thoughtStreamer = new ThoughtStreamer(
      content => this.handleThoughtChunk(content),
      () => this.handleThoughtComplete(),
      config.onToolCall
    );
  }

  async think(task: string, context?: ChatMessage[]): Promise<LLMResponse> {
    const messages: ChatMessage[] = [{ role: 'system', content: this.systemPrompt }];

    if (context) {
      messages.push(...context);
    }

    messages.push({ role: 'user', content: task });

    if (this.enableStreaming) {
      return this.streamResponse(messages);
    }

    return this.provider.chat(messages);
  }

  async thinkWithTools(
    task: string,
    tools: ToolSchema[],
    context?: ChatMessage[]
  ): Promise<LLMResponse> {
    const messages: ChatMessage[] = [{ role: 'system', content: this.systemPrompt }];

    if (context) {
      messages.push(...context);
    }

    messages.push({ role: 'user', content: task });

    try {
      if (this.enableStreaming) {
        return this.streamResponse(messages, tools);
      }

      return this.provider.chat(messages, tools);
    } catch (error) {
      if (error instanceof LLMError) {
        const recovery = await this.errorHandler.handleError(error, { task });

        if (recovery.shouldRetry) {
          if (recovery.strategy === 'reduce_context') {
            const reducedContext = context?.slice(-5);
            return this.thinkWithTools(task, tools, reducedContext);
          }

          if (recovery.strategy === 'wait_and_retry' && recovery.waitSeconds) {
            await new Promise(resolve => setTimeout(resolve, recovery.waitSeconds! * 1000));
            return this.thinkWithTools(task, tools, context);
          }
        }
      }

      throw error;
    }
  }

  private async streamResponse(messages: ChatMessage[], tools?: ToolSchema[]): Promise<LLMResponse> {
    let collectedContent = '';
    let finalToolCalls: ToolCallData[] = [];
    let finalFinishReason = '';

    for await (const chunk of this.provider.chatStream(messages, tools)) {
      this.thoughtStreamer.process(chunk);

      if (chunk.content) {
        collectedContent += chunk.content;
      }

      if (chunk.isComplete) {
        if (chunk.toolCalls) {
          finalToolCalls = chunk.toolCalls;
        }
        finalFinishReason = chunk.finishReason ?? 'stop';
      }
    }

    return {
      content: collectedContent,
      toolCalls: finalToolCalls,
      finishReason: finalFinishReason,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      model: this.provider.getUsageStats().model,
    };
  }

  private handleStreamChunk(content: string): void {
    if (this.verbose) {
      process.stdout.write(content);
    }
  }

  private handleThoughtChunk(content: string): void {
    if (this.onThought) {
      this.onThought(content);
    }
  }

  private handleThoughtComplete(): void {
    if (this.verbose) {
      console.log();
    }
  }

  getStats(): {
    usage: ReturnType<OpenAIProvider['getUsageStats']>;
    errors: ReturnType<ErrorRecoveryHandler['getErrorStats']>;
  } {
    return {
      usage: this.provider.getUsageStats(),
      errors: this.errorHandler.getErrorStats(),
    };
  }
}
