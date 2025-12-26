"use client";
import React from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

/**
 * Material 3 Expressive Theme
 * Uses tonal color system with larger corner radii and bold typography
 */

// Use concrete colors in the MUI theme.
// MUI v5 will parse/manipulate colors during SSR/static prerender; CSS var() strings can crash builds.
// We still export these into CSS variables via CssBaseline so Tailwind stays aligned.
const md = {
  primary: '#7c4dff',
  onPrimary: '#ffffff',
  secondary: '#03dac6',
  onSecondary: '#000000',
  surface: '#0f1724',
  onSurface: '#ffffff',
  background: '#0b1020',
  outline: 'rgba(255,255,255,0.08)',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

// Create the expressive theme with MD3 tokens
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: md.primary,
      contrastText: md.onPrimary,
    },
    secondary: {
      main: md.secondary,
      contrastText: md.onSecondary,
    },
    error: {
      main: md.error,
      contrastText: md.onPrimary,
    },
    warning: {
      main: md.warning,
      contrastText: md.onPrimary,
    },
    success: {
      main: md.success,
      contrastText: md.onPrimary,
    },
    background: {
      default: md.background,
      paper: md.surface,
    },
    // Surfaces for semantic elevation
    action: {
      active: md.primary,
      hover: 'rgba(255,255,255,0.06)',
      selected: 'rgba(255,255,255,0.10)',
      disabled: 'rgba(255,255,255,0.38)',
      disabledBackground: 'rgba(255,255,255,0.12)',
    },
  },
  
  // MD3 Expressive: larger corner radii for bold, expressive look
  shape: {
    borderRadius: 16,
  },
  
  typography: {
    fontFamily: ['var(--font-roboto)', 'Roboto', 'system-ui', '-apple-system', 'sans-serif'].join(','),
    
    // MD3-ish mapping using MUI slots
    // h1..h3 => Display, h4..h6 => Headline
    h1: {
      fontSize: '3.5625rem', // 57px (Display Large)
      fontWeight: 600,
      letterSpacing: '-0.25px',
      lineHeight: '4rem',
    },
    h2: {
      fontSize: '2.8125rem', // 45px (Display Medium)
      fontWeight: 600,
      letterSpacing: '0px',
      lineHeight: '3.25rem',
    },
    h3: {
      fontSize: '2.25rem', // 36px (Display Small)
      fontWeight: 600,
      letterSpacing: '0px',
      lineHeight: '2.75rem',
    },
    h4: {
      fontSize: '2rem', // 32px (Headline Large)
      fontWeight: 600,
      letterSpacing: '0px',
      lineHeight: '2.5rem',
    },
    h5: {
      fontSize: '1.75rem', // 28px (Headline Medium)
      fontWeight: 600,
      letterSpacing: '0px',
      lineHeight: '2.25rem',
    },
    h6: {
      fontSize: '1.5rem', // 24px (Headline Small)
      fontWeight: 600,
      letterSpacing: '0px',
      lineHeight: '2rem',
    },
    
    // Body styles
    body1: {
      fontSize: '0.9375rem',
      fontWeight: 400,
      letterSpacing: '0.25px',
      lineHeight: '1.5rem',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '0.25px',
      lineHeight: '1.25rem',
    },
    
    // Label styles (buttons, tags)
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.1px',
      lineHeight: '1.25rem',
      textTransform: 'none', // MD3 uses normal case, not UPPERCASE
    },
    
    subtitle1: {
      fontSize: '0.9375rem',
      fontWeight: 600,
      letterSpacing: 0.015,
      lineHeight: '1.5rem',
    },
    subtitle2: {
      fontSize: '0.8125rem',
      fontWeight: 600,
      letterSpacing: '0.1px',
      lineHeight: '1.25rem',
    },
    
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      letterSpacing: 0.4,
      lineHeight: '1rem',
    },
  },
  
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--md-sys-color-primary': md.primary,
          '--md-sys-color-on-primary': md.onPrimary,
          '--md-sys-color-secondary': md.secondary,
          '--md-sys-color-on-secondary': md.onSecondary,
          '--md-sys-color-surface': md.surface,
          '--md-sys-color-on-surface': md.onSurface,
          '--md-sys-color-background': md.background,
          '--md-sys-color-outline': md.outline,
          '--md-sys-color-error': md.error,
          '--md-sys-color-success': md.success,
          '--md-sys-color-warning': md.warning,
        },
        body: {
          backgroundColor: md.background,
          color: md.onSurface,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },

    // Buttons: use filled tonal style by default (MD3 Expressive)
    MuiButton: {
      defaultProps: {
        disableElevation: false,
      },
      styleOverrides: {
        root: {
          borderRadius: '999px', // MD3 pill buttons
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 600,
          padding: '10px 24px',
        },
        contained: {
          background: md.primary,
          color: md.onPrimary,
          boxShadow: 'var(--md-elevation-1)',
          '&:hover': {
            boxShadow: 'var(--md-elevation-2)',
          },
        },
        containedSecondary: {
          background: md.secondary,
          color: md.onSecondary,
        },
        outlined: {
          borderColor: md.outline,
          color: md.primary,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.06)',
          },
        },
        text: {
          color: md.primary,
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.06)',
          },
        },
      },
    },

    MuiButtonBase: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    
    // Cards: elevated surfaces with proper padding
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          backgroundColor: md.surface,
          border: `1px solid ${md.outline}`,
          boxShadow: 'var(--md-elevation-1)',
        },
      },
    },
    
    // Paper: elevated surfaces
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'unset',
          backgroundColor: md.surface,
          border: `1px solid ${md.outline}`,
        },
        elevation0: {
          backgroundColor: md.surface,
          boxShadow: 'none',
        },
        elevation1: {
          backgroundColor: md.surface,
          boxShadow: 'var(--md-elevation-1)',
        },
        elevation2: {
          backgroundColor: md.surface,
          boxShadow: 'var(--md-elevation-2)',
        },
        elevation3: {
          backgroundColor: md.surface,
          boxShadow: 'var(--md-elevation-3)',
        },
      },
    },

    // AppBar (Top app bar)
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: md.surface,
          color: md.onSurface,
          borderBottom: `1px solid ${md.outline}`,
        },
      },
    },

    // Drawer / Navigation rail-like styling
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: md.surface,
          borderRight: `1px solid ${md.outline}`,
        },
      },
    },

    // Lists and nav items
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          marginLeft: 8,
          marginRight: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(255,255,255,0.10)',
          },
          '&.Mui-selected:hover': {
            backgroundColor: 'rgba(255,255,255,0.14)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: 'rgba(255,255,255,0.70)',
        },
      },
    },

    // Inputs (Outlined)
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.06)',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: md.outline,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: md.primary,
            borderWidth: 2,
          },
        },
        notchedOutline: {
          borderColor: md.outline,
        },
        input: {
          paddingTop: 14,
          paddingBottom: 14,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(255,255,255,0.70)',
          '&.Mui-focused': {
            color: md.primary,
          },
        },
      },
    },
    
    // Chips
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontSize: '0.8125rem',
          fontWeight: 600,
        },
        filled: {
          backgroundColor: 'rgba(255,255,255,0.08)',
          color: md.onSurface,
        },
        outlined: {
          borderColor: md.outline,
          color: md.onSurface,
        },
      },
    },
    
    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          backgroundColor: md.surface,
        },
      },
    },
  },
});

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default theme;
