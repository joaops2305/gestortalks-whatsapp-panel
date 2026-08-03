'use client';

import { CircularProgress, Stack } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    setMounted(true);

    const token = window.localStorage.getItem('gtw_token');

    if (!token) {
      router.replace('/login');
      return () => {
        active = false;
      };
    }

    void api.get('/api/auth/me')
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        window.localStorage.removeItem('gtw_token');
        window.localStorage.removeItem('gtw_user');
        if (active) router.replace('/login');
      });

    return () => {
      active = false;
    };
  }, [router]);

  // O servidor e a primeira renderizacao do cliente retornam o mesmo HTML.
  if (!mounted) return null;

  if (!ready) {
    return (
      <Stack minHeight="100vh" alignItems="center" justifyContent="center">
        <CircularProgress />
      </Stack>
    );
  }

  return <>{children}</>;
}
