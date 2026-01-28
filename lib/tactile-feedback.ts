/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 82: TACTILE FEEDBACK SYSTEM - APPLE-TESLA GRADE UX
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Premium haptic and audio feedback for sovereign-grade interactions
 * - Web Audio API for metallic/glass sound effects
 * - Navigator.vibrate for precise haptic patterns
 * - Dynamic refraction visual feedback
 *
 * Reference: Apple Taptic Engine + Tesla UI Sound Design
 */

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO CONTEXT SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch (e) {
      console.warn('[TactileFeedback] Web Audio not supported:', e);
      return null;
    }
  }

  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  return audioContext;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND SYNTHESIS - METALLIC/GLASS TONES
// ═══════════════════════════════════════════════════════════════════════════════

type SoundType =
  | 'tap'           // Light tap - button press
  | 'click'         // Mechanical click - toggle/switch
  | 'success'       // Success chime - transaction complete
  | 'error'         // Error buzz - validation failure
  | 'notification'  // Alert tone - system notification
  | 'mint'          // Token mint - ascending tone
  | 'burn'          // Token burn - descending tone
  | 'transaction'   // Exchange - dual tone
  | 'keypad'        // Keypad press - numeric entry
  | 'unlock'        // Vault unlock - complex sequence
  | 'lock';         // Vault lock - reverse sequence

interface SoundConfig {
  frequencies: number[];
  durations: number[];
  gains: number[];
  type: OscillatorType;
  filterFreq?: number;
  filterQ?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  tap: {
    frequencies: [2400, 1800],
    durations: [0.02, 0.04],
    gains: [0.08, 0.04],
    type: 'sine',
    filterFreq: 3000,
  },
  click: {
    frequencies: [3200, 2000, 1200],
    durations: [0.01, 0.02, 0.03],
    gains: [0.1, 0.06, 0.03],
    type: 'square',
    filterFreq: 4000,
    filterQ: 2,
  },
  success: {
    frequencies: [880, 1100, 1320, 1760],
    durations: [0.1, 0.1, 0.1, 0.15],
    gains: [0.12, 0.12, 0.12, 0.15],
    type: 'sine',
    filterFreq: 5000,
  },
  error: {
    frequencies: [200, 180, 160],
    durations: [0.05, 0.05, 0.1],
    gains: [0.15, 0.12, 0.08],
    type: 'sawtooth',
    filterFreq: 800,
    filterQ: 5,
  },
  notification: {
    frequencies: [1500, 1800, 1500],
    durations: [0.08, 0.08, 0.12],
    gains: [0.1, 0.12, 0.08],
    type: 'sine',
    filterFreq: 4000,
  },
  mint: {
    frequencies: [440, 554, 659, 880, 1100],
    durations: [0.08, 0.08, 0.08, 0.08, 0.16],
    gains: [0.1, 0.1, 0.12, 0.14, 0.18],
    type: 'sine',
    filterFreq: 6000,
  },
  burn: {
    frequencies: [880, 659, 554, 440, 330],
    durations: [0.08, 0.08, 0.08, 0.08, 0.16],
    gains: [0.14, 0.12, 0.1, 0.08, 0.06],
    type: 'triangle',
    filterFreq: 3000,
  },
  transaction: {
    frequencies: [1000, 1200],
    durations: [0.1, 0.15],
    gains: [0.12, 0.1],
    type: 'sine',
    filterFreq: 4000,
  },
  keypad: {
    frequencies: [1800, 2200],
    durations: [0.015, 0.025],
    gains: [0.06, 0.03],
    type: 'sine',
    filterFreq: 3500,
  },
  unlock: {
    frequencies: [800, 1000, 1200, 1400, 1600, 2000],
    durations: [0.05, 0.05, 0.05, 0.05, 0.05, 0.15],
    gains: [0.08, 0.08, 0.1, 0.1, 0.12, 0.16],
    type: 'sine',
    filterFreq: 5000,
  },
  lock: {
    frequencies: [2000, 1600, 1400, 1200, 1000, 600],
    durations: [0.05, 0.05, 0.05, 0.05, 0.05, 0.15],
    gains: [0.12, 0.1, 0.1, 0.08, 0.08, 0.06],
    type: 'triangle',
    filterFreq: 3000,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HAPTIC PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

type HapticPattern =
  | 'light'       // 10ms - subtle tap
  | 'medium'      // 25ms - standard press
  | 'heavy'       // 50ms - strong confirmation
  | 'success'     // [20, 50, 40] - positive feedback
  | 'error'       // [50, 30, 50, 30, 80] - alert pattern
  | 'notification'// [30, 30, 30] - triple pulse
  | 'keypad'      // 15ms - quick numeric entry
  | 'unlock'      // Complex ascending pattern
  | 'lock'        // Complex descending pattern
  | 'transaction' // Smooth confirmation
  | 'critical';   // Urgent attention

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [20, 50, 40, 50, 60],
  error: [50, 30, 50, 30, 80],
  notification: [30, 30, 30, 30, 30],
  keypad: 15,
  unlock: [20, 30, 25, 30, 30, 30, 35, 30, 40, 30, 50],
  lock: [50, 30, 40, 30, 35, 30, 30, 30, 25, 30, 20],
  transaction: [30, 50, 50, 50, 80],
  critical: [100, 50, 100, 50, 200],
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN API
// ═══════════════════════════════════════════════════════════════════════════════

export interface TactileFeedbackOptions {
  sound?: boolean;
  haptic?: boolean;
  volume?: number; // 0-1
}

const defaultOptions: TactileFeedbackOptions = {
  sound: true,
  haptic: true,
  volume: 0.5,
};

/**
 * Play a synthesized sound effect
 */
export function playSound(type: SoundType, volume: number = 0.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const config = SOUND_CONFIGS[type];
  let startTime = ctx.currentTime;

  config.frequencies.forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.type = config.type;
    oscillator.frequency.value = freq;

    filter.type = 'lowpass';
    filter.frequency.value = config.filterFreq || 5000;
    filter.Q.value = config.filterQ || 1;

    const gain = config.gains[i] * volume;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.durations[i]);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + config.durations[i] + 0.01);

    startTime += config.durations[i];
  });
}

/**
 * Trigger haptic feedback pattern
 */
export function triggerHaptic(pattern: HapticPattern): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

  const vibrationPattern = HAPTIC_PATTERNS[pattern];
  navigator.vibrate(vibrationPattern);
}

/**
 * Combined tactile feedback - both sound and haptic
 */
export function tactileFeedback(
  type: SoundType,
  hapticPattern?: HapticPattern,
  options?: TactileFeedbackOptions
): void {
  const opts = { ...defaultOptions, ...options };

  if (opts.sound) {
    playSound(type, opts.volume);
  }

  if (opts.haptic) {
    const pattern = hapticPattern || (type as HapticPattern);
    if (pattern in HAPTIC_PATTERNS) {
      triggerHaptic(pattern as HapticPattern);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET FEEDBACK FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const feedback = {
  /** Light tap for button press */
  tap: (options?: TactileFeedbackOptions) =>
    tactileFeedback('tap', 'light', options),

  /** Mechanical click for toggles */
  click: (options?: TactileFeedbackOptions) =>
    tactileFeedback('click', 'medium', options),

  /** Success confirmation */
  success: (options?: TactileFeedbackOptions) =>
    tactileFeedback('success', 'success', options),

  /** Error/validation failure */
  error: (options?: TactileFeedbackOptions) =>
    tactileFeedback('error', 'error', options),

  /** System notification */
  notification: (options?: TactileFeedbackOptions) =>
    tactileFeedback('notification', 'notification', options),

  /** Keypad digit entry */
  keypad: (options?: TactileFeedbackOptions) =>
    tactileFeedback('keypad', 'keypad', options),

  /** Vault unlock sequence */
  unlock: (options?: TactileFeedbackOptions) =>
    tactileFeedback('unlock', 'unlock', options),

  /** Vault lock sequence */
  lock: (options?: TactileFeedbackOptions) =>
    tactileFeedback('lock', 'lock', options),

  /** Token mint operation */
  mint: (options?: TactileFeedbackOptions) =>
    tactileFeedback('mint', 'success', options),

  /** Token burn operation */
  burn: (options?: TactileFeedbackOptions) =>
    tactileFeedback('burn', 'heavy', options),

  /** Exchange transaction */
  transaction: (options?: TactileFeedbackOptions) =>
    tactileFeedback('transaction', 'transaction', options),

  /** Critical alert */
  critical: (options?: TactileFeedbackOptions) =>
    tactileFeedback('error', 'critical', options),
};

// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK PREFERENCE STORAGE
// ═══════════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'f9_tactile_prefs';

interface TactilePreferences {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  volume: number;
}

export function getTactilePreferences(): TactilePreferences {
  if (typeof localStorage === 'undefined') {
    return { soundEnabled: true, hapticEnabled: true, volume: 0.5 };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }

  return { soundEnabled: true, hapticEnabled: true, volume: 0.5 };
}

export function setTactilePreferences(prefs: Partial<TactilePreferences>): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const current = getTactilePreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Initialize audio context on first user interaction
 * Call this on a click/touch event to comply with browser autoplay policies
 */
export function initializeTactileFeedback(): void {
  getAudioContext();
}
