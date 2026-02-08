'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 82: TACTILE FEEDBACK HOOK
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * React hook for Apple-Tesla grade tactile feedback
 * - Auto-initializes on first user interaction
 * - Respects user preferences
 * - Provides all feedback methods
 */

import { useCallback, useEffect, useState } from 'react';
import {
  feedback,
  initializeTactileFeedback,
  getTactilePreferences,
  setTactilePreferences,
  type TactileFeedbackOptions,
} from '@/lib/tactile-feedback';

interface UseTactileFeedbackReturn {
  // Feedback methods
  tap: () => void;
  click: () => void;
  success: () => void;
  error: () => void;
  notification: () => void;
  keypad: () => void;
  unlock: () => void;
  lock: () => void;
  mint: () => void;
  burn: () => void;
  transaction: () => void;
  critical: () => void;

  // Preferences
  soundEnabled: boolean;
  hapticEnabled: boolean;
  volume: number;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;

  // Status
  isInitialized: boolean;
  initialize: () => void;
}

export function useTactileFeedback(): UseTactileFeedbackReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [hapticEnabled, setHapticEnabledState] = useState(true);
  const [volume, setVolumeState] = useState(0.5);

  // Load preferences on mount
  useEffect(() => {
    const prefs = getTactilePreferences();
    setSoundEnabledState(prefs.soundEnabled);
    setHapticEnabledState(prefs.hapticEnabled);
    setVolumeState(prefs.volume);
  }, []);

  // Auto-initialize on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      if (!isInitialized) {
        initializeTactileFeedback();
        setIsInitialized(true);
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [isInitialized]);

  // Manual initialize
  const initialize = useCallback(() => {
    if (!isInitialized) {
      initializeTactileFeedback();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Get current options
  const getOptions = useCallback((): TactileFeedbackOptions => ({
    sound: soundEnabled,
    haptic: hapticEnabled,
    volume,
  }), [soundEnabled, hapticEnabled, volume]);

  // Preference setters
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    setTactilePreferences({ soundEnabled: enabled });
  }, []);

  const setHapticEnabled = useCallback((enabled: boolean) => {
    setHapticEnabledState(enabled);
    setTactilePreferences({ hapticEnabled: enabled });
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    setTactilePreferences({ volume: vol });
  }, []);

  // Feedback methods
  const tap = useCallback(() => feedback.tap(getOptions()), [getOptions]);
  const click = useCallback(() => feedback.click(getOptions()), [getOptions]);
  const success = useCallback(() => feedback.success(getOptions()), [getOptions]);
  const error = useCallback(() => feedback.error(getOptions()), [getOptions]);
  const notification = useCallback(() => feedback.notification(getOptions()), [getOptions]);
  const keypad = useCallback(() => feedback.keypad(getOptions()), [getOptions]);
  const unlock = useCallback(() => feedback.unlock(getOptions()), [getOptions]);
  const lock = useCallback(() => feedback.lock(getOptions()), [getOptions]);
  const mint = useCallback(() => feedback.mint(getOptions()), [getOptions]);
  const burn = useCallback(() => feedback.burn(getOptions()), [getOptions]);
  const transaction = useCallback(() => feedback.transaction(getOptions()), [getOptions]);
  const critical = useCallback(() => feedback.critical(getOptions()), [getOptions]);

  return {
    tap,
    click,
    success,
    error,
    notification,
    keypad,
    unlock,
    lock,
    mint,
    burn,
    transaction,
    critical,
    soundEnabled,
    hapticEnabled,
    volume,
    setSoundEnabled,
    setHapticEnabled,
    setVolume,
    isInitialized,
    initialize,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON WRAPPER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  feedbackType?: 'tap' | 'click' | 'success' | 'error';
  children: React.ReactNode;
}

export function TactileButton({
  feedbackType = 'tap',
  onClick,
  children,
  ...props
}: TactileButtonProps) {
  const tactile = useTactileFeedback();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger feedback
      switch (feedbackType) {
        case 'tap':
          tactile.tap();
          break;
        case 'click':
          tactile.click();
          break;
        case 'success':
          tactile.success();
          break;
        case 'error':
          tactile.error();
          break;
      }

      // Call original onClick
      onClick?.(e);
    },
    [feedbackType, tactile, onClick]
  );

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
