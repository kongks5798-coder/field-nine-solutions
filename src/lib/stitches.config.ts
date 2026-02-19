import { createStitches } from '@stitches/react';

export const {
  styled,
  css,
  globalCss,
  keyframes,
  getCssText,
  theme,
  createTheme,
  config,
} = createStitches({
  theme: {
    colors: {
      bg: '#0e1117',
      bgSidebar: '#161b22',
      bgEditor: '#0d1117',
      bgPanel: '#161b22',
      bgHover: '#21262d',
      bgActive: '#1c2128',
      border: '#30363d',
      borderLight: '#21262d',
      text: '#e6edf3',
      textMuted: '#8b949e',
      textDim: '#6e7681',
      primary: '#238636',
      primaryHover: '#2ea043',
      accent: '#1f6feb',
      accentHover: '#388bfd',
      error: '#f85149',
      errorBg: '#1c0a0a',
      warning: '#d29922',
      success: '#3fb950',
      aiPurple: '#7c3aed',
      aiPurpleLight: '#a78bfa',
      run: '#238636',
      runHover: '#2ea043',
    },
    space: {
      1: '4px', 2: '8px', 3: '12px', 4: '16px',
      5: '20px', 6: '24px', 7: '28px', 8: '32px',
    },
    fontSizes: {
      xs: '11px', sm: '12px', md: '13px', base: '14px', lg: '16px', xl: '18px', '2xl': '22px',
    },
    fonts: {
      mono: '"Fira Code", "JetBrains Mono", Consolas, monospace',
      sans: '"Pretendard", Inter, -apple-system, sans-serif',
    },
    radii: {
      sm: '4px', md: '6px', lg: '10px', full: '9999px',
    },
  },
  media: {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
  },
});

export const globalStyles = globalCss({
  '*': { margin: 0, padding: 0, boxSizing: 'border-box' },
  'html, body': {
    height: '100%',
    background: '#0e1117',
    color: '#e6edf3',
    fontFamily: '"Pretendard", Inter, -apple-system, sans-serif',
    fontSize: '14px',
    WebkitFontSmoothing: 'antialiased',
  },
  '::-webkit-scrollbar': { width: '6px', height: '6px' },
  '::-webkit-scrollbar-track': { background: 'transparent' },
  '::-webkit-scrollbar-thumb': { background: '#30363d', borderRadius: '3px' },
  '::-webkit-scrollbar-thumb:hover': { background: '#8b949e' },
});
