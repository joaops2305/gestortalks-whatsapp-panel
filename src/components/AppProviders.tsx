'use client';

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [theme] = useState(() => createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#2563eb' },
      background: { default: '#f5f7fb', paper: '#ffffff' },
    },
    shape: { borderRadius: 12 },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
