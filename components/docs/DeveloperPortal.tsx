/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: DEVELOPER PORTAL
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Getting started guide and developer documentation
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface CodeExample {
  language: string;
  code: string;
}

const codeExamples: Record<string, CodeExample[]> = {
  authentication: [
    {
      language: 'cURL',
      code: `curl -X POST https://fieldnine.io/api/auth/session \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "..."}'`,
    },
    {
      language: 'JavaScript',
      code: `const response = await fetch('https://fieldnine.io/api/auth/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const session = await response.json();`,
    },
    {
      language: 'Python',
      code: `import requests

response = requests.post(
    'https://fieldnine.io/api/auth/session',
    json={'email': 'user@example.com', 'password': '...'}
)
session = response.json()`,
    },
  ],
  wallet: [
    {
      language: 'cURL',
      code: `curl https://fieldnine.io/api/wallet/balance \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
    },
    {
      language: 'JavaScript',
      code: `const response = await fetch('https://fieldnine.io/api/wallet/balance', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
const { balance } = await response.json();`,
    },
    {
      language: 'Python',
      code: `import requests

response = requests.get(
    'https://fieldnine.io/api/wallet/balance',
    headers={'Authorization': f'Bearer {token}'}
)
balance = response.json()`,
    },
  ],
  webhook: [
    {
      language: 'JavaScript',
      code: `// Webhook handler example (Next.js)
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-signature');

  // Verify webhook signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSig) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Handle event
  switch (event.type) {
    case 'payment.completed':
      // Handle payment
      break;
    case 'wallet.updated':
      // Handle wallet update
      break;
  }

  return NextResponse.json({ received: true });
}`,
    },
  ],
};

export default function DeveloperPortal() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [activeLanguage, setActiveLanguage] = useState<Record<string, string>>({
    authentication: 'JavaScript',
    wallet: 'JavaScript',
    webhook: 'JavaScript',
  });

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'authentication', title: 'Authentication', icon: '🔐' },
    { id: 'wallet', title: 'Wallet API', icon: '💰' },
    { id: 'webhook', title: 'Webhooks', icon: '🔔' },
    { id: 'rate-limits', title: 'Rate Limits', icon: '⚡' },
    { id: 'errors', title: 'Error Handling', icon: '⚠️' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#111]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold">Developer Portal</h1>
          <p className="text-gray-400 mt-2 text-lg">
            Build powerful integrations with Field Nine Solutions API
          </p>
          <div className="flex gap-4 mt-6">
            <a
              href="/admin/docs"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
            >
              API Reference
            </a>
            <a
              href="/api/docs/openapi"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              OpenAPI Spec
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <nav className="w-64 flex-shrink-0">
          <div className="sticky top-8 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                  activeSection === section.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-4xl">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Getting Started */}
            {activeSection === 'getting-started' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Getting Started</h2>
                <p className="text-gray-300 text-lg">
                  Welcome to the Field Nine Solutions API. This guide will help you get started
                  with integrating our services into your application.
                </p>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Quick Start</h3>
                  <ol className="space-y-4 text-gray-300">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </span>
                      <div>
                        <strong>Create an account</strong>
                        <p className="text-gray-400 text-sm mt-1">
                          Sign up at fieldnine.io to get your API credentials
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </span>
                      <div>
                        <strong>Get your API key</strong>
                        <p className="text-gray-400 text-sm mt-1">
                          Navigate to Settings → API Keys to generate your credentials
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </span>
                      <div>
                        <strong>Make your first request</strong>
                        <p className="text-gray-400 text-sm mt-1">
                          Use the API reference to explore available endpoints
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                    <h4 className="font-semibold mb-2">Base URL</h4>
                    <code className="text-blue-400 bg-gray-800 px-2 py-1 rounded text-sm">
                      https://fieldnine.io
                    </code>
                  </div>
                  <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                    <h4 className="font-semibold mb-2">API Version</h4>
                    <code className="text-green-400 bg-gray-800 px-2 py-1 rounded text-sm">
                      v1.0.0
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* Authentication */}
            {activeSection === 'authentication' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Authentication</h2>
                <p className="text-gray-300">
                  Field Nine API supports two authentication methods: Bearer tokens and API keys.
                </p>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Bearer Token</h3>
                  <p className="text-gray-400 mb-4">
                    For user-authenticated requests, include the JWT token in the Authorization
                    header:
                  </p>
                  <code className="block bg-gray-800 p-4 rounded-lg text-sm text-blue-400">
                    Authorization: Bearer YOUR_JWT_TOKEN
                  </code>
                </div>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">API Key</h3>
                  <p className="text-gray-400 mb-4">
                    For server-to-server communication, use your API key:
                  </p>
                  <code className="block bg-gray-800 p-4 rounded-lg text-sm text-blue-400">
                    X-API-Key: YOUR_API_KEY
                  </code>
                </div>

                {/* Code Examples */}
                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl overflow-hidden">
                  <div className="flex border-b border-gray-800">
                    {codeExamples.authentication.map((ex) => (
                      <button
                        key={ex.language}
                        onClick={() =>
                          setActiveLanguage({ ...activeLanguage, authentication: ex.language })
                        }
                        className={`px-4 py-2 text-sm ${
                          activeLanguage.authentication === ex.language
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {ex.language}
                      </button>
                    ))}
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto">
                    <code className="text-gray-300">
                      {
                        codeExamples.authentication.find(
                          (e) => e.language === activeLanguage.authentication
                        )?.code
                      }
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* Wallet */}
            {activeSection === 'wallet' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Wallet API</h2>
                <p className="text-gray-300">
                  Manage user wallets, check balances, and process transactions.
                </p>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Available Endpoints</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                        GET
                      </span>
                      <code className="text-gray-300">/api/wallet/balance</code>
                      <span className="text-gray-500">- Get wallet balance</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">
                        POST
                      </span>
                      <code className="text-gray-300">/api/wallet/topup</code>
                      <span className="text-gray-500">- Add funds</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                        GET
                      </span>
                      <code className="text-gray-300">/api/wallet/transactions</code>
                      <span className="text-gray-500">- Transaction history</span>
                    </div>
                  </div>
                </div>

                {/* Code Examples */}
                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl overflow-hidden">
                  <div className="flex border-b border-gray-800">
                    {codeExamples.wallet.map((ex) => (
                      <button
                        key={ex.language}
                        onClick={() =>
                          setActiveLanguage({ ...activeLanguage, wallet: ex.language })
                        }
                        className={`px-4 py-2 text-sm ${
                          activeLanguage.wallet === ex.language
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {ex.language}
                      </button>
                    ))}
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto">
                    <code className="text-gray-300">
                      {codeExamples.wallet.find((e) => e.language === activeLanguage.wallet)?.code}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* Webhooks */}
            {activeSection === 'webhook' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Webhooks</h2>
                <p className="text-gray-300">
                  Receive real-time notifications about events in your application.
                </p>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Event Types</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <code className="text-blue-400">payment.completed</code>
                      <span className="text-gray-400">Payment successfully processed</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <code className="text-blue-400">payment.failed</code>
                      <span className="text-gray-400">Payment failed</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <code className="text-blue-400">wallet.updated</code>
                      <span className="text-gray-400">Wallet balance changed</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <code className="text-blue-400">subscription.created</code>
                      <span className="text-gray-400">New subscription started</span>
                    </div>
                  </div>
                </div>

                {/* Code Example */}
                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-800 text-sm text-gray-400">
                    Webhook Handler Example
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto">
                    <code className="text-gray-300">{codeExamples.webhook[0].code}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Rate Limits */}
            {activeSection === 'rate-limits' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Rate Limits</h2>
                <p className="text-gray-300">
                  API rate limits protect our infrastructure and ensure fair usage.
                </p>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="text-left px-4 py-3">Endpoint Type</th>
                        <th className="text-left px-4 py-3">Limit</th>
                        <th className="text-left px-4 py-3">Window</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      <tr>
                        <td className="px-4 py-3">Standard API</td>
                        <td className="px-4 py-3 text-green-400">100 requests</td>
                        <td className="px-4 py-3">per minute</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Authentication</td>
                        <td className="px-4 py-3 text-yellow-400">5 requests</td>
                        <td className="px-4 py-3">per 5 minutes</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Payment</td>
                        <td className="px-4 py-3 text-blue-400">20 requests</td>
                        <td className="px-4 py-3">per minute</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">Public API (with key)</td>
                        <td className="px-4 py-3 text-purple-400">1000 requests</td>
                        <td className="px-4 py-3">per hour</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Rate Limit Headers</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="text-gray-300">
                      X-RateLimit-Limit: <span className="text-blue-400">100</span>
                    </div>
                    <div className="text-gray-300">
                      X-RateLimit-Remaining: <span className="text-green-400">95</span>
                    </div>
                    <div className="text-gray-300">
                      X-RateLimit-Reset: <span className="text-yellow-400">1706400000</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Handling */}
            {activeSection === 'errors' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">Error Handling</h2>
                <p className="text-gray-300">
                  All API errors follow a consistent format for easy handling.
                </p>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4">Error Response Format</h3>
                  <pre className="bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                    <code className="text-gray-300">
                      {JSON.stringify(
                        {
                          success: false,
                          error: 'Error message description',
                          code: 'ERROR_CODE',
                          details: { field: 'Additional context' },
                        },
                        null,
                        2
                      )}
                    </code>
                  </pre>
                </div>

                <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="text-left px-4 py-3">Status Code</th>
                        <th className="text-left px-4 py-3">Meaning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      <tr>
                        <td className="px-4 py-3 text-green-400">200</td>
                        <td className="px-4 py-3">Success</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-yellow-400">400</td>
                        <td className="px-4 py-3">Bad Request - Invalid parameters</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-yellow-400">401</td>
                        <td className="px-4 py-3">Unauthorized - Authentication required</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-yellow-400">403</td>
                        <td className="px-4 py-3">Forbidden - Insufficient permissions</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-yellow-400">404</td>
                        <td className="px-4 py-3">Not Found - Resource doesn&#39;t exist</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-orange-400">429</td>
                        <td className="px-4 py-3">Too Many Requests - Rate limited</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-red-400">500</td>
                        <td className="px-4 py-3">Internal Server Error</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
