'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 51: WORLD-CLASS DOCUMENTATION UI
 * ═══════════════════════════════════════════════════════════════════════════════
 * Stripe/Tesla API 스타일 문서 시스템
 * Interactive Code Snippets (JS, Python, cURL)
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APIEndpoint, API_CATALOG } from '@/lib/api/nexus-connector';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type CodeLanguage = 'javascript' | 'python' | 'curl';

interface CodeSnippet {
  language: CodeLanguage;
  label: string;
  code: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CODE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

function generateCodeSnippets(api: APIEndpoint): CodeSnippet[] {
  const baseUrl = 'https://api.fieldnine.io/v2';
  const endpoint = api.endpoint;
  const requestBody = JSON.stringify(api.exampleRequest, null, 2);

  return [
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// ${api.nameKo} API
const response = await fetch('${baseUrl}${endpoint}', {
  method: '${api.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
    'X-Sandbox-Mode': 'true'  // 테스트 모드
  },${api.method !== 'GET' ? `
  body: JSON.stringify(${requestBody})` : ''}
});

const data = await response.json();
console.log(data);

// 예상 응답:
// ${JSON.stringify(api.exampleResponse, null, 2).split('\n').join('\n// ')}`,
    },
    {
      language: 'python',
      label: 'Python',
      code: `# ${api.nameKo} API
import requests

url = "${baseUrl}${endpoint}"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
    "X-Sandbox-Mode": "true"  # 테스트 모드
}
${api.method !== 'GET' ? `
payload = ${requestBody.split('\n').join('\n')}

response = requests.${api.method.toLowerCase()}(url, json=payload, headers=headers)` : `
response = requests.get(url, headers=headers)`}

data = response.json()
print(data)

# 예상 응답:
# ${JSON.stringify(api.exampleResponse, null, 2).split('\n').join('\n# ')}`,
    },
    {
      language: 'curl',
      label: 'cURL',
      code: `# ${api.nameKo} API
curl -X ${api.method} \\
  '${baseUrl}${endpoint}' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Sandbox-Mode: true'${api.method !== 'GET' ? ` \\
  -d '${JSON.stringify(api.exampleRequest)}'` : ''}

# 예상 응답:
# ${JSON.stringify(api.exampleResponse)}`,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYNTAX HIGHLIGHTER (Minimal)
// ═══════════════════════════════════════════════════════════════════════════════

function highlightCode(code: string, language: CodeLanguage): React.ReactNode[] {
  const lines = code.split('\n');

  const keywords: Record<CodeLanguage, string[]> = {
    javascript: ['const', 'let', 'var', 'await', 'async', 'function', 'return', 'if', 'else', 'true', 'false', 'null'],
    python: ['import', 'from', 'def', 'return', 'if', 'else', 'True', 'False', 'None', 'print', 'class'],
    curl: ['curl', '-X', '-H', '-d'],
  };

  const languageKeywords = keywords[language];

  return lines.map((line, i) => {
    // Comment lines
    if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
      return (
        <div key={i} className="text-white/40 italic">
          {line}
        </div>
      );
    }

    // Highlight strings
    let highlighted = line;
    const stringRegex = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = stringRegex.exec(line)) !== null) {
      // Add text before string
      if (match.index > lastIndex) {
        const beforeText = line.slice(lastIndex, match.index);
        // Highlight keywords in before text
        const keywordHighlighted = highlightKeywords(beforeText, languageKeywords);
        parts.push(<span key={`before-${i}-${match.index}`}>{keywordHighlighted}</span>);
      }
      // Add string
      parts.push(
        <span key={`string-${i}-${match.index}`} className="text-amber-400">
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < line.length) {
      const remainingText = line.slice(lastIndex);
      const keywordHighlighted = highlightKeywords(remainingText, languageKeywords);
      parts.push(<span key={`after-${i}`}>{keywordHighlighted}</span>);
    }

    return (
      <div key={i} className="min-h-[1.5em]">
        {parts.length > 0 ? parts : line || ' '}
      </div>
    );
  });
}

function highlightKeywords(text: string, keywords: string[]): React.ReactNode {
  const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'g');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (keywords.includes(part)) {
      return <span key={i} className="text-cyan-400">{part}</span>;
    }
    return part;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// COPY BUTTON
// ═══════════════════════════════════════════════════════════════════════════════

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
      }`}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-1"
          >
            <span>✓</span> Copied!
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-1"
          >
            <span>📋</span> Copy
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CODE PANEL (Interactive Code Snippets)
// ═══════════════════════════════════════════════════════════════════════════════

interface CodePanelProps {
  api: APIEndpoint;
}

export function CodePanel({ api }: CodePanelProps) {
  const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('javascript');
  const snippets = generateCodeSnippets(api);
  const activeSnippet = snippets.find(s => s.language === activeLanguage)!;

  return (
    <div className="bg-[#171717] rounded-2xl border border-white/10 overflow-hidden">
      {/* Language Tabs */}
      <div className="flex border-b border-white/10">
        {snippets.map((snippet) => (
          <motion.button
            key={snippet.language}
            onClick={() => setActiveLanguage(snippet.language)}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.98 }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              activeLanguage === snippet.language
                ? 'text-white bg-white/5 border-b-2 border-emerald-500'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <span className="mr-2">
              {snippet.language === 'javascript' ? '🟨' :
               snippet.language === 'python' ? '🐍' : '⚡'}
            </span>
            {snippet.label}
          </motion.button>
        ))}
      </div>

      {/* Code Block */}
      <div className="relative">
        {/* Copy Button */}
        <div className="absolute top-3 right-3 z-10">
          <CopyButton code={activeSnippet.code} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeLanguage}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 overflow-x-auto"
          >
            <pre className="font-mono text-sm text-white/90 leading-relaxed">
              {highlightCode(activeSnippet.code, activeLanguage)}
            </pre>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API DOCS PANEL (Stripe-style Two-Column Layout)
// ═══════════════════════════════════════════════════════════════════════════════

interface APIDocsPanelProps {
  api: APIEndpoint;
}

export function APIDocsPanel({ api }: APIDocsPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Documentation */}
      <div className="space-y-6 bg-[#F9F9F7] rounded-2xl p-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 font-mono text-sm rounded-lg font-bold ${
              api.method === 'GET' ? 'bg-emerald-100 text-emerald-700' :
              api.method === 'POST' ? 'bg-blue-100 text-blue-700' :
              api.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {api.method}
            </span>
            <code className="text-sm text-neutral-600 font-mono">{api.endpoint}</code>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">{api.nameKo}</h2>
          <p className="text-neutral-600 mt-2">{api.descriptionKo}</p>
        </div>

        {/* Authentication */}
        <div className="p-4 bg-white rounded-xl border border-neutral-200">
          <h3 className="font-bold text-neutral-800 mb-2">🔐 인증</h3>
          <p className="text-sm text-neutral-600">
            API Key를 <code className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-800 text-xs">Authorization: Bearer YOUR_API_KEY</code> 헤더에 포함하세요.
          </p>
        </div>

        {/* Request Parameters */}
        <div>
          <h3 className="font-bold text-neutral-800 mb-3">📥 요청 파라미터</h3>
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left p-3 font-medium text-neutral-600">파라미터</th>
                  <th className="text-left p-3 font-medium text-neutral-600">타입</th>
                  <th className="text-left p-3 font-medium text-neutral-600">필수</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(api.requestSchema).map(([key, value]) => (
                  <tr key={key} className="border-t border-neutral-100">
                    <td className="p-3">
                      <code className="text-neutral-800">{key}</code>
                    </td>
                    <td className="p-3 text-neutral-500">{String(value)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                        Required
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Response */}
        <div>
          <h3 className="font-bold text-neutral-800 mb-3">📤 응답</h3>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                200 OK
              </span>
              <span className="text-sm text-neutral-500">성공</span>
            </div>
            <pre className="text-xs text-neutral-600 bg-neutral-50 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(api.responseSchema, null, 2)}
            </pre>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <h3 className="font-bold text-amber-800 mb-2">⚡ Rate Limits</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {Object.entries(api.rateLimit).map(([tier, limit]) => (
              <div key={tier} className="bg-white rounded-lg p-2">
                <div className="text-xs text-amber-600 uppercase">{tier}</div>
                <div className="font-bold text-amber-800">{limit}/min</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Interactive Code */}
      <div className="space-y-4 sticky top-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">💻 코드 예제</h3>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            실시간 테스트 가능
          </div>
        </div>
        <CodePanel api={api} />

        {/* Try it Live Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl relative overflow-hidden group"
        >
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.5 }}
            style={{ opacity: 0.2 }}
          />
          <span className="relative flex items-center justify-center gap-2">
            <span>🚀</span>
            Sandbox에서 테스트하기
          </span>
        </motion.button>

        {/* Pricing Info */}
        <div className="bg-[#171717] rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-white/50 text-sm">호출당 비용</span>
            <span className="text-lg font-bold text-white">
              {api.pricePerCall} <span className="text-sm text-white/50">KAUS</span>
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-white/50 text-sm">월 무료 쿼터</span>
            <span className="text-emerald-400 font-bold">{api.monthlyFreeQuota.toLocaleString()} calls</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL DOCS VIEW (Sidebar + Content)
// ═══════════════════════════════════════════════════════════════════════════════

interface DocsViewProps {
  selectedAPI: APIEndpoint | null;
  onSelectAPI: (api: APIEndpoint) => void;
}

export function DocsView({ selectedAPI, onSelectAPI }: DocsViewProps) {
  const categories = [...new Set(API_CATALOG.map(api => api.category))];

  return (
    <div className="flex gap-6 min-h-[70vh]">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-4 bg-[#171717] rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-bold text-white">📚 API Reference</h3>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {categories.map(category => (
              <div key={category}>
                <div className="px-4 py-2 text-xs text-white/40 uppercase tracking-wider bg-white/5">
                  {category}
                </div>
                {API_CATALOG.filter(api => api.category === category).map(api => (
                  <motion.button
                    key={api.id}
                    onClick={() => onSelectAPI(api)}
                    whileHover={{ x: 4 }}
                    className={`w-full text-left px-4 py-3 text-sm transition-all ${
                      selectedAPI?.id === api.id
                        ? 'bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-500'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        api.method === 'GET' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {api.method}
                      </span>
                      <span className="truncate">{api.nameKo}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {selectedAPI ? (
            <motion.div
              key={selectedAPI.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <APIDocsPanel api={selectedAPI} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-20"
            >
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-bold text-white mb-2">API 문서에 오신 것을 환영합니다</h3>
              <p className="text-white/50">왼쪽 사이드바에서 API를 선택하세요</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DocsView;
