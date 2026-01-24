// Field Nine OS - Default Tool Implementations
// 에이전트가 사용할 기본 도구들

import { Tool, ToolRegistry, ToolParameter } from './agent-controller';

// ============================================================
// Web Search Tool
// ============================================================

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Search the web for information',
  category: 'web_search',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'The search query',
      required: true,
    },
    {
      name: 'numResults',
      type: 'number',
      description: 'Number of results to return',
      required: false,
      default: 5,
    },
  ],
  execute: async (params) => {
    const { query, numResults = 5 } = params as { query: string; numResults?: number };

    // Serper API 호출 (환경변수에서 API 키 가져옴)
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      // Mock response
      return {
        results: Array.from({ length: numResults }, (_, i) => ({
          title: `Result ${i + 1} for: ${query}`,
          url: `https://example.com/${i + 1}`,
          snippet: `This is a mock result for "${query}"`,
        })),
        source: 'mock',
      };
    }

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: numResults }),
    });

    const data = await response.json();
    return { results: data.organic || [], source: 'serper' };
  },
};

// ============================================================
// Database Query Tool (Supabase)
// ============================================================

export const databaseQueryTool: Tool = {
  name: 'database_query',
  description: 'Query the Supabase database for business data',
  category: 'database',
  parameters: [
    {
      name: 'table',
      type: 'string',
      description: 'The table to query',
      required: true,
    },
    {
      name: 'select',
      type: 'string',
      description: 'Columns to select',
      required: false,
      default: '*',
    },
    {
      name: 'filters',
      type: 'object',
      description: 'Filter conditions as key-value pairs',
      required: false,
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of rows',
      required: false,
      default: 100,
    },
  ],
  execute: async (params) => {
    const { table, select = '*', filters, limit = 100 } = params as {
      table: string;
      select?: string;
      filters?: Record<string, unknown>;
      limit?: number;
    };

    // Mock response (실제 사용시 Supabase 클라이언트 연결)
    return {
      data: Array.from({ length: Math.min(5, limit) }, (_, i) => ({
        id: i + 1,
        table,
        created_at: new Date().toISOString(),
      })),
      count: 5,
      source: 'mock',
    };
  },
};

// ============================================================
// API Call Tool
// ============================================================

export const apiCallTool: Tool = {
  name: 'api_call',
  description: 'Make HTTP requests to external APIs',
  category: 'api_call',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The API endpoint URL',
      required: true,
    },
    {
      name: 'method',
      type: 'string',
      description: 'HTTP method',
      required: false,
      default: 'GET',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    {
      name: 'headers',
      type: 'object',
      description: 'Request headers',
      required: false,
    },
    {
      name: 'body',
      type: 'object',
      description: 'Request body (for POST/PUT)',
      required: false,
    },
  ],
  execute: async (params) => {
    const { url, method = 'GET', headers = {}, body } = params as {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: Record<string, unknown>;
    };

    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };

    if (body && ['POST', 'PUT'].includes(method)) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    return {
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  },
};

// ============================================================
// Computation Tool
// ============================================================

export const computeTool: Tool = {
  name: 'compute',
  description: 'Perform mathematical calculations and data processing',
  category: 'computation',
  parameters: [
    {
      name: 'operation',
      type: 'string',
      description: 'The operation type',
      required: true,
      enum: ['math', 'statistics', 'format'],
    },
    {
      name: 'expression',
      type: 'string',
      description: 'The expression or format string',
      required: true,
    },
    {
      name: 'data',
      type: 'array',
      description: 'Input data array',
      required: false,
    },
  ],
  execute: async (params) => {
    const { operation, expression, data } = params as {
      operation: string;
      expression: string;
      data?: number[];
    };

    if (operation === 'math') {
      // Safe math evaluation (basic operations only)
      const safeExpression = expression.replace(/[^0-9+\-*/().%\s]/g, '');
      try {
        // Using Function instead of eval for slightly better safety
        const result = new Function(`return ${safeExpression}`)();
        return { result, type: typeof result };
      } catch (e) {
        return { error: String(e) };
      }
    }

    if (operation === 'statistics' && data && data.length > 0) {
      const sum = data.reduce((a, b) => a + b, 0);
      const mean = sum / data.length;
      const sorted = [...data].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];

      let variance = 0;
      if (data.length > 1) {
        variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (data.length - 1);
      }

      return {
        mean,
        median,
        stdev: Math.sqrt(variance),
        min: Math.min(...data),
        max: Math.max(...data),
        sum,
        count: data.length,
      };
    }

    if (operation === 'format') {
      // Simple template replacement
      let result = expression;
      if (data && Array.isArray(data)) {
        data.forEach((val, i) => {
          result = result.replace(new RegExp(`\\{${i}\\}`, 'g'), String(val));
        });
      }
      return { formatted: result };
    }

    return { error: `Unknown operation: ${operation}` };
  },
};

// ============================================================
// Notification Tool
// ============================================================

export const notifyTool: Tool = {
  name: 'notify',
  description: 'Send notifications via various channels',
  category: 'communication',
  parameters: [
    {
      name: 'channel',
      type: 'string',
      description: 'Notification channel',
      required: true,
      enum: ['slack', 'kakao', 'email', 'webhook'],
    },
    {
      name: 'message',
      type: 'string',
      description: 'The message to send',
      required: true,
    },
    {
      name: 'recipient',
      type: 'string',
      description: 'Recipient identifier',
      required: false,
    },
  ],
  execute: async (params) => {
    const { channel, message, recipient } = params as {
      channel: string;
      message: string;
      recipient?: string;
    };

    // Mock implementation
    console.log(`[Notify] ${channel}: ${message} -> ${recipient || 'default'}`);

    return {
      sent: true,
      channel,
      messagePreview: message.slice(0, 100),
      timestamp: new Date().toISOString(),
    };
  },
};

// ============================================================
// Google Sheets Tool
// ============================================================

export const googleSheetsTool: Tool = {
  name: 'google_sheets',
  description: 'Read/Write data from Google Sheets',
  category: 'database',
  parameters: [
    {
      name: 'operation',
      type: 'string',
      description: 'Operation to perform',
      required: true,
      enum: ['read', 'write', 'append'],
    },
    {
      name: 'spreadsheetId',
      type: 'string',
      description: 'Google Sheets spreadsheet ID',
      required: true,
    },
    {
      name: 'range',
      type: 'string',
      description: 'Cell range (e.g., Sheet1!A1:D10)',
      required: true,
    },
    {
      name: 'values',
      type: 'array',
      description: 'Values to write (for write/append)',
      required: false,
    },
  ],
  execute: async (params) => {
    const { operation, spreadsheetId, range, values } = params as {
      operation: string;
      spreadsheetId: string;
      range: string;
      values?: unknown[][];
    };

    // Mock implementation
    if (operation === 'read') {
      return {
        values: [
          ['Header1', 'Header2', 'Header3'],
          ['Value1', 'Value2', 'Value3'],
          ['Value4', 'Value5', 'Value6'],
        ],
        range,
        spreadsheetId,
        source: 'mock',
      };
    }

    return {
      updated: true,
      operation,
      range,
      spreadsheetId,
      rowsAffected: values?.length || 0,
    };
  },
};

// ============================================================
// Factory Function
// ============================================================

export function createDefaultTools(): ToolRegistry {
  const registry = new ToolRegistry();

  // Register all default tools with aliases
  registry.register(webSearchTool, ['search', 'google']);
  registry.register(databaseQueryTool, ['db', 'query', 'supabase']);
  registry.register(apiCallTool, ['http', 'fetch', 'request']);
  registry.register(computeTool, ['calc', 'math', 'stats']);
  registry.register(notifyTool, ['alert', 'send', 'message']);
  registry.register(googleSheetsTool, ['sheets', 'gsheets']);

  return registry;
}
