/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 80: VISUAL PATHFINDER - ZERO-INSTRUCTION MASTERY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Visual guidance system that replaces text instructions
 * - Animated path indicators
 * - Glowing hotspots for interactive elements
 * - Progressive disclosure of features
 * - Context-aware guidance
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface PathStep {
  id: string;
  target: string; // CSS selector for target element
  label: string;
  description?: string;
  action?: 'click' | 'swipe' | 'input';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface VisualPathfinderProps {
  /** Array of steps to guide through */
  steps: PathStep[];
  /** Currently active step index */
  activeStep: number;
  /** Callback when step changes */
  onStepChange?: (step: number) => void;
  /** Auto-advance to next step on interaction */
  autoAdvance?: boolean;
  /** Show all steps at once */
  showAllSteps?: boolean;
  /** Callback when path completes */
  onComplete?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPOTLIGHT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface SpotlightProps {
  targetSelector: string;
  label: string;
  description?: string;
  action?: 'click' | 'swipe' | 'input';
  position?: 'top' | 'bottom' | 'left' | 'right';
  isActive: boolean;
  stepNumber?: number;
  onTargetClick?: () => void;
}

function Spotlight({
  targetSelector,
  label,
  description,
  action = 'click',
  position = 'bottom',
  isActive,
  stepNumber,
  onTargetClick,
}: SpotlightProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [targetSelector, isActive]);

  if (!isActive || !targetRect) return null;

  const actionIcons = {
    click: '👆',
    swipe: '👉',
    input: '⌨️',
  };

  const tooltipPositions = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '12px' },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '12px' },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '12px' },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '12px' },
  };

  return (
    <>
      {/* Dark overlay with cutout */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 0px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px, rgba(0,0,0,0.7) ${Math.max(targetRect.width, targetRect.height) / 2 + 40}px)`,
        }}
      />

      {/* Glowing ring around target */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed z-[81] pointer-events-none"
        style={{
          left: targetRect.left - 8,
          top: targetRect.top - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          borderRadius: '12px',
        }}
      >
        {/* Pulsing border */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 2px rgba(0,229,255,0.5), 0 0 20px rgba(0,229,255,0.3)',
              '0 0 0 4px rgba(0,229,255,0.8), 0 0 40px rgba(0,229,255,0.5)',
              '0 0 0 2px rgba(0,229,255,0.5), 0 0 20px rgba(0,229,255,0.3)',
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-xl border-2 border-[#00E5FF]"
        />

        {/* Corner indicators */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
          <motion.div
            key={corner}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: corner.includes('right') ? 0.5 : 0 }}
            className={`absolute w-4 h-4 border-2 border-[#00E5FF] ${
              corner === 'top-left' ? 'top-0 left-0 border-r-0 border-b-0 rounded-tl-lg' :
              corner === 'top-right' ? 'top-0 right-0 border-l-0 border-b-0 rounded-tr-lg' :
              corner === 'bottom-left' ? 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg' :
              'bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg'
            }`}
          />
        ))}
      </motion.div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="fixed z-[82] pointer-events-auto"
        style={{
          left: targetRect.left + targetRect.width / 2,
          top: position === 'top' ? targetRect.top - 8 : position === 'bottom' ? targetRect.bottom + 8 : targetRect.top + targetRect.height / 2,
          transform: `translate(-50%, ${position === 'top' ? '-100%' : position === 'bottom' ? '0' : '-50%'})`,
        }}
      >
        <div className="bg-[#171717]/95 backdrop-blur-xl border border-[#00E5FF]/50 rounded-xl px-4 py-3 max-w-xs">
          {/* Step indicator */}
          {stepNumber && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#00E5FF] text-[#171717] text-xs font-bold flex items-center justify-center">
                {stepNumber}
              </div>
              <span className="text-[#00E5FF] text-xs font-bold">STEP {stepNumber}</span>
            </div>
          )}

          {/* Label */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{actionIcons[action]}</span>
            <span className="text-white font-bold">{label}</span>
          </div>

          {/* Description */}
          {description && (
            <p className="text-white/60 text-sm">{description}</p>
          )}

          {/* Action hint */}
          <div className="mt-2 pt-2 border-t border-white/10 text-xs text-[#00E5FF]/70">
            {action === 'click' && 'Tap to continue'}
            {action === 'swipe' && 'Swipe to continue'}
            {action === 'input' && 'Enter value to continue'}
          </div>
        </div>

        {/* Arrow pointing to target */}
        <div
          className={`absolute w-3 h-3 bg-[#171717] border border-[#00E5FF]/50 transform rotate-45 ${
            position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-t-0 border-l-0' :
            position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-b-0 border-r-0' :
            ''
          }`}
        />
      </motion.div>

      {/* Click interceptor */}
      <div
        className="fixed z-[79] cursor-pointer"
        style={{
          left: targetRect.left,
          top: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
        }}
        onClick={onTargetClick}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PATHFINDER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function VisualPathfinder({
  steps,
  activeStep,
  onStepChange,
  autoAdvance = true,
  showAllSteps = false,
  onComplete,
}: VisualPathfinderProps) {
  const handleStepClick = useCallback(() => {
    if (autoAdvance && onStepChange) {
      if (activeStep < steps.length - 1) {
        onStepChange(activeStep + 1);
      } else {
        onComplete?.();
      }
    }
  }, [activeStep, autoAdvance, onStepChange, steps.length, onComplete]);

  if (steps.length === 0) return null;

  return (
    <AnimatePresence>
      {showAllSteps ? (
        steps.map((step, index) => (
          <Spotlight
            key={step.id}
            targetSelector={step.target}
            label={step.label}
            description={step.description}
            action={step.action}
            position={step.position}
            isActive={true}
            stepNumber={index + 1}
            onTargetClick={() => onStepChange?.(index)}
          />
        ))
      ) : (
        <Spotlight
          targetSelector={steps[activeStep].target}
          label={steps[activeStep].label}
          description={steps[activeStep].description}
          action={steps[activeStep].action}
          position={steps[activeStep].position}
          isActive={true}
          stepNumber={activeStep + 1}
          onTargetClick={handleStepClick}
        />
      )}

      {/* Progress indicator */}
      {steps.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[83] flex items-center gap-2"
        >
          {steps.map((_, index) => (
            <motion.div
              key={index}
              animate={{
                scale: index === activeStep ? 1.2 : 1,
                backgroundColor: index <= activeStep ? '#00E5FF' : 'rgba(255,255,255,0.2)',
              }}
              className="w-2 h-2 rounded-full cursor-pointer"
              onClick={() => onStepChange?.(index)}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK GUIDE HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useQuickGuide(guideKey: string) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if guide has been seen before
    const seen = localStorage.getItem(`guide_${guideKey}_seen`);
    if (!seen) {
      // Auto-show guide for new users after a short delay
      const timer = setTimeout(() => setIsActive(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [guideKey]);

  const startGuide = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const completeGuide = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(`guide_${guideKey}_seen`, 'true');
  }, [guideKey]);

  const skipGuide = useCallback(() => {
    setIsActive(false);
    localStorage.setItem(`guide_${guideKey}_seen`, 'true');
  }, [guideKey]);

  return {
    isActive,
    currentStep,
    setCurrentStep,
    startGuide,
    completeGuide,
    skipGuide,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLOATING HINT COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface FloatingHintProps {
  targetSelector: string;
  hint: string;
  icon?: string;
  show: boolean;
}

export function FloatingHint({ targetSelector, hint, icon = '💡', show }: FloatingHintProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!show) return;

    const target = document.querySelector(targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      setPosition({
        x: rect.right + 10,
        y: rect.top + rect.height / 2,
      });
    }
  }, [targetSelector, show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="fixed z-[75] flex items-center gap-2 bg-[#171717]/90 backdrop-blur border border-[#00E5FF]/30 rounded-lg px-3 py-2"
          style={{ left: position.x, top: position.y, transform: 'translateY(-50%)' }}
        >
          <span className="text-lg">{icon}</span>
          <span className="text-sm text-white/80">{hint}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VisualPathfinder;
