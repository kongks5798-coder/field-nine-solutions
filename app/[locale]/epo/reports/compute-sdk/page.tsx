'use client';

import { useState } from 'react';

/**
 * K-AUS COMPUTE SDK INTERFACE SPECIFICATION
 *
 * K-AUS 기반 연산력 거래 SDK 문서
 * - API Reference
 * - Code Examples
 * - Integration Guide
 */

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: string;
  response?: string;
}

const API_ENDPOINTS: Record<string, APIEndpoint[]> = {
  hashrate: [
    {
      method: 'GET',
      path: '/api/compute?module=hashrate&action=stats',
      description: '글로벌 연산력 통계 조회',
      response: `{
  "stats": {
    "totalNodes": 10,
    "activeNodes": 9,
    "totalGPUs": 7040,
    "totalTFLOPS": 10847232,
    "availableTFLOPS": 2169446,
    "allocatedTFLOPS": 8677786,
    "averageUtilization": 0.80
  },
  "status": "COMPUTE_NETWORK_ONLINE"
}`,
    },
    {
      method: 'GET',
      path: '/api/compute?module=hashrate&action=nodes',
      description: '전체 GPU 노드 목록 조회',
      parameters: [
        { name: 'region', type: 'string', required: false, description: '지역 필터 (KR, US, EU, UAE, SG, JP, AU)' },
      ],
      response: `{
  "nodes": [
    {
      "nodeId": "KR-SEL-H100-001",
      "region": "KR",
      "gpuType": "H100",
      "gpuCount": 256,
      "status": "ONLINE",
      "currentUtilization": 0.78,
      "availableTFLOPS": 111164
    }
  ],
  "count": 10
}`,
    },
    {
      method: 'GET',
      path: '/api/compute?module=hashrate&action=available',
      description: '가용 연산 노드 검색',
      parameters: [
        { name: 'minTFLOPS', type: 'number', required: true, description: '최소 필요 TFLOPS' },
        { name: 'gpuType', type: 'string', required: false, description: 'GPU 타입 (H100, A100, MI300X, RTX4090, L40S)' },
      ],
      response: `{
  "availableNodes": [...],
  "count": 5,
  "totalAvailableTFLOPS": 500000
}`,
    },
    {
      method: 'POST',
      path: '/api/compute',
      description: 'Compute Credit 생성',
      requestBody: `{
  "module": "hashrate",
  "action": "generate-credits",
  "kwhConsumed": 1000,
  "gpuType": "H100",
  "workloadType": "TRAINING"
}`,
      response: `{
  "success": true,
  "credit": {
    "creditId": "CC-1737550800-xyz789",
    "kwhConsumed": 1000,
    "creditsGenerated": 15000,
    "kausEquivalent": 15.0,
    "gpuType": "H100",
    "efficiency": 1.0
  }
}`,
    },
  ],
  marketplace: [
    {
      method: 'GET',
      path: '/api/compute?module=marketplace&action=quote',
      description: '연산력 가격 견적 요청',
      parameters: [
        { name: 'gpuType', type: 'string', required: true, description: 'GPU 타입' },
        { name: 'tflops', type: 'number', required: true, description: '필요 TFLOPS' },
        { name: 'duration', type: 'number', required: true, description: '사용 시간 (hours)' },
        { name: 'priority', type: 'string', required: false, description: '우선순위 (STANDARD, PRIORITY, URGENT)' },
      ],
      response: `{
  "quote": {
    "gpuType": "H100",
    "requestedTFLOPS": 100000,
    "duration": 24,
    "basePrice": 150.0,
    "demandMultiplier": 1.5,
    "priorityMultiplier": 1.0,
    "totalPrice": 225.0,
    "settlementFee": 1.125,
    "effectivePrice": 226.125,
    "availability": 0.85,
    "estimatedWaitMinutes": 5
  }
}`,
    },
    {
      method: 'GET',
      path: '/api/compute?module=marketplace&action=pricing',
      description: 'GPU 타입별 현재 가격',
      response: `{
  "pricing": [
    { "gpuType": "H100", "minBid": 10, "currentRate": 2.5, "tflops": 1979 },
    { "gpuType": "A100", "minBid": 5, "currentRate": 1.5, "tflops": 312 },
    { "gpuType": "MI300X", "minBid": 9, "currentRate": 2.2, "tflops": 1307 }
  ]
}`,
    },
    {
      method: 'POST',
      path: '/api/compute',
      description: '연산력 입찰 제출',
      requestBody: `{
  "module": "marketplace",
  "action": "submit-bid",
  "clientId": "your-client-id",
  "clientName": "Your Company",
  "gpuType": "H100",
  "requestedGPUs": 32,
  "workloadType": "TRAINING",
  "priority": "STANDARD",
  "maxKausPerHour": 100,
  "minDurationHours": 1,
  "maxDurationHours": 24,
  "totalKausBudget": 3000
}`,
      response: `{
  "success": true,
  "bid": {
    "bidId": "BID-1737550800-abc123",
    "status": "ACCEPTED",
    "assignedNodeId": "US-TEX-H100-001",
    "requestedTFLOPS": 63328
  }
}`,
    },
  ],
  yield: [
    {
      method: 'GET',
      path: '/api/compute?module=yield&action=analyze',
      description: '수익 최적화 분석 (전기 vs 연산)',
      parameters: [
        { name: 'powerPlantId', type: 'string', required: true, description: '발전소 ID' },
      ],
      response: `{
  "analysis": {
    "decision": "PRODUCE_COMPUTE",
    "confidence": 0.87,
    "electricityYieldUSD": 1500,
    "computeYieldKAUS": 12500,
    "computeYieldUSD": 1875,
    "premiumMultiplier": 1.25,
    "recommendedAllocation": {
      "electricity": 0.25,
      "compute": 0.75
    },
    "projectedDailyYieldUSD": 15200
  }
}`,
    },
    {
      method: 'POST',
      path: '/api/compute',
      description: '수익 시뮬레이션 실행',
      requestBody: `{
  "module": "yield",
  "action": "simulate",
  "surplusPowerKW": 10000,
  "electricityPrice": 0.10,
  "computeDemand": 0.7,
  "durationHours": 720,
  "strategy": "AGGRESSIVE"
}`,
      response: `{
  "success": true,
  "simulation": {
    "timeline": [...],
    "summary": {
      "totalElectricityYieldUSD": 21600,
      "totalComputeYieldKAUS": 756000,
      "totalComputeYieldUSD": 113400,
      "totalYieldUSD": 135000,
      "averageHourlyYield": 187.5
    }
  }
}`,
    },
  ],
};

const CODE_EXAMPLES = {
  javascript: `// Field Nine Compute SDK - JavaScript/TypeScript
import { FieldNineCompute } from '@fieldnine/compute-sdk';

// Initialize SDK
const compute = new FieldNineCompute({
  apiKey: 'your-api-key',
  kausWallet: '0x...',
  network: 'mainnet'
});

// Get available compute capacity
const available = await compute.hashrate.getAvailable({
  minTFLOPS: 100000,
  gpuType: 'H100'
});

console.log(\`Found \${available.count} nodes with \${available.totalAvailableTFLOPS} TFLOPS\`);

// Get price quote
const quote = await compute.marketplace.getQuote({
  gpuType: 'H100',
  tflops: 100000,
  duration: 24,
  priority: 'STANDARD'
});

console.log(\`Price: \${quote.effectivePrice} K-AUS for 24 hours\`);

// Submit compute bid
const bid = await compute.marketplace.submitBid({
  gpuType: 'H100',
  requestedGPUs: 32,
  workloadType: 'TRAINING',
  maxKausPerHour: 100,
  maxDurationHours: 24,
  totalKausBudget: 3000
});

if (bid.status === 'ACCEPTED') {
  console.log(\`Compute allocated on node: \${bid.assignedNodeId}\`);
}

// Monitor job
const status = await compute.jobs.getStatus(bid.bidId);
console.log(\`Job progress: \${status.progress}%\`);`,

  python: `# Field Nine Compute SDK - Python
from fieldnine import ComputeSDK

# Initialize SDK
compute = ComputeSDK(
    api_key="your-api-key",
    kaus_wallet="0x...",
    network="mainnet"
)

# Get available compute capacity
available = compute.hashrate.get_available(
    min_tflops=100000,
    gpu_type="H100"
)

print(f"Found {available.count} nodes with {available.total_available_tflops} TFLOPS")

# Get price quote
quote = compute.marketplace.get_quote(
    gpu_type="H100",
    tflops=100000,
    duration=24,
    priority="STANDARD"
)

print(f"Price: {quote.effective_price} K-AUS for 24 hours")

# Submit compute bid
bid = compute.marketplace.submit_bid(
    gpu_type="H100",
    requested_gpus=32,
    workload_type="TRAINING",
    max_kaus_per_hour=100,
    max_duration_hours=24,
    total_kaus_budget=3000
)

if bid.status == "ACCEPTED":
    print(f"Compute allocated on node: {bid.assigned_node_id}")

# Run training job
job = compute.jobs.create(
    bid_id=bid.bid_id,
    docker_image="your-training-image:latest",
    command=["python", "train.py"],
    env={"MODEL_SIZE": "7B", "BATCH_SIZE": "32"}
)

# Wait for completion
result = compute.jobs.wait(job.job_id)
print(f"Training complete: {result.metrics}")`,

  curl: `# Field Nine Compute API - cURL Examples

# Get global stats
curl -X GET "https://api.fieldnine.io/compute?module=hashrate&action=stats" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Get price quote
curl -X GET "https://api.fieldnine.io/compute?module=marketplace&action=quote\\
&gpuType=H100&tflops=100000&duration=24&priority=STANDARD" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Submit compute bid
curl -X POST "https://api.fieldnine.io/compute" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "module": "marketplace",
    "action": "submit-bid",
    "clientId": "your-client-id",
    "gpuType": "H100",
    "requestedGPUs": 32,
    "workloadType": "TRAINING",
    "priority": "STANDARD",
    "maxKausPerHour": 100,
    "maxDurationHours": 24,
    "totalKausBudget": 3000
  }'

# Run yield analysis
curl -X GET "https://api.fieldnine.io/compute?module=yield\\
&action=analyze&powerPlantId=SOLAR-JEJU-001" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,

  go: `// Field Nine Compute SDK - Go
package main

import (
    "fmt"
    "github.com/fieldnine/compute-sdk-go"
)

func main() {
    // Initialize SDK
    client := fieldnine.NewComputeClient(
        fieldnine.WithAPIKey("your-api-key"),
        fieldnine.WithKausWallet("0x..."),
        fieldnine.WithNetwork("mainnet"),
    )

    // Get available compute capacity
    available, err := client.Hashrate.GetAvailable(&fieldnine.AvailableParams{
        MinTFLOPS: 100000,
        GPUType:   "H100",
    })
    if err != nil {
        panic(err)
    }

    fmt.Printf("Found %d nodes with %d TFLOPS\\n",
        available.Count, available.TotalAvailableTFLOPS)

    // Submit compute bid
    bid, err := client.Marketplace.SubmitBid(&fieldnine.BidParams{
        GPUType:         "H100",
        RequestedGPUs:   32,
        WorkloadType:    "TRAINING",
        MaxKausPerHour:  100,
        MaxDurationHours: 24,
        TotalKausBudget: 3000,
    })
    if err != nil {
        panic(err)
    }

    if bid.Status == "ACCEPTED" {
        fmt.Printf("Compute allocated on node: %s\\n", bid.AssignedNodeID)
    }
}`,
};

export default function ComputeSDKPage() {
  const [activeModule, setActiveModule] = useState<string>('hashrate');
  const [activeLanguage, setActiveLanguage] = useState<string>('javascript');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const methodColors: Record<string, string> = {
    GET: 'bg-green-500/20 text-green-400 border-green-500/30',
    POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30">
            📘
          </div>
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              K-AUS COMPUTE SDK
            </h1>
            <p className="text-gray-400">Interface Specification & Developer Guide</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Version: 1.0.0 | Last Updated: {new Date().toISOString().split('T')[0]}
        </div>
      </div>

      {/* Quick Start Banner */}
      <div className="bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-red-900/30 border border-purple-500/30 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-purple-400 mb-4">🚀 Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-2xl mb-2">1️⃣</div>
            <div className="font-bold">API Key 발급</div>
            <div className="text-sm text-gray-400">Dashboard에서 API Key 생성</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-2xl mb-2">2️⃣</div>
            <div className="font-bold">K-AUS 충전</div>
            <div className="text-sm text-gray-400">연산력 결제용 K-AUS 준비</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-2xl mb-2">3️⃣</div>
            <div className="font-bold">SDK 설치</div>
            <div className="text-sm text-gray-400">
              <code className="bg-gray-800 px-2 py-1 rounded">npm i @fieldnine/compute-sdk</code>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Navigation */}
        <div className="space-y-6">
          {/* API Modules */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">API Modules</h3>
            <div className="space-y-1">
              {Object.keys(API_ENDPOINTS).map(module => (
                <button
                  key={module}
                  onClick={() => setActiveModule(module)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    activeModule === module
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {module === 'hashrate' && '⚡ Hashrate'}
                  {module === 'marketplace' && '🏪 Marketplace'}
                  {module === 'yield' && '📊 Yield Optimizer'}
                </button>
              ))}
            </div>
          </div>

          {/* SDK Languages */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">SDK Examples</h3>
            <div className="space-y-1">
              {Object.keys(CODE_EXAMPLES).map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                    activeLanguage === lang
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {lang === 'javascript' && '🟨 JavaScript/TS'}
                  {lang === 'python' && '🐍 Python'}
                  {lang === 'curl' && '🌐 cURL'}
                  {lang === 'go' && '🔵 Go'}
                </button>
              ))}
            </div>
          </div>

          {/* Key Info */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-400 mb-3">Key Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Base URL</span>
                <span className="text-cyan-400 font-mono text-xs">api.fieldnine.io</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Auth</span>
                <span className="text-green-400">Bearer Token</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rate Limit</span>
                <span className="text-amber-400">1000/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Burn Fee</span>
                <span className="text-red-400">0.5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* API Reference */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              📚 API Reference: {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}
            </h2>

            <div className="space-y-4">
              {API_ENDPOINTS[activeModule]?.map((endpoint, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${methodColors[endpoint.method]}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-cyan-400 font-mono text-sm flex-1">{endpoint.path}</code>
                    <button
                      onClick={() => copyToClipboard(endpoint.path, endpoint.path)}
                      className="text-gray-500 hover:text-white transition-all"
                    >
                      {copiedEndpoint === endpoint.path ? '✓' : '📋'}
                    </button>
                  </div>

                  <p className="text-gray-400 text-sm mb-3">{endpoint.description}</p>

                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-bold text-gray-500 mb-2">PARAMETERS</div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="text-left py-1">Name</th>
                            <th className="text-left py-1">Type</th>
                            <th className="text-left py-1">Required</th>
                            <th className="text-left py-1">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.parameters.map((param, pIdx) => (
                            <tr key={pIdx} className="border-t border-gray-700">
                              <td className="py-1 text-cyan-400 font-mono">{param.name}</td>
                              <td className="py-1 text-amber-400">{param.type}</td>
                              <td className="py-1">
                                {param.required ? (
                                  <span className="text-red-400">Yes</span>
                                ) : (
                                  <span className="text-gray-500">No</span>
                                )}
                              </td>
                              <td className="py-1 text-gray-400">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {endpoint.requestBody && (
                    <div className="mb-3">
                      <div className="text-xs font-bold text-gray-500 mb-2">REQUEST BODY</div>
                      <pre className="bg-black/50 p-3 rounded-lg text-xs overflow-x-auto">
                        <code className="text-green-400">{endpoint.requestBody}</code>
                      </pre>
                    </div>
                  )}

                  {endpoint.response && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 mb-2">RESPONSE</div>
                      <pre className="bg-black/50 p-3 rounded-lg text-xs overflow-x-auto">
                        <code className="text-blue-400">{endpoint.response}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Code Examples */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              💻 Code Example: {activeLanguage.charAt(0).toUpperCase() + activeLanguage.slice(1)}
            </h2>

            <div className="relative">
              <button
                onClick={() => copyToClipboard(CODE_EXAMPLES[activeLanguage as keyof typeof CODE_EXAMPLES], 'code')}
                className="absolute top-3 right-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-all"
              >
                {copiedEndpoint === 'code' ? '✓ Copied!' : '📋 Copy'}
              </button>
              <pre className="bg-black/50 p-4 rounded-lg text-sm overflow-x-auto">
                <code className="text-gray-300">
                  {CODE_EXAMPLES[activeLanguage as keyof typeof CODE_EXAMPLES]}
                </code>
              </pre>
            </div>
          </div>

          {/* Data Types */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">📋 Data Types</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-2">GPUType</h3>
                <div className="space-y-1 text-sm font-mono">
                  <div className="text-gray-400">&quot;H100&quot; | &quot;A100&quot; | &quot;MI300X&quot; | &quot;RTX4090&quot; | &quot;L40S&quot;</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-2">WorkloadType</h3>
                <div className="space-y-1 text-sm font-mono">
                  <div className="text-gray-400">&quot;TRAINING&quot; | &quot;INFERENCE&quot; | &quot;RENDERING&quot; | &quot;SCIENTIFIC&quot;</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-2">BidPriority</h3>
                <div className="space-y-1 text-sm font-mono">
                  <div className="text-gray-400">&quot;STANDARD&quot; | &quot;PRIORITY&quot; | &quot;URGENT&quot; | &quot;RESERVED&quot;</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-2">YieldDecision</h3>
                <div className="space-y-1 text-sm font-mono">
                  <div className="text-gray-400">&quot;SELL_ELECTRICITY&quot; | &quot;PRODUCE_COMPUTE&quot; | &quot;HYBRID&quot;</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-2">NodeStatus</h3>
                <div className="space-y-1 text-sm font-mono">
                  <div className="text-gray-400">&quot;ONLINE&quot; | &quot;OFFLINE&quot; | &quot;MAINTENANCE&quot; | &quot;OVERLOADED&quot;</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 mb-2">BidStatus</h3>
                <div className="space-y-1 text-sm font-mono">
                  <div className="text-gray-400">&quot;PENDING&quot; | &quot;ACTIVE&quot; | &quot;ACCEPTED&quot; | &quot;REJECTED&quot; | &quot;COMPLETED&quot;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Codes */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">⚠️ Error Codes</h2>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400">Code</th>
                  <th className="text-left py-2 text-gray-400">Message</th>
                  <th className="text-left py-2 text-gray-400">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="py-2 text-red-400 font-mono">400</td>
                  <td className="py-2">INVALID_PARAMS</td>
                  <td className="py-2 text-gray-400">필수 파라미터 누락 또는 잘못된 형식</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 text-red-400 font-mono">401</td>
                  <td className="py-2">UNAUTHORIZED</td>
                  <td className="py-2 text-gray-400">유효하지 않은 API 키</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 text-red-400 font-mono">402</td>
                  <td className="py-2">INSUFFICIENT_KAUS</td>
                  <td className="py-2 text-gray-400">K-AUS 잔액 부족</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 text-amber-400 font-mono">429</td>
                  <td className="py-2">RATE_LIMITED</td>
                  <td className="py-2 text-gray-400">요청 한도 초과 (1000/min)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 text-amber-400 font-mono">503</td>
                  <td className="py-2">NO_CAPACITY</td>
                  <td className="py-2 text-gray-400">현재 가용 연산력 없음</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>K-AUS Compute SDK v1.0.0 | Field Nine Solutions</p>
        <p className="text-purple-400/60 mt-2">
          &quot;에너지를 넘어 지능을 판다 - 전 세계 AI 산업의 인프라&quot;
        </p>
      </div>
    </div>
  );
}
