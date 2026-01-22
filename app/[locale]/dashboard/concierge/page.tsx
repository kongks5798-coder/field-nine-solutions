/**
 * K-UNIVERSAL AI Concierge Page
 * Your personal Korea travel assistant
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Car,
  UtensilsCrossed,
  ShoppingBag,
  MapPin,
  Languages,
  Mic,
  Image as ImageIcon,
  MoreHorizontal,
} from 'lucide-react';

// ============================================
// Types
// ============================================
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  labelKo: string;
  query: string;
  color: string;
}

// ============================================
// Quick Actions Data
// ============================================
const quickActions: QuickAction[] = [
  {
    icon: Car,
    label: 'Call Taxi',
    labelKo: '택시 호출',
    query: 'How do I call a taxi in Korea?',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: UtensilsCrossed,
    label: 'Food Guide',
    labelKo: '맛집 추천',
    query: 'What are the best Korean foods I must try?',
    color: 'from-red-400 to-pink-500',
  },
  {
    icon: ShoppingBag,
    label: 'Shopping',
    labelKo: '쇼핑 정보',
    query: 'Where are the best shopping spots in Seoul?',
    color: 'from-purple-400 to-indigo-500',
  },
  {
    icon: MapPin,
    label: 'Attractions',
    labelKo: '관광지',
    query: 'What are the must-visit places in Korea?',
    color: 'from-green-400 to-emerald-500',
  },
  {
    icon: Languages,
    label: 'Korean',
    labelKo: '한국어',
    query: 'Teach me essential Korean phrases for traveling',
    color: 'from-blue-400 to-cyan-500',
  },
];

const suggestedQuestions = [
  '🚕 How do I call a taxi?',
  '🍗 Best Korean food to try?',
  '🛍️ Where to shop in Seoul?',
  '💳 How to use QR payment?',
  '🗺️ Must-visit places?',
  '🇰🇷 Teach me Korean phrases',
];

// ============================================
// Main Component
// ============================================
export default function ConciergePage() {
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to AI
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    try {
      const response = await fetch('/api/v1/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href={`/${locale}/dashboard`}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">Jarvis</h1>
              <p className="text-white/50 text-xs">Your Korea Travel Assistant</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-white/50" />
          </motion.button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Welcome State */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-2">
                안녕하세요! 👋
              </h2>
              <p className="text-white/60 mb-8">
                I'm Jarvis, your personal Korea travel assistant.
                <br />
                Ask me anything about Korea!
              </p>

              {/* Quick Actions Grid */}
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8"
                >
                  {quickActions.map((action, idx) => (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => sendMessage(action.query)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-white text-sm font-medium">
                        {locale === 'ko' ? action.labelKo : action.label}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Suggested Questions */}
              <div className="space-y-2">
                <p className="text-white/40 text-sm mb-3">Or try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.map((question) => (
                    <motion.button
                      key={question}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendMessage(question)}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center mr-2 flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                  <p className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-white/60' : 'text-white/40'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/10 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/5 pb-safe">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Quick Suggestions (shown after conversation starts) */}
          {messages.length > 0 && !isLoading && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
              {suggestedQuestions.slice(0, 4).map((question) => (
                <motion.button
                  key={question}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(question)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 transition-colors"
                >
                  {question}
                </motion.button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-white/40" />
            </motion.button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={locale === 'ko' ? '메시지를 입력하세요...' : 'Ask me anything about Korea...'}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-full text-white placeholder-white/30 focus:outline-none focus:border-[#3B82F6] transition-colors text-sm"
                disabled={isLoading}
              />
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <Mic className="w-5 h-5 text-white/40" />
            </motion.button>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
