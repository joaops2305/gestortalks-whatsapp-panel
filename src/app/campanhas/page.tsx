'use client';

import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputLabel, LinearProgress, MenuItem, Select, Stack, Table,
  TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { api } from '@/services/api';
import { notifySuccess } from '@/services/notifications';

type Application = { id: number; name: string; company_id: number };
type Instance = { id: number; name?: string | null; session: string; selected: boolean };
type Campaign = {
  id: number; name: string; status: string; application_name: string; instance_name?: string | null;
  session: string; total_items: number; pending_items: number; sent_items: number; failed_items: number;
};

function statusColor(status: string) {
  if (status === 'completed') return 'success' as const;
  if (status === 'running') return 'primary' as const;
  if (status === 'failed' || status === 'cancelled') return 'error' as const;
  if (status === 'paused') return 'warning' as const;
  return 'default' as const;
}

export default function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [open, setOpen] = useState(false);
  const [applicationId, setApplicationId] = useState(0);
  const [instanceId, setInstanceId] = useState(0);
  const [name, setName] = useState('');
  const [intervalMs, setIntervalMs] = useState(5000);
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [startImmediately, setStartImmediately] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [campaignsResponse, applicationsResponse] = await Promise.all([
        api.get('/api/campaigns'),
        api.get('/api/admin/applications'),
      ]);
      setCampaigns(campaignsResponse.data?.data ?? []);
      setApplications(applicationsResponse.data?.data ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    setInstanceId(0);
    setInstances([]);
    if (!applicationId) return;
    void api.get(`/api/admin/applications/${applicationId}/instances`)
      .then((response) => setInstances((response.data?.data ?? []).filter((item: Instance) => item.selected)))
      .catch(() => setError('Não foi possível carregar as instâncias da aplicação.'));
  }, [applicationId]);

  const selectedFileInfo = useMemo(() => csv ? `${fileName} • ${Math.max(0, csv.split(/\r?\n/).filter(Boolean).length - 1)} linha(s)` : '', [csv, fileName]);

  async function readFile(file?: File) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) { setError('Selecione um arquivo CSV.'); return; }
    const content = await file.text();
    setCsv(content); setFileName(file.name); setError('');
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await api.post('/api/campaigns/import', {
        application_id: applicationId,
        instance_id: instanceId,
        name: name.trim(),
        csv,
        interval_ms: intervalMs,
        start_immediately: startImmediately,
      });
      notifySuccess('Campanha importada com sucesso.');
      setOpen(false); setName(''); setCsv(''); setFileName(''); setApplicationId(0); setInstanceId(0);
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível importar a campanha.');
    } finally { setSaving(false); }
  }

  async function action(id: number, command: 'start' | 'pause' | 'cancel') {
    await api.post(`/api/campaigns/${id}/${command}`);
    await load();
  }

  return <AuthGuard><AppShell><Stack spacing={3}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
      <Box><Typography variant="h4" fontWeight={800}>Campanhas</Typography><Typography color="text.secondary">Envio em massa por CSV com fila persistente.</Typography></Box>
      <Stack direction="row" spacing={1}>
        <Button startIcon={<RefreshRoundedIcon />} onClick={() => void load()}>Atualizar</Button>
        <Button variant="contained" startIcon={<UploadFileRoundedIcon />} onClick={() => setOpen(true)}>Importar CSV</Button>
      </Stack>
    </Stack>

    <Alert severity="warning">Use apenas contatos que autorizaram o recebimento. Configure intervalo adequado e respeite pedidos de descadastro.</Alert>

    <Card variant="outlined" sx={{ overflowX: 'auto' }}>
      {loading ? <Stack alignItems="center" py={8}><CircularProgress /></Stack> : (
        <Table size="small" sx={{ minWidth: 1000 }}>
          <TableHead><TableRow><TableCell>Campanha</TableCell><TableCell>Aplicação / Instância</TableCell><TableCell>Status</TableCell><TableCell>Progresso</TableCell><TableCell>Falhas</TableCell><TableCell align="right">Ações</TableCell></TableRow></TableHead>
          <TableBody>{campaigns.map((campaign) => {
            const total = Number(campaign.total_items || 0);
            const done = Number(campaign.sent_items || 0) + Number(campaign.failed_items || 0);
            const progress = total ? Math.round((done / total) * 100) : 0;
            return <TableRow key={campaign.id}>
              <TableCell><Typography fontWeight={700}>{campaign.name}</Typography><Typography variant="caption" color="text.secondary">#{campaign.id}</Typography></TableCell>
              <TableCell>{campaign.application_name}<br/><Typography variant="caption" color="text.secondary">{campaign.instance_name || campaign.session}</Typography></TableCell>
              <TableCell><Chip size="small" label={campaign.status} color={statusColor(campaign.status)} /></TableCell>
              <TableCell sx={{ minWidth: 220 }}><Stack spacing={0.5}><LinearProgress variant="determinate" value={progress}/><Typography variant="caption">{campaign.sent_items} enviados de {total}</Typography></Stack></TableCell>
              <TableCell>{campaign.failed_items}</TableCell>
              <TableCell align="right"><Stack direction="row" justifyContent="flex-end">
                {(campaign.status === 'draft' || campaign.status === 'paused') && <Button size="small" startIcon={<PlayArrowRoundedIcon />} onClick={() => void action(campaign.id, 'start')}>Iniciar</Button>}
                {campaign.status === 'running' && <Button size="small" startIcon={<PauseRoundedIcon />} onClick={() => void action(campaign.id, 'pause')}>Pausar</Button>}
                {!['completed','cancelled'].includes(campaign.status) && <Button size="small" color="error" startIcon={<CancelRoundedIcon />} onClick={() => void action(campaign.id, 'cancel')}>Cancelar</Button>}
              </Stack></TableCell>
            </TableRow>;
          })}</TableBody>
        </Table>
      )}
    </Card>

    <Dialog open={open} onClose={saving ? undefined : () => setOpen(false)} fullWidth maxWidth="sm">
      <Stack component="form" onSubmit={submit}>
        <DialogTitle>Importar campanha CSV</DialogTitle>
        <DialogContent><Stack spacing={2.2} pt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nome da campanha" value={name} onChange={(event) => setName(event.target.value)} required />
          <FormControl fullWidth required><InputLabel>Aplicação</InputLabel><Select label="Aplicação" value={applicationId || ''} onChange={(event) => setApplicationId(Number(event.target.value))}>{applications.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl>
          <FormControl fullWidth required disabled={!applicationId}><InputLabel>Instância</InputLabel><Select label="Instância" value={instanceId || ''} onChange={(event) => setInstanceId(Number(event.target.value))}>{instances.map((item) => <MenuItem key={item.id} value={item.id}>{item.name || item.session}</MenuItem>)}</Select></FormControl>
          <TextField label="Intervalo entre mensagens (ms)" type="number" value={intervalMs} onChange={(event) => setIntervalMs(Number(event.target.value))} inputProps={{ min: 3000, max: 300000 }} helperText="Mínimo: 3000 ms. Recomendado: 5000 ms ou mais." />
          <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />}>Selecionar arquivo CSV<input hidden type="file" accept=".csv,text/csv" onChange={(event) => void readFile(event.target.files?.[0])}/></Button>
          {selectedFileInfo && <Alert severity="info">{selectedFileInfo}</Alert>}
          <Alert severity="info">Cabeçalho obrigatório: <strong>numero,mensagem</strong>. Também aceita ponto e vírgula.</Alert>
          <FormControl fullWidth><InputLabel>Início</InputLabel><Select label="Início" value={startImmediately ? 'now' : 'draft'} onChange={(event) => setStartImmediately(event.target.value === 'now')}><MenuItem value="draft">Salvar como rascunho</MenuItem><MenuItem value="now">Iniciar imediatamente</MenuItem></Select></FormControl>
        </Stack></DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving || !applicationId || !instanceId || !name.trim() || !csv}>{saving ? 'Importando...' : 'Importar campanha'}</Button></DialogActions>
      </Stack>
    </Dialog>
  </Stack></AppShell></AuthGuard>;
}
