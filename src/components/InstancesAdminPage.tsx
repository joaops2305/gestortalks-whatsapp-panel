'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { InstanceFormDialog } from '@/modules/instances/InstanceFormDialog';
import { InstanceListTable } from '@/modules/instances/InstanceListTable';
import { InstanceQrDialog } from '@/modules/instances/InstanceQrDialog';
import { instanceService } from '@/modules/instances/instance.service';
import type { WhatsAppInstance } from '@/modules/instances/types';
import { useInstances } from '@/modules/instances/useInstances';

export function InstancesAdminPage() {
  const { items, loading, error, setError, load, insertLocal, patch, removeLocal } = useInstances();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<WhatsAppInstance | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => [
      item.name,
      item.session,
      item.company_name,
      item.phone_number,
      item.status,
      item.provider,
    ].some((value) => String(value ?? '').toLowerCase().includes(term)));
  }, [items, search]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

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

      patch(instance.id, {
        status: type === 'logout' ? 'logged_out' : 'disconnected',
      });
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
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ sm: 'center' }}
          >
            <Box>
              <Typography variant="h4" fontWeight={800}>Instâncias</Typography>
              <Typography color="text.secondary">Gerencie sessões, conexão, QR Code e status dos números.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setFormOpen(true)}>
              Nova instância
            </Button>
          </Stack>

          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, sessão, empresa, número ou status..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshRoundedIcon />}
                  onClick={() => void load()}
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  Atualizar
                </Button>
              </Stack>

              <InstanceListTable
                rows={paginated}
                loading={loading}
                busyId={busyId}
                onQr={setSelected}
                onDisconnect={(instance) => void action(instance, 'disconnect')}
                onLogout={(instance) => void action(instance, 'logout')}
                onDelete={(instance) => void remove(instance)}
              />

              {!loading && (
                <PaginationBar
                  page={page}
                  pageSize={pageSize}
                  total={filtered.length}
                  onPageChange={setPage}
                  onPageSizeChange={(value) => {
                    setPageSize(value);
                    setPage(1);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Stack>

        <InstanceFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onCreated={(instance) => {
            insertLocal(instance);
            setPage(1);
          }}
        />

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
