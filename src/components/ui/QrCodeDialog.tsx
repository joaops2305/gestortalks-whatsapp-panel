'use client';

import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

export function QrCodeDialog({ open, qrCode, pairingCode, instanceName, status, loading = false, onClose, onRefresh }: {
  open: boolean;
  qrCode?: string | null;
  pairingCode?: string | null;
  instanceName?: string;
  status?: string;
  loading?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const copyPairing = async () => {
    if (pairingCode) await navigator.clipboard.writeText(pairingCode);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Conectar {instanceName || 'instância'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} alignItems="center" py={1}>
          {status && <Chip label={`Status: ${status}`} size="small" color={status === 'connected' ? 'success' : 'default'} />}
          <Typography color="text.secondary" textAlign="center">Abra o WhatsApp, acesse Aparelhos conectados e leia o código abaixo.</Typography>
          {qrCode ? (
            <Box component="img" src={qrCode} alt="QR Code da instância" sx={{ width: 280, maxWidth: '100%', borderRadius: 2, bgcolor: '#fff', p: 1 }} />
          ) : (
            <Alert severity={loading ? 'info' : 'warning'} sx={{ width: '100%' }}>{loading ? 'Gerando QR Code...' : 'QR Code ainda não disponível.'}</Alert>
          )}
          {pairingCode && (
            <Button variant="outlined" startIcon={<ContentCopyRoundedIcon />} onClick={copyPairing}>Código: {pairingCode}</Button>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        {onRefresh && <Button onClick={onRefresh}>Atualizar QR</Button>}
        <Button variant="contained" onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
