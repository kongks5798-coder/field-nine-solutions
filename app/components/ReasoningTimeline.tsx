'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Search, Zap, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Reasoning Timeline - Agentic AI Visualization
 * 2026 Trend: Show AI's thinking process
 */
export function ReasoningTimeline() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { id: 1, label: 'Analyzing Request', icon: Search, status: 'active' },
    { id: 2, label: 'Searching Database', icon: Brain, status: 'pending' },
    { id: 3, label: 'Optimizing Solution', icon: Zap, status: 'pending' },
    { id: 4, label: 'Generating Response', icon: Loader2, status: 'pending' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return 0; // Reset
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <h3 className="text-lg font-display font-semibold mb-6 text-[#171717]">
        AI Reasoning Process
      </h3>
      <div className="space-y-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;

          return (
            <div key={step.id} className="flex items-start gap-4">
              {/* Timeline Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-[#E5E7EB]" />
              )}

              {/* Icon */}
              <div className="relative z-10">
                {isCompleted ? (
                  <div className="w-12 h-12 rounded-full bg-[#CC0000]/10 flex items-center justify-center border-2 border-[#CC0000]">
                    <CheckCircle2 className="w-6 h-6 text-[#CC0000]" />
                  </div>
                ) : isActive ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-12 h-12 rounded-full bg-[#CC0000]/20 flex items-center justify-center border-2 border-[#CC0000] animate-tesla-pulse"
                  >
                    <Icon className="w-6 h-6 text-[#CC0000]" />
                  </motion.div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#E5E7EB] flex items-center justify-center border-2 border-[#E5E7EB]">
                    <Icon className="w-6 h-6 text-[#737373]" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-2">
                <p className={`font-medium font-sans ${
                  isActive ? 'text-[#171717]' : 'text-[#737373]'
                }`}>
                  {step.label}
                </p>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs text-[#737373] font-sans"
                  >
                    Processing...
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
