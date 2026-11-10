'use client';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { instanceService } from './instance.service';
import type { WhatsAppInstance } from './types';

export function InstanceFilaDialog({ instance, open, onClose, onSaved }: {
  instance: WhatsAppInstance | null;
  open: boolean;
  onClose: () => void;
  onSaved: (instance: WhatsAppInstance) => void;
}) {
  const [rate, setRate] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !instance) return;
    setRate(Number(instance.fila_envios_por_minuto || 1));
    setError('');
  }, [open, instance]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!instance) return;
    setSaving(true);
    setError('');
    try {
      const updated = await instanceService.update(instance.id, { fila_envios_por_minuto: rate });
      onSaved({ ...instance, ...updated, fila_envios_por_minuto: rate });
      onClose();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || requestError?.message || 'Não foi possível salvar a fila de envio.');
    } finally {
      setSaving(false);
    }
  }

  const interval = Math.round(60 / rate);
  return <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
    <Stack component="form" onSubmit={submit}>
      <DialogTitle>Fila de envio</DialogTitle>
      <DialogContent>
        <Stack spacing={2} pt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography color="text.secondary">Instância: <strong>{instance?.name || instance?.session}</strong></Typography>
          <TextField label="Mensagens por minuto" type="number" value={rate}
            onChange={(event) => setRate(Math.max(1, Math.min(60, Number(event.target.value) || 1)))}
            inputProps={{ min: 1, max: 60 }} fullWidth autoFocus
            helperText={rate + ' por minuto = aproximadamente ' + interval + ' segundo(s) entre envios.'} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
      </DialogActions>
    </Stack>
  </Dialog>;
}
