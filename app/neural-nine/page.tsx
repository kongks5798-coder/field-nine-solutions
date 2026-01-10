'use client';

import { useState, useEffect } from 'react';

// --- Types ---
type AgentStatus = 'idle' | 'thinking' | 'completed' | 'failed';

export default function AgentDashboard() {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  // --- Actions ---
  const activateDeepSeek = async () => {
    setStatus('thinking');
    setResult(null);
    setLogs([]);
    addLog('🚀 Mission Start: Trend Analysis requested.');
    addLog('🧠 Connecting to RTX 5090 Local Cluster...');

    try {
      // Connect to Neural Nine API (Next.js route)
      const res = await fetch('/api/neural-nine/trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Streetwear 2026', depth: 'deep' }),
      });

      if (!res.ok) {
        throw new Error(`API 오류: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success && data.task_id) {
        setTaskId(data.task_id);
        addLog(`✅ Task Queued: ID ${data.task_id}`);
        addLog('🧠 DeepSeek-R1 is thinking...');
        
        // Poll for status
        pollTaskStatus(data.task_id);
      } else {
        throw new Error(data.error || '작업 생성 실패');
      }
    } catch (error) {
      console.error(error);
      setStatus('failed');
      addLog(`❌ Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      addLog('💡 Ensure Neural Nine AI Backend is running on port 8001');
    }
  };

  const pollTaskStatus = async (id: string) => {
    const maxAttempts = 20; // 20 attempts = ~10 seconds
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await fetch(`/api/neural-nine/trend/status?taskId=${id}`);
        
        if (!res.ok) {
          throw new Error(`Status check failed: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.success && data.status === 'completed') {
          setStatus('completed');
          setResult(data.result);
          addLog('🎉 DeepSeek-R1 returned results.');
          addLog('✅ Analysis Complete!');
          return;
        } else if (data.success && data.status === 'processing') {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(poll, 500); // Poll every 500ms
          } else {
            setStatus('failed');
            addLog('⏱️ Timeout: Task took too long.');
          }
        } else if (data.success && data.status === 'failed') {
          setStatus('failed');
          addLog('❌ Task failed on backend.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 500);
        } else {
          setStatus('failed');
          addLog('❌ Status polling failed.');
        }
      }
    };

    poll();
  };

  const activateVTON = async () => {
    addLog('⚠️ VTON Module is initializing...');
    addLog('📸 Please upload user image and garment image.');
    // TODO: Implement VTON UI
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <header className="mb-12 border-b border-gray-700 pb-4">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Project Neural Nine
        </h1>
        <p className="text-gray-400 mt-2">
          Autonomous AI Operations Center | Connected to RTX 5090
        </p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Control Panel */}
        <section className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4 text-emerald-300">Agent Command</h2>
            <p className="text-gray-300 mb-6">
              Select a mission for the autonomous agent swarm.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={activateDeepSeek}
                disabled={status === 'thinking'}
                className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                  status === 'thinking' 
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg hover:shadow-emerald-500/20'
                }`}
              >
                {status === 'thinking' ? 'DeepSeek Thinking...' : 'Analyze Market Trends'}
              </button>
              
              <button 
                className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-gray-300"
                onClick={activateVTON}
              >
                Run Virtual Try-On
              </button>
            </div>
          </div>

          {/* Status Monitor */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
             <h2 className="text-xl font-semibold mb-4 text-blue-300">System Status</h2>
             <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">GPU Load</div>
                    <div className="text-2xl font-bold text-green-400">12%</div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">VRAM Available</div>
                    <div className="text-2xl font-bold text-blue-400">20 GB</div>
                </div>
             </div>
          </div>
        </section>

        {/* Right: Terminal / Output */}
        <section className="bg-black rounded-2xl border border-gray-800 p-6 font-mono text-sm h-[500px] flex flex-col">
          <h3 className="text-gray-500 mb-2 border-b border-gray-800 pb-2">Mission Log</h3>
          <div className="flex-1 overflow-y-auto space-y-2 text-green-400">
            {logs.length === 0 && <span className="text-gray-600 opacity-50">Waiting for commands...</span>}
            {logs.map((log, i) => (
              <div key={i} className={status === 'thinking' && i === logs.length - 1 ? 'animate-pulse' : ''}>
                {log}
              </div>
            ))}
            {status === 'thinking' && (
               <div className="text-yellow-400 mt-4">
                 Running LangGraph Cycle: [Plan] {'->'} [Execute] {'->'} [Reflect]...
               </div>
            )}
            {result && (
                <div className="mt-4 p-4 bg-gray-900 border border-green-800 rounded text-white">
                    <strong>🏆 ANALYSIS RESULT:</strong>
                    <pre className="mt-2 text-xs text-gray-300">{JSON.stringify(result, null, 2)}</pre>
                </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
