/**
 * K-UNIVERSAL Tesla Design System
 * Minimalist design tokens inspired by Tesla's aesthetic
 *
 * Features:
 * - Warm Ivory backgrounds (#F9F9F7)
 * - Deep Black text (#171717)
 * - No Skyscanner Blue (removed #00A3FF)
 * - Premium typography
 * - Extreme whitespace utilization
 */

// ============================================
// Color Palette
// ============================================

export const colors = {
  // Primary Backgrounds
  background: {
    primary: '#F9F9F7',      // Warm Ivory - main background
    secondary: '#FFFFFF',    // Pure White - card backgrounds
    tertiary: '#F5F5F4',     // Light Gray - subtle sections
    inverse: '#171717',      // Deep Black - dark sections
  },

  // Text Colors
  text: {
    primary: '#171717',       // Deep Black - main text
    secondary: 'rgba(23, 23, 23, 0.7)',   // 70% opacity
    muted: 'rgba(23, 23, 23, 0.4)',       // 40% opacity
    inverse: '#FFFFFF',       // White - on dark backgrounds
    inverseSecondary: 'rgba(255, 255, 255, 0.7)',
  },

  // Border Colors
  border: {
    light: 'rgba(23, 23, 23, 0.1)',    // 10% opacity
    medium: 'rgba(23, 23, 23, 0.2)',   // 20% opacity
    focus: '#171717',                   // Solid black for focus states
  },

  // Accent Colors (minimal usage)
  accent: {
    naver: '#03C75A',         // Naver Green - for price matching badge only
    success: '#22C55E',       // Green - success states
    warning: '#F59E0B',       // Amber - warning states
    error: '#EF4444',         // Red - error states
    info: '#171717',          // Black - info (no blue!)
  },

  // Interactive States
  interactive: {
    hover: 'rgba(23, 23, 23, 0.05)',
    active: 'rgba(23, 23, 23, 0.1)',
    disabled: 'rgba(23, 23, 23, 0.3)',
  },
} as const;

// ============================================
// Typography
// ============================================

export const typography = {
  // Font Families
  fontFamily: {
    sans: '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },

  // Font Sizes (rem)
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },

  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

// ============================================
// Spacing
// ============================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
} as const;

// ============================================
// Border Radius
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',   // Pill shape
} as const;

// ============================================
// Shadows
// ============================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(23, 23, 23, 0.05)',
  md: '0 4px 6px rgba(23, 23, 23, 0.05)',
  lg: '0 10px 15px rgba(23, 23, 23, 0.05)',
  xl: '0 20px 25px rgba(23, 23, 23, 0.05)',
  '2xl': '0 25px 50px rgba(23, 23, 23, 0.1)',
} as const;

// ============================================
// Transitions
// ============================================

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '300ms ease-in-out',
  slow: '500ms ease-in-out',
} as const;

// ============================================
// Breakpoints
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// Component Styles (CSS-in-JS ready)
// ============================================

export const componentStyles = {
  // Button Styles
  button: {
    primary: {
      backgroundColor: colors.background.inverse,
      color: colors.text.inverse,
      borderRadius: borderRadius.lg,
      padding: `${spacing[3]} ${spacing[6]}`,
      fontWeight: typography.fontWeight.medium,
      transition: transitions.fast,
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.text.primary,
      border: `1px solid ${colors.border.medium}`,
      borderRadius: borderRadius.lg,
      padding: `${spacing[3]} ${spacing[6]}`,
      fontWeight: typography.fontWeight.medium,
      transition: transitions.fast,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: colors.text.secondary,
      borderRadius: borderRadius.lg,
      padding: `${spacing[3]} ${spacing[6]}`,
      fontWeight: typography.fontWeight.medium,
      transition: transitions.fast,
    },
  },

  // Card Styles
  card: {
    default: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.xl,
      padding: spacing[6],
      boxShadow: shadows.sm,
    },
    elevated: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.xl,
      padding: spacing[6],
      boxShadow: shadows.md,
    },
    outlined: {
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.xl,
      padding: spacing[6],
      border: `1px solid ${colors.border.light}`,
    },
  },

  // Input Styles
  input: {
    default: {
      backgroundColor: colors.background.secondary,
      border: `1px solid ${colors.border.light}`,
      borderRadius: borderRadius.lg,
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: typography.fontSize.base,
      transition: transitions.fast,
    },
    focused: {
      borderColor: colors.border.focus,
      outline: 'none',
    },
  },

  // Badge Styles
  badge: {
    naver: {
      backgroundColor: colors.accent.naver,
      color: colors.text.inverse,
      borderRadius: borderRadius.sm,
      padding: `${spacing[1]} ${spacing[2]}`,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
    },
    neutral: {
      backgroundColor: colors.background.tertiary,
      color: colors.text.secondary,
      borderRadius: borderRadius.sm,
      padding: `${spacing[1]} ${spacing[2]}`,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.medium,
    },
  },
} as const;

// ============================================
// Tailwind CSS Class Utilities
// ============================================

export const tw = {
  // Background classes
  bg: {
    primary: 'bg-[#F9F9F7]',
    secondary: 'bg-white',
    tertiary: 'bg-stone-100',
    inverse: 'bg-neutral-900',
  },

  // Text classes
  text: {
    primary: 'text-neutral-900',
    secondary: 'text-neutral-900/70',
    muted: 'text-neutral-900/40',
    inverse: 'text-white',
  },

  // Border classes
  border: {
    light: 'border-neutral-900/10',
    medium: 'border-neutral-900/20',
    focus: 'focus:border-neutral-900',
  },

  // Common component combinations
  button: {
    primary: 'bg-neutral-900 text-white rounded-lg px-6 py-3 font-medium transition-all hover:bg-neutral-800',
    secondary: 'bg-transparent text-neutral-900 border border-neutral-900/20 rounded-lg px-6 py-3 font-medium transition-all hover:bg-neutral-900/5',
    ghost: 'bg-transparent text-neutral-900/70 rounded-lg px-6 py-3 font-medium transition-all hover:text-neutral-900 hover:bg-neutral-900/5',
  },

  card: {
    default: 'bg-white rounded-xl p-6 shadow-sm',
    elevated: 'bg-white rounded-xl p-6 shadow-md',
    outlined: 'bg-white rounded-xl p-6 border border-neutral-900/10',
  },

  input: {
    default: 'bg-white border border-neutral-900/10 rounded-lg px-4 py-3 text-base transition-all focus:border-neutral-900 focus:outline-none',
  },

  badge: {
    naver: 'bg-[#03C75A] text-white rounded px-2 py-1 text-xs font-medium',
    neutral: 'bg-stone-100 text-neutral-900/70 rounded px-2 py-1 text-xs font-medium',
  },
} as const;

// ============================================
// Price Display Helpers
// ============================================

export const priceStyles = {
  // Main price display
  mainPrice: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    letterSpacing: typography.letterSpacing.tight,
  },

  // Per night/person suffix
  priceSuffix: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.muted,
  },

  // Strikethrough original price
  originalPrice: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.text.muted,
    textDecoration: 'line-through',
  },

  // Discount percentage
  discountBadge: {
    backgroundColor: colors.accent.naver,
    color: colors.text.inverse,
    borderRadius: borderRadius.sm,
    padding: `${spacing[1]} ${spacing[2]}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
} as const;

// ============================================
// Design System Exports
// ============================================

export const teslaDesignSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  componentStyles,
  tw,
  priceStyles,
} as const;

export default teslaDesignSystem;
