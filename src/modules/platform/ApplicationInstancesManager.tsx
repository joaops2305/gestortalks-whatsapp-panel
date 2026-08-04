'use client';

import { Alert, Box, Button, Card, Checkbox, CircularProgress, Divider, FormControl, InputLabel, ListItemText, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import { notifySuccess } from '@/services/notifications';

type Application = { id: number; name: string; company_id: number; company_name?: string | null };
type InstanceOption = {
  id: number;
  name?: string | null;
  session: string;
  status: string;
  phone_number?: string | null;
  selected: boolean;
};

export function ApplicationInstancesManager() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationId, setApplicationId] = useState<number>(0);
  const [instances, setInstances] = useState<InstanceOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void api.get('/api/admin/applications')
      .then((response) => {
        const rows = response.data?.data ?? [];
        setApplications(rows);
        if (rows.length) setApplicationId(Number(rows[0].id));
      })
      .catch(() => setError('Não foi possível carregar as aplicações.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!applicationId) {
      setInstances([]);
      setSelectedIds([]);
      return;
    }

    setLoadingInstances(true);
    setError('');
    void api.get(`/api/admin/applications/${applicationId}/instances`)
      .then((response) => {
        const rows = response.data?.data ?? [];
        setInstances(rows);
        setSelectedIds(rows.filter((item: InstanceOption) => item.selected).map((item: InstanceOption) => Number(item.id)));
      })
      .catch(() => setError('Não foi possível carregar as instâncias da aplicação.'))
      .finally(() => setLoadingInstances(false));
  }, [applicationId]);

  const selectedApplication = useMemo(
    () => applications.find((item) => Number(item.id) === applicationId),
    [applications, applicationId],
  );

  async function save() {
    if (!applicationId) return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/admin/applications/${applicationId}/instances`, {
        instance_ids: selectedIds,
      });
      setInstances((current) => current.map((item) => ({ ...item, selected: selectedIds.includes(Number(item.id)) })));
      notifySuccess('Instâncias da aplicação atualizadas com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível salvar as instâncias da aplicação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card variant="outlined">
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" fontWeight={800}>Instâncias da aplicação</Typography>
          <Typography variant="body2" color="text.secondary">
            Escolha uma aplicação e marque as instâncias que ela poderá utilizar.
          </Typography>
        </Stack>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.2}>
          {error && <Alert severity="error">{error}</Alert>}

          <FormControl fullWidth disabled={loading || !applications.length}>
            <InputLabel>Aplicação</InputLabel>
            <Select label="Aplicação" value={applicationId || ''} onChange={(event) => setApplicationId(Number(event.target.value))}>
              {applications.map((application) => (
                <MenuItem key={application.id} value={application.id}>
                  {application.name}{application.company_name ? ` — ${application.company_name}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loadingInstances ? (
            <Stack alignItems="center" py={3}><CircularProgress size={28} /></Stack>
          ) : (
            <FormControl fullWidth disabled={!applicationId || !instances.length}>
              <InputLabel>Instâncias</InputLabel>
              <Select
                multiple
                label="Instâncias"
                value={selectedIds}
                onChange={(event) => setSelectedIds((event.target.value as number[]).map(Number))}
                renderValue={(selected) => selected
                  .map((id) => instances.find((item) => Number(item.id) === Number(id)))
                  .filter(Boolean)
                  .map((item) => item?.name || item?.session)
                  .join(', ')}
              >
                {instances.map((instance) => (
                  <MenuItem key={instance.id} value={instance.id}>
                    <Checkbox checked={selectedIds.includes(Number(instance.id))} />
                    <ListItemText
                      primary={instance.name || instance.session}
                      secondary={`${instance.session} • ${instance.phone_number || 'sem número'} • ${instance.status}`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {!loadingInstances && applicationId > 0 && !instances.length && (
            <Alert severity="info">Não existem instâncias cadastradas para a empresa desta aplicação.</Alert>
          )}

          {selectedApplication && (
            <Typography variant="caption" color="text.secondary">
              {selectedIds.length} instância(s) selecionada(s) para {selectedApplication.name}.
            </Typography>
          )}

          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" onClick={() => void save()} disabled={!applicationId || loadingInstances || saving}>
              {saving ? 'Salvando...' : 'Salvar instâncias'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Card>
  );
}
