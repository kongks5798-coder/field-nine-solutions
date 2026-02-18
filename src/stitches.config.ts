import { createStitches } from '@stitches/react';

export const { styled, css, globalCss, theme, keyframes, getCssText, config } = createStitches({
  theme: {
    colors: {
      background: '#F9F9F7',
      foreground: '#171717',
      muted: '#E5E5E0',
      primary: '#171717',
      secondary: '#F9F9F7',
      accent: '#4285F4', // Google Blue
      error: '#EA4335', // Google Red
      success: '#34A853', // Google Green
      warning: '#FBBC05', // Google Yellow
    },
    fonts: {
      sans: 'Google Sans, Arial, sans-serif',
    },
    radii: {
      sm: '6px',
      md: '12px',
      lg: '24px',
    },
    space: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '32px',
      xl: '64px',
    },
    fontSizes: {
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '28px',
    },
  },
  utils: {
    px: (value: string | number) => ({ paddingLeft: value, paddingRight: value }),
    py: (value: string | number) => ({ paddingTop: value, paddingBottom: value }),
    mx: (value: string | number) => ({ marginLeft: value, marginRight: value }),
    my: (value: string | number) => ({ marginTop: value, marginBottom: value }),
  },
});
