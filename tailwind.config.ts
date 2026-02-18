import type { Config } from "tailwindcss"

const config = {
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Panopticon Design System - Tesla Style
        background: "#F9F9F7", // Warm Ivory
        foreground: "#171717", // Deep Black
        muted: "#E5E5E0", // Border/Muted
        "muted-foreground": "#737373", // Secondary Text

        // Legacy support
        border: "#E5E5E0",
        input: "#E5E5E0",
        ring: "#171717",

        primary: {
          DEFAULT: "#171717",
          foreground: "#F9F9F7",
        },
        secondary: {
          DEFAULT: "#F9F9F7",
          foreground: "#171717",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#F9F9F7",
        },
        accent: {
          DEFAULT: "#E5E5E0",
          foreground: "#171717",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#171717",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#171717",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.08)',
        'jarvis': '0 0 60px 0 rgba(0, 0, 0, 0.06), 0 4px 24px 0 rgba(0, 0, 0, 0.04)',
      },
      // Safe area insets for iPhone/Android
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
      // Mobile-first breakpoints
      screens: {
        'xs': '375px',
        'mobile': '390px',
        'tablet': '768px',
        'laptop': '1024px',
        'desktop': '1280px',
      },
      // Touch-friendly sizing
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
