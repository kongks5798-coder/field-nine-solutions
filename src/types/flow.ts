export interface FlowNode {
  id: string;
  type: 'trigger' | 'http_request' | 'ai_chat' | 'send_email' | 'transform' | 'condition';
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface FlowExecutionResult {
  nodeId: string;
  status: 'success' | 'error' | 'skipped';
  output: unknown;
  error?: string;
  duration: number;
}

export interface FlowRunResult {
  success: boolean;
  results: FlowExecutionResult[];
  totalDuration: number;
}
