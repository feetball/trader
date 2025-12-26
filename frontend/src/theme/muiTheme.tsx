"use client";
import React from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

/**
 * Material 3 Expressive Theme
 * Uses tonal color system with larger corner radii and bold typography
 */

// MD3 Expressive Dark color tokens (seed: #7c4dff / Purple)
const md3Colors = {
  // Primary tonal palette
  primary: '#7c4dff',
  primaryContainer: '#5d3fa8',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#eaddff',
  
  // Secondary tonal palette
  secondary: '#03dac6',
  secondaryContainer: '#008b7e',
  onSecondary: '#000000',
  onSecondaryContainer: '#c1f8f4',
  
  // Tertiary tonal palette (accent)
  tertiary: '#ffb84d',
  tertiaryContainer: '#cc7d1a',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#fff8f1',
  
  // Neutral surfaces (grays for MD3 dark)
  background: '#0b1020',
  surface: '#0f1724',
  surfaceDim: '#0b1020',
  surface1: '#161d32',
  surface2: '#1a2237',
  surface3: '#1f273f',
  surface4: '#202847',
  surface5: '#25304f',
  
  // On-surface colors
  onSurface: '#e7e0eb',
  onSurfaceVariant: '#c8c1d0',
  outline: '#928f99',
  outlineVariant: '#49454e',
  
  // Error semantic
  error: '#ef4444',
  errorContainer: '#8c1c13',
  onError: '#ffffff',
  onErrorContainer: '#f9dedc',
  
  // Success semantic (for gains)
  success: '#4caf50',
  successContainer: '#2e7d32',
  onSuccess: '#ffffff',
  
  // Warning semantic
  warning: '#ff9800',
  warningContainer: '#e65100',
  onWarning: '#ffffff',
};

// Create the expressive theme with MD3 tokens
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: md3Colors.primary,
      light: '#b699ff',
      dark: '#5d3fa8',
      contrastText: md3Colors.onPrimary,
    },
    secondary: {
      main: md3Colors.secondary,
      light: '#4dd9d0',
      dark: '#008b7e',
      contrastText: md3Colors.onSecondary,
    },
    error: {
      main: md3Colors.error,
      dark: '#8c1c13',
      contrastText: md3Colors.onError,
    },
    warning: {
      main: md3Colors.warning,
      dark: md3Colors.warningContainer,
      contrastText: md3Colors.onWarning,
    },
    success: {
      main: md3Colors.success,
      dark: md3Colors.successContainer,
      contrastText: md3Colors.onSuccess,
    },
    background: {
      default: md3Colors.background,
      paper: md3Colors.surface,
    },
    // Surfaces for semantic elevation
    action: {
      active: md3Colors.primary,
      hover: `${md3Colors.primary}1a`,
      selected: `${md3Colors.primary}26`,
      disabled: `${md3Colors.onSurface}38`,
      disabledBackground: `${md3Colors.onSurface}12`,
    },
  },
  
  // MD3 Expressive: larger corner radii for bold, expressive look
  shape: {
    borderRadius: 16,
  },
  
  typography: {
    fontFamily: ['Inter', 'Roboto', '-apple-system', 'sans-serif'].join(','),
    
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
          '--md-sys-color-primary': md3Colors.primary,
          '--md-sys-color-on-primary': md3Colors.onPrimary,
          '--md-sys-color-primary-container': md3Colors.primaryContainer,
          '--md-sys-color-on-primary-container': md3Colors.onPrimaryContainer,

          '--md-sys-color-secondary': md3Colors.secondary,
          '--md-sys-color-on-secondary': md3Colors.onSecondary,
          '--md-sys-color-secondary-container': md3Colors.secondaryContainer,
          '--md-sys-color-on-secondary-container': md3Colors.onSecondaryContainer,

          '--md-sys-color-tertiary': md3Colors.tertiary,
          '--md-sys-color-on-tertiary': md3Colors.onTertiary,
          '--md-sys-color-tertiary-container': md3Colors.tertiaryContainer,
          '--md-sys-color-on-tertiary-container': md3Colors.onTertiaryContainer,

          '--md-sys-color-surface': md3Colors.surface,
          '--md-sys-color-surface-1': md3Colors.surface1,
          '--md-sys-color-surface-2': md3Colors.surface2,
          '--md-sys-color-surface-3': md3Colors.surface3,
          '--md-sys-color-surface-4': md3Colors.surface4,
          '--md-sys-color-surface-5': md3Colors.surface5,
          '--md-sys-color-on-surface': md3Colors.onSurface,
          '--md-sys-color-on-surface-variant': md3Colors.onSurfaceVariant,
          '--md-sys-color-outline': md3Colors.outline,
          '--md-sys-color-outline-variant': md3Colors.outlineVariant,
        },
        body: {
          backgroundColor: md3Colors.background,
          color: md3Colors.onSurface,
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
          background: `linear-gradient(135deg, ${md3Colors.primary}, ${md3Colors.primaryContainer})`,
          color: md3Colors.onPrimary,
          boxShadow: '0 2px 8px rgba(124, 77, 255, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(124, 77, 255, 0.3)',
          },
        },
        containedSecondary: {
          background: md3Colors.secondary,
          color: md3Colors.onSecondary,
        },
        outlined: {
          borderColor: md3Colors.outline,
          color: md3Colors.primary,
          '&:hover': {
            backgroundColor: `${md3Colors.primary}12`,
          },
        },
        text: {
          color: md3Colors.primary,
          '&:hover': {
            backgroundColor: `${md3Colors.primary}12`,
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
          backgroundColor: md3Colors.surface2,
          border: `1px solid ${md3Colors.outlineVariant}`,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    
    // Paper: elevated surfaces
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'unset',
          backgroundColor: md3Colors.surface2,
          border: `1px solid ${md3Colors.outlineVariant}`,
        },
        elevation0: {
          backgroundColor: md3Colors.surface,
          boxShadow: 'none',
        },
        elevation1: {
          backgroundColor: md3Colors.surface1,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        },
        elevation2: {
          backgroundColor: md3Colors.surface2,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
        },
        elevation3: {
          backgroundColor: md3Colors.surface3,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        },
      },
    },

    // AppBar (Top app bar)
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: md3Colors.surface2,
          color: md3Colors.onSurface,
          borderBottom: `1px solid ${md3Colors.outlineVariant}`,
        },
      },
    },

    // Drawer / Navigation rail-like styling
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: md3Colors.surface1,
          borderRight: `1px solid ${md3Colors.outlineVariant}`,
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
            backgroundColor: `${md3Colors.primary}26`,
          },
          '&.Mui-selected:hover': {
            backgroundColor: `${md3Colors.primary}33`,
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: md3Colors.onSurfaceVariant,
        },
      },
    },

    // Inputs (Outlined)
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: md3Colors.surface3,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: md3Colors.outline,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: md3Colors.primary,
            borderWidth: 2,
          },
        },
        notchedOutline: {
          borderColor: md3Colors.outlineVariant,
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
          color: md3Colors.onSurfaceVariant,
          '&.Mui-focused': {
            color: md3Colors.primary,
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
          backgroundColor: md3Colors.surface3,
          color: md3Colors.onSurface,
        },
        outlined: {
          borderColor: md3Colors.outline,
          color: md3Colors.onSurface,
        },
      },
    },
    
    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          backgroundColor: md3Colors.surface2,
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
