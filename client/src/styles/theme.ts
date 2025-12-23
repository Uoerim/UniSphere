/**
 * UniSphere Design System Theme
 * 
 * This file contains the theme configuration for the entire application.
 * Use these values for consistent styling across all components.
 */

export const theme = {
  colors: {
    text: '#020a06',
    background: '#f9fefc',
    primary: '#2fda90',
    secondary: '#7ea6e8',
    accent: '#6c64e3',
  },
  
  // Opacity variants for common use cases
  alpha: {
    text: {
      primary: 'rgba(2, 10, 6, 1)',
      secondary: 'rgba(2, 10, 6, 0.7)',
      muted: 'rgba(2, 10, 6, 0.5)',
      disabled: 'rgba(2, 10, 6, 0.3)',
    },
    primary: {
      solid: 'rgba(47, 218, 144, 1)',
      hover: 'rgba(47, 218, 144, 0.8)',
      light: 'rgba(47, 218, 144, 0.1)',
    },
    secondary: {
      solid: 'rgba(126, 166, 232, 1)',
      hover: 'rgba(126, 166, 232, 0.8)',
      light: 'rgba(126, 166, 232, 0.1)',
    },
    accent: {
      solid: 'rgba(108, 100, 227, 1)',
      hover: 'rgba(108, 100, 227, 0.8)',
      light: 'rgba(108, 100, 227, 0.1)',
    },
  },
  
  // Typography scale
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.15,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing scale (in pixels)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40,
    '3xl': 48,
    '4xl': 64,
    '5xl': 80,
  },
  
  // Border radius
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px rgba(2, 10, 6, 0.05)',
    md: '0 4px 6px rgba(2, 10, 6, 0.07)',
    lg: '0 10px 15px rgba(2, 10, 6, 0.1)',
    xl: '0 20px 25px rgba(2, 10, 6, 0.15)',
    primary: '0 4px 12px rgba(47, 218, 144, 0.2)',
    primaryHover: '0 6px 16px rgba(47, 218, 144, 0.3)',
  },
  
  // Transitions
  transitions: {
    fast: '0.15s ease',
    base: '0.2s ease',
    slow: '0.3s ease',
  },
} as const;

// Type for theme
export type Theme = typeof theme;

// Export individual parts for convenience
export const { colors, alpha, typography, spacing, borderRadius, shadows, transitions } = theme;

export default theme;
