'use client';
import React, { useState } from 'react';

export default function DashboardPage() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('보스, 명령을 대기 중입니다.');
  const [loading, setLoading] = useState(false);

  const handleCommand = async () => {
    setLoading(true);
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setReply(data.reply);
    setLoading(false);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-[#171717] font-sans p-12">
      <div className="max-w-4xl mx-auto">
        <header className="border-b border-[#E5E5E1] pb-8 mb-12">
          <h1 className="text-5xl font-extralight tracking-tighter uppercase mb-2">Field Nine OS</h1>
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${loading ? 'bg-orange-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></span>
            <p className="text-xs uppercase tracking-[0.3em] opacity-50">DeepSeek-R1 Engine Active</p>
          </div>
        </header>

        <div className="grid gap-8">
          {/* Output Display */}
          <div className="bg-white border border-[#E5E5E1] p-10 min-h-[200px] flex flex-col justify-between shadow-sm">
            <h2 className="text-[10px] uppercase tracking-widest opacity-40 mb-4">Jarvis Response</h2>
            <p className="text-xl font-light leading-relaxed whitespace-pre-wrap">{reply}</p>
          </div>

          {/* Input Control */}
          <div className="relative">
            <input 
              className="w-full bg-transparent border-b border-[#171717] py-4 pr-16 text-2xl font-light focus:outline-none placeholder:opacity-20"
              placeholder="Enter Master Command..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCommand()}
            />
            <button 
              onClick={handleCommand}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-xs uppercase tracking-widest font-bold hover:opacity-50 transition-opacity"
            >
              Execute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}