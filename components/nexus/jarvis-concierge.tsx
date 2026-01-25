/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 51: JARVIS CONCIERGE - Sovereign AI Assistant
 * ═══════════════════════════════════════════════════════════════════════════════
 * "I am Jarvis, CTO of Field Nine. How can I assist your empire building today?"
 *
 * Features:
 * - Minimalist AI Chat Widget (#171717 background)
 * - Emerald Pulse Live Status
 * - Real-time Profit Advisory
 * - Strategic Investment Recommendations
 *
 * @component JarvisConcierge
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  JARVIS_ACTIONS,
  JarvisActionType,
  executeJarvisAction,
  ActionExecutionResult,
} from '@/lib/ai/governance';

// Message types
interface JarvisMessage {
  id: string;
  role: 'user' | 'jarvis' | 'system';
  content: string;
  timestamp: Date;
  type?: 'greeting' | 'advisory' | 'strategy' | 'alert';
}

// User portfolio for profit advisory
interface UserPortfolio {
  tier: 'Pioneer' | 'Sovereign' | 'Emperor';
  kausBalance: number;
  totalInvested: number;
  currentApy: number;
  projectedProfit: number;
  upgradePotential: {
    nextTier: string;
    apyIncrease: number;
    projectedGain: number;
  } | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JARVIS AI BRAIN
// ═══════════════════════════════════════════════════════════════════════════════

const JARVIS_PERSONALITY = {
  greeting: "Welcome, Sovereign. I am Jarvis, CTO of Field Nine. How can I assist your empire building today?",
  analyzing: "Analyzing your portfolio metrics...",
  advisories: [
    "Based on current network performance, your assets are generating optimal returns.",
    "The Prophet AI detected a 12% profit opportunity in the Tokyo node.",
    "Your current tier qualifies for priority access to new infrastructure shares.",
    "Market conditions favor increasing your KAUS position by 20%.",
  ],
};

// Generate strategic advisory based on portfolio
function generateAdvisory(portfolio: UserPortfolio): string {
  if (portfolio.upgradePotential) {
    const { nextTier, apyIncrease, projectedGain } = portfolio.upgradePotential;
    return `Strategic Analysis: Upgrading to ${nextTier} Tier would increase your APY by ${apyIncrease.toFixed(1)}%, projecting an additional $${projectedGain.toLocaleString()} annual profit. Current network conditions are favorable for this transition.`;
  }

  if (portfolio.tier === 'Emperor') {
    return `As an Emperor-tier investor, you're receiving maximum APY benefits. Current portfolio performance: ${portfolio.currentApy.toFixed(1)}% APY with $${portfolio.projectedProfit.toLocaleString()} projected annual returns. Consider diversifying across additional nodes for risk optimization.`;
  }

  return JARVIS_PERSONALITY.advisories[Math.floor(Math.random() * JARVIS_PERSONALITY.advisories.length)];
}

// Mock user portfolio (would come from API in production)
function getUserPortfolio(): UserPortfolio {
  const tiers = ['Pioneer', 'Sovereign', 'Emperor'] as const;
  const currentTierIndex = Math.floor(Math.random() * 2); // 0 or 1, not Emperor for demo
  const tier = tiers[currentTierIndex];

  const apyRates = { Pioneer: 12, Sovereign: 13.5, Emperor: 15 };
  const kausBalance = 500 + Math.floor(Math.random() * 5000);
  const totalInvested = kausBalance * 0.85;
  const currentApy = apyRates[tier];
  const projectedProfit = (totalInvested * currentApy) / 100;

  const nextTier = currentTierIndex < 2 ? tiers[currentTierIndex + 1] : null;
  const upgradePotential = nextTier ? {
    nextTier,
    apyIncrease: apyRates[nextTier] - currentApy,
    projectedGain: (totalInvested * (apyRates[nextTier] - currentApy)) / 100,
  } : null;

  return {
    tier,
    kausBalance,
    totalInvested,
    currentApy,
    projectedProfit,
    upgradePotential,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMERALD PULSE INDICATOR
// ═══════════════════════════════════════════════════════════════════════════════

function EmeraldPulse({ isActive }: { isActive: boolean }) {
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} />
        {isActive && (
          <>
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </>
        )}
      </div>
      <span className={`text-xs font-medium ${isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
        {isActive ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// JARVIS AVATAR
// ═══════════════════════════════════════════════════════════════════════════════

function JarvisAvatar({ isThinking }: { isThinking: boolean }) {
  return (
    <div className="relative w-10 h-10">
      {/* Core */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>

      {/* Thinking indicator */}
      {isThinking && (
        <div className="absolute -inset-1 rounded-xl border-2 border-emerald-400 animate-pulse opacity-50" />
      )}

      {/* Status dot */}
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#171717] rounded-full flex items-center justify-center">
        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK ACTION BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'portfolio', label: 'Analyze Portfolio', icon: '📊', prompt: 'Analyze my current portfolio and investment performance.' },
  { id: 'upgrade', label: 'Upgrade Strategy', icon: '⬆️', prompt: 'What are the benefits of upgrading my membership tier?' },
  { id: 'nodes', label: 'Best Nodes', icon: '🌐', prompt: 'Which infrastructure nodes have the best performance right now?' },
  { id: 'profit', label: 'Profit Forecast', icon: '💰', prompt: 'Show me my projected profits for the next 12 months.' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// JARVIS ACTION-LINK BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════

interface ActionLinkProps {
  actionType: JarvisActionType;
  onExecute: (type: JarvisActionType, amount?: number) => void;
  isExecuting: boolean;
}

function ActionLinkButton({ actionType, onExecute, isExecuting }: ActionLinkProps) {
  const [showInput, setShowInput] = useState(false);
  const [amount, setAmount] = useState('');
  const action = JARVIS_ACTIONS[actionType];

  const handleSubmit = () => {
    const numAmount = parseFloat(amount) || 0;
    if (action.requiresAmount && numAmount <= 0) {
      return;
    }
    onExecute(actionType, numAmount);
    setShowInput(false);
    setAmount('');
  };

  if (showInput) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 bg-[#2a2a2a] rounded-xl p-2"
      >
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="KAUS 수량"
          className="w-24 px-2 py-1 bg-[#171717] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-emerald-500/50"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={isExecuting}
          className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg text-xs font-bold hover:opacity-90 disabled:opacity-50"
        >
          {isExecuting ? '...' : '확인'}
        </button>
        <button
          onClick={() => setShowInput(false)}
          className="p-1 text-white/40 hover:text-white/60"
        >
          ✕
        </button>
      </motion.div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => action.requiresAmount ? setShowInput(true) : onExecute(actionType)}
      disabled={isExecuting}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
        actionType === 'BUY_KAUS'
          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/20'
          : actionType === 'WITHDRAW'
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/20'
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      <span>{action.icon}</span>
      <span>{action.label}</span>
    </motion.button>
  );
}

// Action Result Toast
function ActionResultToast({
  result,
  onClose,
}: {
  result: ActionExecutionResult;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className={`fixed bottom-32 right-6 z-50 p-4 rounded-xl shadow-2xl max-w-sm ${
        result.success
          ? 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90'
          : 'bg-gradient-to-r from-red-500/90 to-pink-500/90'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{result.success ? '✅' : '❌'}</div>
        <div className="flex-1">
          <div className="font-bold text-white">{result.success ? '성공!' : '실패'}</div>
          <div className="text-sm text-white/90">{result.message}</div>
          {result.transactionId && (
            <div className="text-xs text-white/70 mt-1">TX: {result.transactionId}</div>
          )}
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          ✕
        </button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════════════════════════════════════════════

function MessageBubble({ message }: { message: JarvisMessage }) {
  const isUser = message.role === 'user';
  const isAdvisory = message.type === 'advisory' || message.type === 'strategy';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mr-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      )}

      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white'
            : isAdvisory
            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-white'
            : 'bg-[#2a2a2a] text-white/90'
        }`}
      >
        {isAdvisory && (
          <div className="flex items-center gap-2 mb-2 text-amber-400 text-xs font-semibold uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            Strategic Advisory
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-2 ${isUser ? 'text-white/60' : 'text-white/40'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN JARVIS CONCIERGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function JarvisConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<JarvisMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionResult, setActionResult] = useState<ActionExecutionResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle Jarvis Action execution
  const handleActionExecute = useCallback(async (actionType: JarvisActionType, amount?: number) => {
    setIsExecutingAction(true);

    // Add system message
    const actionMsg: JarvisMessage = {
      id: `action-${Date.now()}`,
      role: 'system',
      content: `${JARVIS_ACTIONS[actionType].icon} ${JARVIS_ACTIONS[actionType].label} 실행 중... ${amount ? `(${amount.toLocaleString()} KAUS)` : ''}`,
      timestamp: new Date(),
      type: 'alert',
    };
    setMessages(prev => [...prev, actionMsg]);

    try {
      const result = await executeJarvisAction(actionType, amount);
      setActionResult(result);

      // Add result message
      const resultMsg: JarvisMessage = {
        id: `result-${Date.now()}`,
        role: 'jarvis',
        content: result.success
          ? `${JARVIS_ACTIONS[actionType].label} 완료! ${result.transactionId ? `\nTransaction ID: ${result.transactionId}` : ''}`
          : `${JARVIS_ACTIONS[actionType].label} 실패. ${result.message}`,
        timestamp: new Date(),
        type: result.success ? 'advisory' : 'alert',
      };
      setMessages(prev => [...prev, resultMsg]);
    } catch (error) {
      setActionResult({
        success: false,
        message: '네트워크 오류가 발생했습니다.',
        executedAt: new Date().toISOString(),
      });
    } finally {
      setIsExecutingAction(false);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const userPortfolio = getUserPortfolio();
      setPortfolio(userPortfolio);

      // Greeting message
      const greeting: JarvisMessage = {
        id: 'greeting',
        role: 'jarvis',
        content: JARVIS_PERSONALITY.greeting,
        timestamp: new Date(),
        type: 'greeting',
      };
      setMessages([greeting]);

      // Auto-generate advisory after greeting
      setTimeout(() => {
        const advisory: JarvisMessage = {
          id: 'advisory-1',
          role: 'jarvis',
          content: generateAdvisory(userPortfolio),
          timestamp: new Date(),
          type: 'advisory',
        };
        setMessages(prev => [...prev, advisory]);
      }, 2000);
    }
  }, [isOpen, messages.length]);

  // Send message handler
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: JarvisMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/v1/ai/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: messages.map(m => ({
            role: m.role === 'jarvis' ? 'assistant' : m.role,
            content: m.content,
          })).concat([{ role: 'user', content: text }]),
          context: {
            portfolio,
            features: ['profit-advisory', 'tier-upgrade', 'node-analysis'],
          },
        }),
      });

      const data = await response.json();

      const jarvisResponse: JarvisMessage = {
        id: `jarvis-${Date.now()}`,
        role: 'jarvis',
        content: data.success
          ? data.response.message
          : "I apologize, but I'm experiencing a temporary issue. Please try again in a moment.",
        timestamp: new Date(),
        type: data.response?.type || 'strategy',
      };

      setMessages(prev => [...prev, jarvisResponse]);
    } catch (error) {
      console.error('Jarvis communication error:', error);

      // Fallback response
      const fallbackResponse: JarvisMessage = {
        id: `jarvis-fallback-${Date.now()}`,
        role: 'jarvis',
        content: portfolio
          ? generateAdvisory(portfolio)
          : "I'm currently analyzing network conditions. In the meantime, consider exploring our infrastructure nodes for optimal returns.",
        timestamp: new Date(),
        type: 'advisory',
      };

      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsThinking(false);
    }
  }, [messages, portfolio]);

  // Handle quick action
  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.prompt);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          {/* Main button */}
          <div className={`w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center transition-all ${
            isOpen
              ? 'bg-gradient-to-br from-red-500 to-red-600'
              : 'bg-gradient-to-br from-emerald-500 to-cyan-500'
          }`}>
            {isOpen ? (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {/* Pulse ring when closed */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-ping opacity-30" />
          )}

          {/* Notification badge */}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
              1
            </div>
          )}
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-[#171717] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-white/10"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#1a1a1a] to-[#171717] border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <JarvisAvatar isThinking={isThinking} />
                  <div>
                    <h3 className="font-bold text-white text-lg">JARVIS</h3>
                    <p className="text-xs text-white/50">CTO • Field Nine AI</p>
                  </div>
                </div>
                <EmeraldPulse isActive={true} />
              </div>

              {/* Portfolio summary bar */}
              {portfolio && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full font-bold ${
                    portfolio.tier === 'Emperor'
                      ? 'bg-amber-500/20 text-amber-400'
                      : portfolio.tier === 'Sovereign'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {portfolio.tier}
                  </span>
                  <span className="text-white/50">|</span>
                  <span className="text-white/70">{portfolio.kausBalance.toLocaleString()} KAUS</span>
                  <span className="text-white/50">|</span>
                  <span className="text-emerald-400 font-bold">{portfolio.currentApy}% APY</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-white/50 text-sm pl-10"
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Jarvis is analyzing...</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Action Links - Buy/Withdraw */}
            <div className="px-4 py-3 border-t border-white/5 bg-[#1a1a1a]">
              <div className="text-xs text-white/40 mb-2">빠른 실행</div>
              <div className="flex gap-2">
                <ActionLinkButton
                  actionType="BUY_KAUS"
                  onExecute={handleActionExecute}
                  isExecuting={isExecutingAction}
                />
                <ActionLinkButton
                  actionType="WITHDRAW"
                  onExecute={handleActionExecute}
                  isExecuting={isExecutingAction}
                />
                <ActionLinkButton
                  actionType="STAKE"
                  onExecute={handleActionExecute}
                  isExecuting={isExecutingAction}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-white/5 overflow-x-auto">
              <div className="flex gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    disabled={isThinking}
                    className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-xs text-white/70 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <span>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-[#1a1a1a]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Jarvis anything..."
                  className="flex-1 px-4 py-3 bg-[#171717] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                  disabled={isThinking}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-xs text-white/30 mt-3">
                Powered by Field Nine AI • Prophet Engine v3.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Result Toast */}
      <AnimatePresence>
        {actionResult && (
          <ActionResultToast
            result={actionResult}
            onClose={() => setActionResult(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT JARVIS INDICATOR (for headers/navbars)
// ═══════════════════════════════════════════════════════════════════════════════

export function JarvisIndicator({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-[#171717] rounded-full hover:bg-[#222] transition-all"
    >
      <div className="relative">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-50" />
      </div>
      <span className="text-xs font-medium text-white/80">JARVIS</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFIT ADVISORY BANNER
// ═══════════════════════════════════════════════════════════════════════════════

export function ProfitAdvisoryBanner() {
  const [advisory, setAdvisory] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const portfolio = getUserPortfolio();
    setAdvisory(generateAdvisory(portfolio));
  }, []);

  if (!isVisible || !advisory) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-400 uppercase">Jarvis Advisory</span>
              <span className="text-xs text-white/40">Just now</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{advisory}</p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/40 hover:text-white/60 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

export default JarvisConcierge;
