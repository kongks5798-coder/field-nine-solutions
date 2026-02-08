/**
 * K-UNIVERSAL AI Concierge Chat Widget
 * Floating chat interface
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConciergeMessage } from '@/lib/ai/concierge';

export function ConciergeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ConciergeMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const userMessage: ConciergeMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: [...messages, userMessage],
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: ConciergeMessage = {
          role: 'assistant',
          content: data.response.message,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#0066FF] text-white rounded-full shadow-lg flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? '✕' : '💬'}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50"
          >
            {/* Header */}
            <div className="p-4 bg-[#0066FF] text-white rounded-t-2xl">
              <h3 className="font-semibold text-lg">AI Concierge - Jarvis</h3>
              <p className="text-sm text-blue-100">24/7 instant support</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-sm">무엇을 도와드릴까요?</p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-[#0066FF] text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                    <span className="inline-block animate-pulse">●●●</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (input.trim()) sendMessage(input.trim());
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-[#0066FF]"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-2 bg-[#0066FF] text-white rounded-full font-semibold hover:bg-[#0052CC] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  전송
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
