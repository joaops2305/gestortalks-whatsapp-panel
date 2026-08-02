'use client';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { instanceService } from './instance.service';
import type { WhatsAppInstance } from './types';

const STATUS_INTERVAL = 3000;
const CLOSE_DELAY = 1800;
const FINAL_STATUSES = new Set(['connected', 'logged_out', 'error']);

function normalizeStatus(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function getErrorMessage(error: any) {
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Não foi possível gerar o QR Code.';
}

export function InstanceQrDialog({ instance, open, onClose, onChange }: {
  instance: WhatsAppInstance | null;
  open: boolean;
  onClose: () => void;
  onChange: (changes: Partial<WhatsAppInstance>) => void;
}) {
  const theme = useTheme();
  const instanceId = instance?.id ?? null;

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState('starting');
  const [loading, setLoading] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState('');

  const mountedRef = useRef(false);
  const openedRef = useRef(false);
  const connectedRef = useRef(false);
  const startingRef = useRef(false);
  const pollingRef = useRef(false);
  const initializedInstanceRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const clearTimers = useCallback(() => {
    if (statusTimerRef.current !== null) {
      window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const finishConnection = useCallback((phoneNumber?: string | null) => {
    if (!mountedRef.current || connectedRef.current) return;

    connectedRef.current = true;
    clearTimers();
    setQrCode(null);
    setLoading(false);
    setRestarting(false);
    setError('');
    setStatus('connected');
    onChangeRef.current({ status: 'connected', phone_number: phoneNumber ?? instance?.phone_number });

    closeTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) onCloseRef.current();
    }, CLOSE_DELAY);
  }, [clearTimers, instance?.phone_number]);

  const applyResponse = useCallback((data: any) => {
    if (!mountedRef.current || connectedRef.current) return;

    const nextStatus = normalizeStatus(data?.status || data?.state || data?.connectionStatus);
    const nextQrCode = data?.qrCode || data?.qrcode || data?.qr || null;
    const phoneNumber = data?.phone_number ?? null;

    if (nextStatus === 'connected') {
      finishConnection(phoneNumber);
      return;
    }

    if (nextQrCode) {
      setQrCode(String(nextQrCode).trim());
      setStatus('qr');
      setLoading(false);
      setError('');
    } else if (nextStatus) {
      setStatus(nextStatus);
    }

    onChangeRef.current({
      status: nextStatus || 'starting',
      phone_number: phoneNumber ?? instance?.phone_number,
    });
  }, [finishConnection, instance?.phone_number]);

  const checkStatus = useCallback(async () => {
    if (!mountedRef.current || !openedRef.current || connectedRef.current || !instanceId || pollingRef.current) return;

    pollingRef.current = true;
    try {
      const data = await instanceService.status(instanceId);
      applyResponse(data);

      const currentStatus = normalizeStatus(data?.status);
      if (FINAL_STATUSES.has(currentStatus)) return;
    } catch {
      // Mantém o QR e o último status. Uma falha isolada não reinicia a sessão.
    } finally {
      pollingRef.current = false;
    }

    if (mountedRef.current && openedRef.current && !connectedRef.current) {
      statusTimerRef.current = window.setTimeout(() => void checkStatus(), STATUS_INTERVAL);
    }
  }, [applyResponse, instanceId]);

  const startSession = useCallback(async (force = false) => {
    if (!mountedRef.current || !openedRef.current || connectedRef.current || startingRef.current || !instanceId) return;
    if (!force && initializedInstanceRef.current === instanceId) return;

    startingRef.current = true;
    initializedInstanceRef.current = instanceId;
    clearTimers();

    setLoading(true);
    setRestarting(force);
    setError('');
    setQrCode(null);
    setStatus(force ? 'restarting' : 'starting');

    try {
      await instanceService.connect(instanceId);
      const data = await instanceService.qrcode(instanceId);
      applyResponse(data);

      const currentStatus = normalizeStatus(data?.status);
      if (!FINAL_STATUSES.has(currentStatus) && mountedRef.current && openedRef.current) {
        statusTimerRef.current = window.setTimeout(() => void checkStatus(), STATUS_INTERVAL);
      }
    } catch (requestError: any) {
      if (!mountedRef.current || connectedRef.current) return;
      setStatus('error');
      setError(getErrorMessage(requestError));
    } finally {
      startingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setRestarting(false);
      }
    }
  }, [applyResponse, checkStatus, clearTimers, instanceId]);

  const handleRestart = useCallback(() => {
    if (startingRef.current || connectedRef.current) return;
    initializedInstanceRef.current = null;
    void startSession(true);
  }, [startSession]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      openedRef.current = false;
      connectedRef.current = false;
      pollingRef.current = false;
      initializedInstanceRef.current = null;
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (!open || !instanceId) {
      openedRef.current = false;
      clearTimers();
      return;
    }

    openedRef.current = true;
    connectedRef.current = false;
    pollingRef.current = false;
    initializedInstanceRef.current = null;
    setQrCode(null);
    setError('');
    setStatus('starting');

    void startSession();

    return () => {
      openedRef.current = false;
      clearTimers();
    };
    // O modal inicia somente ao abrir ou mudar o ID. Callbacks ficam em refs/closures estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, instanceId]);

  const connected = status === 'connected';
  const waitingLabel = status === 'qr'
    ? 'Aguardando leitura do QR Code...'
    : status === 'restarting'
      ? 'Solicitando novo QR Code...'
      : 'Gerando QR Code...';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Box>
          <Typography fontWeight={800}>WhatsApp</Typography>
          <Typography variant="caption" color="primary.main" fontWeight={800}>
            ID: {instanceId ?? '-'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Fechar modal"><CloseRoundedIcon /></IconButton>
      </Stack>

      <DialogContent sx={{ p: 3 }}>
        <Stack alignItems="center" spacing={2.5}>
          <Paper
            variant="outlined"
            sx={{
              position: 'relative',
              width: 232,
              height: 232,
              display: 'grid',
              placeItems: 'center',
              bgcolor: '#fff',
              borderStyle: 'dashed',
              borderWidth: 2,
              borderRadius: 4,
              p: 2,
            }}
          >
            {(loading || restarting) && !qrCode ? (
              <Stack alignItems="center" spacing={1.5}>
                <CircularProgress size={38} />
                <Typography variant="caption" fontWeight={800} color="text.secondary">GERANDO CÓDIGO...</Typography>
              </Stack>
            ) : qrCode ? (
              <Box component="img" src={qrCode} alt="QR Code do WhatsApp" sx={{ width: 192, height: 192, objectFit: 'contain' }} />
            ) : (
              <Stack alignItems="center" spacing={1} color={error ? 'error.main' : 'text.disabled'}>
                {error ? <ErrorOutlineRoundedIcon sx={{ fontSize: 52 }} /> : <QrCode2RoundedIcon sx={{ fontSize: 52 }} />}
                <Typography variant="caption">{error ? 'Não foi possível gerar o QR Code' : 'Aguardando QR Code'}</Typography>
              </Stack>
            )}

            {connected && (
              <Stack
                position="absolute"
                inset={0}
                alignItems="center"
                justifyContent="center"
                bgcolor="rgba(255,255,255,0.96)"
                borderRadius={4}
              >
                <TaskAltRoundedIcon color="success" sx={{ fontSize: 58, mb: 1 }} />
                <Typography color="success.main" fontWeight={800}>Conectado!</Typography>
              </Stack>
            )}
          </Paper>

          <Chip
            label={error ? 'Erro ao gerar QR Code' : connected ? 'Conectado com sucesso!' : waitingLabel}
            color={error ? 'error' : connected ? 'success' : 'primary'}
            variant="outlined"
            sx={{ fontWeight: 800 }}
          />

          {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

          {error && !connected && (
            <Button
              fullWidth
              variant="contained"
              startIcon={restarting ? <CircularProgress size={16} color="inherit" /> : <RefreshRoundedIcon />}
              onClick={handleRestart}
              disabled={restarting || startingRef.current}
            >
              {restarting ? 'Gerando...' : 'Tentar novamente'}
            </Button>
          )}
        </Stack>
      </DialogContent>

      <Stack
        direction="row"
        alignItems="flex-start"
        spacing={1.5}
        sx={{ px: 2.5, py: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}
      >
        <SmartphoneRoundedIcon color="action" fontSize="small" />
        <Typography variant="caption" color="text.secondary">
          Abra o WhatsApp, acesse Aparelhos conectados e leia o código. O modal consulta somente esta instância e encerra automaticamente ao fechar ou conectar.
        </Typography>
      </Stack>
    </Dialog>
  );
}
