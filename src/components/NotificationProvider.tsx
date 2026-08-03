'use client';

import { Alert, Snackbar } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  notificationEventName,
  type NotificationPayload,
} from '@/services/notifications';

type QueueItem = Required<Pick<NotificationPayload, 'id' | 'message' | 'severity'>> & {
  duration: number;
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const current = queue[0] ?? null;

  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<NotificationPayload>).detail;
      if (!detail?.message) return;

      setQueue((items) => [
        ...items,
        {
          id: detail.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          message: detail.message,
          severity: detail.severity,
          duration: detail.duration ?? 5000,
        },
      ]);
    };

    window.addEventListener(notificationEventName, listener);
    return () => window.removeEventListener(notificationEventName, listener);
  }, []);

  const closeCurrent = useCallback(() => {
    setQueue((items) => items.slice(1));
  }, []);

  const snackbarKey = useMemo(() => current?.id ?? 'empty', [current?.id]);

  return (
    <>
      {children}
      <Snackbar
        key={snackbarKey}
        open={Boolean(current)}
        autoHideDuration={current?.duration ?? 5000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') closeCurrent();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          elevation={6}
          onClose={closeCurrent}
          severity={current?.severity ?? 'info'}
          variant="filled"
          sx={{ width: '100%', minWidth: { sm: 360 }, maxWidth: 680 }}
        >
          {current?.message ?? ''}
        </Alert>
      </Snackbar>
    </>
  );
}
