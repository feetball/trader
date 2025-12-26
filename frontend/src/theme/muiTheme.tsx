"use client";
import React from 'react';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { deepmerge } from '@mui/utils';

// Basic expressive-like Material 3 tokens scaffold (can be extended)
const base = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c4dff',
    },
    secondary: {
      main: '#03dac6',
    },
    background: {
      default: '#0b1020',
      paper: '#0f1724'
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'system-ui', 'sans-serif'].join(','),
  }
});

// Expressive overlay tweaks (elevation and motion tokens can be added here)
const expressive = createTheme(deepmerge(base, {
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: false,
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        }
      }
    }
  }
}));

export function MuiThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={expressive}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default expressive;
