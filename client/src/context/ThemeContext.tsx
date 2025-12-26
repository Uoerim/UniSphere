import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type AccentColor = '#2fda90' | '#3b82f6' | '#8b5cf6' | '#f59e0b' | '#ef4444';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  compactMode: boolean;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setCompactMode: (compact: boolean) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });
  
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem('accentColor') as AccentColor) || '#2fda90';
  });
  
  const [compactMode, setCompactModeState] = useState(() => {
    return localStorage.getItem('compactMode') === 'true';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let resolvedTheme: 'light' | 'dark' = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

      setEffectiveTheme(resolvedTheme);

      if (resolvedTheme === 'dark') {
        // Dark theme - Professional dark color scheme
        // Base colors
        root.style.setProperty('--background', '#0f172a');
        root.style.setProperty('--background-secondary', '#1e293b');
        root.style.setProperty('--background-tertiary', '#334155');
        
        // Text colors
        root.style.setProperty('--text', '#f1f5f9');
        root.style.setProperty('--text-primary', '#f1f5f9');
        root.style.setProperty('--text-secondary', '#94a3b8');
        root.style.setProperty('--text-muted', '#64748b');
        
        // Surface colors
        root.style.setProperty('--white', '#1e293b');
        root.style.setProperty('--card-bg', '#1e293b');
        root.style.setProperty('--sidebar-bg', '#0f172a');
        root.style.setProperty('--header-bg', '#1e293b');
        root.style.setProperty('--modal-bg', '#1e293b');
        root.style.setProperty('--dropdown-bg', '#1e293b');
        root.style.setProperty('--tooltip-bg', '#334155');
        
        // Interactive colors
        root.style.setProperty('--hover-bg', '#334155');
        root.style.setProperty('--active-bg', '#475569');
        root.style.setProperty('--input-bg', '#1e293b');
        root.style.setProperty('--input-border', '#475569');
        root.style.setProperty('--input-focus-border', '#60a5fa');
        
        // Border colors
        root.style.setProperty('--border', '#334155');
        root.style.setProperty('--border-color', '#334155');
        root.style.setProperty('--border-light', '#475569');
        root.style.setProperty('--divider', '#334155');
        
        // Shadow colors
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.4)');
        root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.4)');
        root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.5)');
        
        // Status colors (adjusted for dark theme)
        root.style.setProperty('--success', '#10b981');
        root.style.setProperty('--success-bg', 'rgba(16, 185, 129, 0.15)');
        root.style.setProperty('--warning', '#f59e0b');
        root.style.setProperty('--warning-bg', 'rgba(245, 158, 11, 0.15)');
        root.style.setProperty('--danger', '#ef4444');
        root.style.setProperty('--danger-bg', 'rgba(239, 68, 68, 0.15)');
        root.style.setProperty('--info', '#3b82f6');
        root.style.setProperty('--info-bg', 'rgba(59, 130, 246, 0.15)');
        
        // Secondary colors
        root.style.setProperty('--secondary', '#94a3b8');
        root.style.setProperty('--secondary-bg', 'rgba(148, 163, 184, 0.15)');
        
        // Table colors
        root.style.setProperty('--table-header-bg', '#1e293b');
        root.style.setProperty('--table-row-hover', '#334155');
        root.style.setProperty('--table-stripe', '#1e293b');
        
        // Scrollbar colors
        root.style.setProperty('--scrollbar-track', '#1e293b');
        root.style.setProperty('--scrollbar-thumb', '#475569');
        root.style.setProperty('--scrollbar-thumb-hover', '#64748b');
        
        root.classList.add('dark-theme');
        root.classList.remove('light-theme');
      } else {
        // Light theme - Professional light color scheme
        // Base colors
        root.style.setProperty('--background', '#f8fafc');
        root.style.setProperty('--background-secondary', '#f1f5f9');
        root.style.setProperty('--background-tertiary', '#e2e8f0');
        
        // Text colors
        root.style.setProperty('--text', '#1a1f36');
        root.style.setProperty('--text-primary', '#1a1f36');
        root.style.setProperty('--text-secondary', '#6b7280');
        root.style.setProperty('--text-muted', '#9ca3af');
        
        // Surface colors
        root.style.setProperty('--white', '#ffffff');
        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--sidebar-bg', '#ffffff');
        root.style.setProperty('--header-bg', '#ffffff');
        root.style.setProperty('--modal-bg', '#ffffff');
        root.style.setProperty('--dropdown-bg', '#ffffff');
        root.style.setProperty('--tooltip-bg', '#1a1f36');
        
        // Interactive colors
        root.style.setProperty('--hover-bg', '#f1f5f9');
        root.style.setProperty('--active-bg', '#e2e8f0');
        root.style.setProperty('--input-bg', '#ffffff');
        root.style.setProperty('--input-border', '#e2e8f0');
        root.style.setProperty('--input-focus-border', '#3b82f6');
        
        // Border colors
        root.style.setProperty('--border', '#e2e8f0');
        root.style.setProperty('--border-color', '#e2e8f0');
        root.style.setProperty('--border-light', '#f3f4f6');
        root.style.setProperty('--divider', '#e5e7eb');
        
        // Shadow colors
        root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.05)');
        root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.07)');
        root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.1)');
        
        // Status colors
        root.style.setProperty('--success', '#10b981');
        root.style.setProperty('--success-bg', '#ecfdf5');
        root.style.setProperty('--warning', '#f59e0b');
        root.style.setProperty('--warning-bg', '#fffbeb');
        root.style.setProperty('--danger', '#ef4444');
        root.style.setProperty('--danger-bg', '#fef2f2');
        root.style.setProperty('--info', '#3b82f6');
        root.style.setProperty('--info-bg', '#eff6ff');
        
        // Secondary colors
        root.style.setProperty('--secondary', '#64748b');
        root.style.setProperty('--secondary-bg', '#f1f5f9');
        
        // Table colors
        root.style.setProperty('--table-header-bg', '#f8fafc');
        root.style.setProperty('--table-row-hover', '#f1f5f9');
        root.style.setProperty('--table-stripe', '#fafafa');
        
        // Scrollbar colors
        root.style.setProperty('--scrollbar-track', '#f1f5f9');
        root.style.setProperty('--scrollbar-thumb', '#cbd5e1');
        root.style.setProperty('--scrollbar-thumb-hover', '#94a3b8');
        
        root.classList.add('light-theme');
        root.classList.remove('dark-theme');
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    // Listen for system theme changes when using 'system' theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  // Apply accent color
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', accentColor);
    root.style.setProperty('--primary-color', accentColor);
    
    // Calculate hover color (slightly darker)
    const hoverColor = adjustBrightness(accentColor, -15);
    root.style.setProperty('--primary-hover', hoverColor);
    root.style.setProperty('--primary-dark', hoverColor);
    
    // Light variant for backgrounds
    root.style.setProperty('--primary-light', `${accentColor}1a`);
    
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  // Apply compact mode
  useEffect(() => {
    document.documentElement.classList.toggle('compact-mode', compactMode);
    localStorage.setItem('compactMode', String(compactMode));
  }, [compactMode]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
  };

  const setCompactMode = (compact: boolean) => {
    setCompactModeState(compact);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      accentColor,
      compactMode,
      setTheme,
      setAccentColor,
      setCompactMode,
      effectiveTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
