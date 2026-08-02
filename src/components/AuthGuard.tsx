'use client';

import { CircularProgress, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gtw_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    api.get('/api/auth/me')
      .then(() => setReady(true))
      .catch(() => {
        localStorage.removeItem('gtw_token');
        localStorage.removeItem('gtw_user');
        router.replace('/login');
      });
  }, [router]);

  if (!ready) {
    return <Stack minHeight="100vh" alignItems="center" justifyContent="center"><CircularProgress /></Stack>;
  }

  return <>{children}</>;
}
