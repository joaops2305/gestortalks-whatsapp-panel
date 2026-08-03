'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { ThemeModeContext, type ThemeMode } from '@/context/ThemeModeContext';
import { NotificationProvider } from '@/components/NotificationProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const saved = window.localStorage.getItem('gtw-theme-mode');
    if (saved === 'light' || saved === 'dark') setMode(saved);
  }, []);

  const toggleMode = () => {
    setMode((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      window.localStorage.setItem('gtw-theme-mode', next);
      return next;
    });
  };

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#2563eb' },
      secondary: { main: '#7c3aed' },
      background: mode === 'light'
        ? { default: '#f5f7fb', paper: '#ffffff' }
        : { default: '#0b1120', paper: '#111827' },
    },
    shape: { borderRadius: 12 },
    typography: { fontFamily: 'Inter, Arial, sans-serif' },
    components: {
      MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    },
  }), [mode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeContext.Provider value={{ mode, toggleMode }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NotificationProvider>{children}</NotificationProvider>
        </ThemeProvider>
      </ThemeModeContext.Provider>
    </QueryClientProvider>
  );
}
