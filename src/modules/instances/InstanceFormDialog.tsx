'use client';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { getUser } from '@/services/auth';
import { instanceService } from './instance.service';
import type { WhatsAppInstance } from './types';

type CompanyOption = { id: number; name: string };

export function InstanceFormDialog({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: (instance: WhatsAppInstance) => void;
}) {
  const user = getUser();
  const isSuperAdmin = user?.role === 'superadmin';
  const ownCompanyId = Number(user?.empresa_id || 0);

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [empresaId, setEmpresaId] = useState<number>(ownCompanyId);
  const [name, setName] = useState('');
  const [session, setSession] = useState('');
  const [externalId, setExternalId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setEmpresaId(ownCompanyId);
    setName('');
    setSession('');
    setExternalId('');
    setError('');

    if (isSuperAdmin) {
      void api.get('/api/admin/companies')
        .then((response) => {
          const rows = response.data?.data ?? [];
          setCompanies(rows.map((item: any) => ({ id: Number(item.id), name: item.name })));
        })
        .catch(() => setError('Não foi possível carregar as empresas.'));
    }
  }, [open, isSuperAdmin, ownCompanyId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const companyId = isSuperAdmin ? empresaId : ownCompanyId;
      if (!companyId) throw new Error('Empresa não informada.');

      const created = await instanceService.create({
        empresa_id: companyId,
        external_instance_id: externalId ? Number(externalId) : null,
        session: session.trim(),
        name: name.trim() || null,
      });

      onCreated(created);
      onClose();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || requestError?.message || 'Não foi possível criar a instância.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <Stack component="form" onSubmit={submit}>
        <DialogTitle>Nova instância</DialogTitle>
        <DialogContent>
          <Stack spacing={2.2} pt={1}>
            {error && <Alert severity="error">{error}</Alert>}

            {isSuperAdmin && (
              <FormControl fullWidth required>
                <InputLabel>Empresa</InputLabel>
                <Select
                  label="Empresa"
                  value={empresaId || ''}
                  onChange={(event) => setEmpresaId(Number(event.target.value))}
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Nome da instância"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Financeiro"
              fullWidth
            />

            <TextField
              label="Identificador da sessão"
              value={session}
              onChange={(event) => setSession(event.target.value)}
              placeholder="Ex.: inst_financeiro_001"
              required
              fullWidth
            />

            <TextField
              label="ID externo"
              type="number"
              value={externalId}
              onChange={(event) => setExternalId(event.target.value)}
              helperText="Opcional. Use para vincular com outro sistema."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving || !session.trim() || (isSuperAdmin && !empresaId)}>
            {saving ? 'Criando...' : 'Criar instância'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
