'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, IconButton,
  InputAdornment, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { InstanceQrDialog } from '@/modules/instances/InstanceQrDialog';
import { instanceService } from '@/modules/instances/instance.service';
import type { WhatsAppInstance } from '@/modules/instances/types';
import { useInstances } from '@/modules/instances/useInstances';

export function InstancesAdminPage() {
  const { items, loading, error, setError, load, patch, removeLocal } = useInstances();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<WhatsAppInstance | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => [item.name, item.session, item.company_name, item.phone_number, item.status]
      .some((value) => String(value ?? '').toLowerCase().includes(term)));
  }, [items, search]);

  const paginated = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, pageSize]);
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page, pageSize]);

  async function action(instance: WhatsAppInstance, type: 'disconnect' | 'logout') {
    setBusyId(instance.id);
    setError('');
    try {
      if (type === 'disconnect') await instanceService.disconnect(instance.id);
      else await instanceService.logout(instance.id);
      patch(instance.id, { status: type === 'logout' ? 'logged_out' : 'disconnected' });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível executar a ação.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(instance: WhatsAppInstance) {
    if (!window.confirm(`Excluir ${instance.name || instance.session}?`)) return;
    setBusyId(instance.id);
    try {
      await instanceService.remove(instance.id);
      removeLocal(instance.id);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível excluir a instância.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>Instâncias</Typography>
              <Typography color="text.secondary">A lista carrega uma vez. O QR consulta somente a instância aberta.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddRoundedIcon />} disabled>Nova instância</Button>
          </Stack>

          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                <TextField
                  fullWidth
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar instância..."
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
                />
                <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void load()} disabled={loading}>Atualizar</Button>
              </Stack>

              {loading ? <Stack alignItems="center" py={6}><CircularProgress /></Stack> : (
                <>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Box sx={{ minWidth: 980 }}>
                      <Stack direction="row" spacing={2} sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                        {['Nome', 'Empresa', 'Número', 'Provider', 'Status'].map((column) => <Typography key={column} variant="caption" fontWeight={800} sx={{ flex: 1 }}>{column}</Typography>)}
                        <Typography variant="caption" fontWeight={800} sx={{ width: 190 }}>Ações</Typography>
                      </Stack>

                      {paginated.map((instance) => (
                        <Stack key={instance.id} direction="row" spacing={2} alignItems="center" sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>{instance.name || instance.session}</Typography>
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>{instance.company_name || instance.empresa_id}</Typography>
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>{instance.phone_number || '-'}</Typography>
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>{instance.provider || 'baileys'}</Typography>
                          <Box sx={{ flex: 1 }}><Chip size="small" label={instance.status} color={instance.status === 'connected' ? 'success' : instance.status === 'qr' ? 'warning' : 'default'} /></Box>
                          <Stack direction="row" sx={{ width: 190 }}>
                            <Tooltip title="Conectar / QR Code"><IconButton onClick={() => setSelected(instance)}><QrCode2RoundedIcon /></IconButton></Tooltip>
                            <Tooltip title="Desconectar"><span><IconButton disabled={busyId === instance.id} onClick={() => void action(instance, 'disconnect')}><LinkOffRoundedIcon /></IconButton></span></Tooltip>
                            <Tooltip title="Logout"><span><IconButton disabled={busyId === instance.id} color="warning" onClick={() => void action(instance, 'logout')}><LogoutRoundedIcon /></IconButton></span></Tooltip>
                            <Tooltip title="Excluir"><span><IconButton disabled={busyId === instance.id} color="error" onClick={() => void remove(instance)}><DeleteOutlineRoundedIcon /></IconButton></span></Tooltip>
                          </Stack>
                        </Stack>
                      ))}

                      {!paginated.length && <Alert severity="info" sx={{ mt: 2 }}>Nenhuma instância encontrada.</Alert>}
                    </Box>
                  </Box>
                  <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
                </>
              )}
            </CardContent>
          </Card>
        </Stack>

        <InstanceQrDialog
          instance={selected}
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          onChange={(changes) => selected && patch(selected.id, changes)}
        />
      </AppShell>
    </AuthGuard>
  );
}
