'use client';

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false, loading = false, onConfirm, onClose }: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      {description && <DialogContent><DialogContentText>{description}</DialogContentText></DialogContent>}
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant="contained" color={danger ? 'error' : 'primary'} onClick={onConfirm} disabled={loading}>
          {loading ? 'Processando...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
