'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { instanceService } from './instance.service';
import type { WhatsAppInstance } from './types';

const POLL_INTERVAL = 3000;
const FINAL_STATUSES = new Set(['connected', 'logged_out', 'error']);

export function InstanceQrDialog({ instance, open, onClose, onChange }: {
  instance: WhatsAppInstance | null;
  open: boolean;
  onClose: () => void;
  onChange: (changes: Partial<WhatsAppInstance>) => void;
}) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState('starting');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const applyStatus = useCallback((data: any) => {
    const nextStatus = String(data?.status || 'starting').toLowerCase();
    setStatus(nextStatus);
    if (data?.qrCode) setQrCode(data.qrCode);
    onChange({ status: nextStatus, phone_number: data?.phone_number ?? instance?.phone_number });
    if (FINAL_STATUSES.has(nextStatus)) stopPolling();
  }, [instance?.phone_number, onChange, stopPolling]);

  const checkStatus = useCallback(async () => {
    if (!instance) return;
    try {
      applyStatus(await instanceService.status(instance.id));
    } catch {
      // Mantém o último QR/status visível sem reiniciar a sessão.
    }
  }, [applyStatus, instance]);

  const start = useCallback(async () => {
    if (!instance) return;
    setLoading(true);
    setError('');
    setQrCode(null);
    try {
      await instanceService.connect(instance.id);
      applyStatus(await instanceService.qrcode(instance.id));
      stopPolling();
      timerRef.current = window.setInterval(() => void checkStatus(), POLL_INTERVAL);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível gerar o QR Code.');
    } finally {
      setLoading(false);
    }
  }, [applyStatus, checkStatus, instance, stopPolling]);

  useEffect(() => {
    if (open && instance) void start();
    return stopPolling;
  }, [open, instance?.id, start, stopPolling]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Conectar {instance?.name || instance?.session || 'instância'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} alignItems="center" py={1}>
          <Typography color="text.secondary">Status: {status}</Typography>
          {loading && !qrCode ? <CircularProgress /> : qrCode ? (
            <Box component="img" src={qrCode} alt="QR Code do WhatsApp" sx={{ width: 280, maxWidth: '100%', bgcolor: '#fff', p: 1, borderRadius: 2 }} />
          ) : (
            <Alert severity={error ? 'error' : 'info'} sx={{ width: '100%' }}>{error || 'Aguardando geração do QR Code...'}</Alert>
          )}
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Abra o WhatsApp, acesse Aparelhos conectados e leia o código. Somente esta instância é consultada enquanto o modal estiver aberto.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={() => void start()} disabled={loading}>Gerar novamente</Button>
        <Button variant="contained" onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
