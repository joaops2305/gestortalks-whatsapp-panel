'use client';

import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, FormControl,
  InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { operationsService } from './operations.service';

function Shell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <AuthGuard><AppShell><Stack spacing={3}><Box><Typography variant="h4" fontWeight={800}>{title}</Typography><Typography color="text.secondary">{description}</Typography></Box>{children}</Stack></AppShell></AuthGuard>;
}

function Loading() { return <Stack alignItems="center" justifyContent="center" py={8}><CircularProgress /></Stack>; }
const dt = (value: string) => value ? new Date(value).toLocaleString('pt-BR') : '-';
const rowSx = { px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', minHeight: 58, '&:hover': { bgcolor: 'action.hover' } };
const headerSx = { px: 2, py: 1.25, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' };

function StatusChip({ value }: { value: string }) {
  const status = String(value || '').toLowerCase();
  const color = status === 'connected' || status === 'sent' || status === 'delivered' || status === 'read'
    ? 'success'
    : status === 'failed' || status === 'error' || status === 'disconnected'
      ? 'error'
      : status === 'pending' || status === 'queued'
        ? 'warning'
        : 'default';
  return <Chip size="small" label={value || '-'} color={color as any} variant={color === 'default' ? 'outlined' : 'filled'} sx={{ fontWeight: 700 }} />;
}

export function MessagesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('');
  const [status, setStatus] = useState('');
  const [filters, setFilters] = useState({ search: '', direction: '', status: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await operationsService.messages({ ...filters, page, limit: pageSize });
      setRows(result.data ?? []); setTotal(Number(result.total ?? 0));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível carregar as mensagens.');
    } finally { setLoading(false); }
  }, [filters, page, pageSize]);

  useEffect(() => { void load(); }, [load]);
  const applyFilters = () => { setPage(1); setFilters({ search, direction, status }); };

  return <Shell title="Mensagens" description="Histórico técnico de mensagens recebidas e enviadas pelas instâncias.">
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
          <TextField fullWidth size="small" placeholder="Buscar destino, conteúdo ou ID" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Direção</InputLabel><Select label="Direção" value={direction} onChange={(e) => setDirection(e.target.value)}><MenuItem value="">Todas</MenuItem><MenuItem value="inbound">Recebidas</MenuItem><MenuItem value="outbound">Enviadas</MenuItem></Select></FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="">Todos</MenuItem><MenuItem value="pending">Pendente</MenuItem><MenuItem value="sent">Enviada</MenuItem><MenuItem value="delivered">Entregue</MenuItem><MenuItem value="read">Lida</MenuItem><MenuItem value="failed">Falhou</MenuItem></Select></FormControl>
          <Button variant="contained" startIcon={<RefreshRoundedIcon />} onClick={applyFilters} sx={{ minWidth: 120 }}>Filtrar</Button>
        </Stack>
      </Box>
      <Divider />
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      {loading ? <Loading /> : <>
        <Box sx={{ overflowX: 'auto' }}><Box sx={{ minWidth: 1120 }}>
          <Stack direction="row" spacing={2} sx={headerSx}>
            <Typography variant="caption" fontWeight={800} sx={{ width: 155 }}>DATA</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ width: 170 }}>INSTÂNCIA</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ width: 220 }}>DESTINO</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ width: 105 }}>DIREÇÃO</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ width: 125 }}>TIPO</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ width: 110 }}>STATUS</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ flex: 1 }}>CONTEÚDO</Typography>
          </Stack>
          {rows.map((row) => <Stack key={row.id} direction="row" spacing={2} alignItems="center" sx={rowSx}>
            <Typography variant="body2" sx={{ width: 155 }}>{dt(row.created_at)}</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ width: 170 }} noWrap>{row.instance_name || row.session}</Typography>
            <Typography variant="body2" sx={{ width: 220 }} noWrap title={row.remote_jid}>{row.remote_jid}</Typography>
            <Box sx={{ width: 105 }}><Chip size="small" label={row.direction === 'inbound' ? 'Recebida' : 'Enviada'} color={row.direction === 'inbound' ? 'info' : 'primary'} sx={{ fontWeight: 700 }} /></Box>
            <Typography variant="body2" sx={{ width: 125 }}>{row.message_type}</Typography>
            <Box sx={{ width: 110 }}><StatusChip value={row.status} /></Box>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }} noWrap title={row.body || row.media_url || '-'}>{row.body || row.media_url || '-'}</Typography>
          </Stack>)}
          {!rows.length && <Alert severity="info" sx={{ m: 2 }}>Nenhuma mensagem encontrada.</Alert>}
        </Box></Box>
        <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
      </>}
    </Card>
  </Shell>;
}

export function MetricsPage() {
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setData(await operationsService.metrics()); } catch (e: any) { setError(e?.response?.data?.error || 'Não foi possível carregar as métricas.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  if (loading) return <Shell title="Métricas" description="Indicadores operacionais do gateway."><Loading /></Shell>;
  const cards = [['Instâncias', data?.instances?.total], ['Conectadas', data?.instances?.connected], ['Mensagens hoje', data?.messages?.today], ['Falhas hoje', data?.messages?.failed], ['Fila pendente', data?.queue?.queued], ['Webhooks com falha', data?.webhooks?.failed], ['Tempo médio webhook', `${data?.webhooks?.avg_ms ?? 0} ms`]];
  return <Shell title="Métricas" description="Indicadores operacionais do gateway, carregados sob demanda."><Stack direction="row" justifyContent="flex-end"><Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void load()}>Atualizar</Button></Stack>{error && <Alert severity="error">{error}</Alert>}<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 2 }}>{cards.map(([label, value]) => <Card key={String(label)} variant="outlined"><CardContent><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h4" fontWeight={800} mt={1}>{value ?? 0}</Typography></CardContent></Card>)}</Box><Card variant="outlined"><CardContent><Typography variant="h6" fontWeight={800} mb={2}>Últimas 24 horas</Typography>{(data?.hourly ?? []).map((row: any) => <Stack key={row.hour} direction="row" spacing={2} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}><Typography sx={{ width: 180 }}>{dt(row.hour)}</Typography><Typography>Total: {row.total}</Typography><Typography>Recebidas: {row.inbound}</Typography><Typography>Enviadas: {row.outbound}</Typography></Stack>)}</CardContent></Card></Shell>;
}

export function LogsPage() {
  const [rows, setRows] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1); const [pageSize, setPageSize] = useState(25); const [total, setTotal] = useState(0);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const result = await operationsService.logs({ ...filters, page, limit: pageSize }); setRows(result.data ?? []); setTotal(Number(result.total ?? 0)); } catch (e: any) { setError(e?.response?.data?.error || 'Não foi possível carregar os logs.'); } finally { setLoading(false); } }, [filters, page, pageSize]);
  useEffect(() => { void load(); }, [load]);
  const applyFilters = () => { setPage(1); setFilters({ search, status }); };

  return <Shell title="Logs" description="Eventos técnicos de conexão e desconexão das instâncias.">
    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2.5 }}><Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField fullWidth size="small" placeholder="Buscar instância ou motivo" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }} />
        <FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>Status</InputLabel><Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}><MenuItem value="">Todos</MenuItem><MenuItem value="connected">Conectado</MenuItem><MenuItem value="disconnected">Desconectado</MenuItem><MenuItem value="reconnecting">Reconectando</MenuItem><MenuItem value="error">Erro</MenuItem><MenuItem value="logged_out">Logout</MenuItem></Select></FormControl>
        <Button variant="contained" startIcon={<RefreshRoundedIcon />} onClick={applyFilters} sx={{ minWidth: 120 }}>Filtrar</Button>
      </Stack></Box>
      <Divider />
      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
      {loading ? <Loading /> : <>
        <Box sx={{ overflowX: 'auto' }}><Box sx={{ minWidth: 950 }}>
          <Stack direction="row" spacing={2} sx={headerSx}>
            <Typography variant="caption" fontWeight={800} sx={{ width: 170 }}>DATA</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ width: 210 }}>INSTÂNCIA</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ width: 150 }}>STATUS</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ flex: 1 }}>MOTIVO</Typography>
            <Typography variant="caption" fontWeight={800} sx={{ width: 100, textAlign: 'right' }}>CÓDIGO</Typography>
          </Stack>
          {rows.map((row) => <Stack key={row.id} direction="row" spacing={2} alignItems="center" sx={rowSx}>
            <Typography variant="body2" sx={{ width: 170 }}>{dt(row.created_at)}</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ width: 210 }} noWrap>{row.instance_name || row.session}</Typography>
            <Box sx={{ width: 150 }}><StatusChip value={row.status} /></Box>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }} noWrap title={row.reason || '-'}>{row.reason || '-'}</Typography>
            <Typography variant="body2" sx={{ width: 100, textAlign: 'right' }}>{row.disconnect_code ?? '-'}</Typography>
          </Stack>)}
          {!rows.length && <Alert severity="info" sx={{ m: 2 }}>Nenhum log encontrado.</Alert>}
        </Box></Box>
        <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />
      </>}
    </Card>
  </Shell>;
}

const defaultSettings = { retention_days: 90, queue_max_attempts: 5, webhook_timeout_ms: 15000, auto_reconnect: true, store_message_body: true, store_raw_payload: true, log_level: 'info' };

export function SettingsPage() {
  const [values, setValues] = useState<any>(defaultSettings); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { void operationsService.settings().then((data) => setValues({ ...defaultSettings, ...(data ?? {}) })).catch((e: any) => setError(e?.response?.data?.error || 'Não foi possível carregar as configurações.')).finally(() => setLoading(false)); }, []);
  async function save() { setSaving(true); setError(''); try { const data = await operationsService.saveSettings(values); setValues({ ...defaultSettings, ...(data ?? {}) }); setMessage('Configurações salvas com sucesso.'); } catch (e: any) { setError(e?.response?.data?.error || 'Não foi possível salvar.'); } finally { setSaving(false); } }
  if (loading) return <Shell title="Configurações" description="Parâmetros operacionais por empresa."><Loading /></Shell>;
  return <Shell title="Configurações" description="Parâmetros operacionais persistidos por empresa.">{error && <Alert severity="error">{error}</Alert>}{message && <Alert severity="success" onClose={() => setMessage('')}>{message}</Alert>}<Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={2.5}><TextField label="Retenção de dados (dias)" type="number" value={values.retention_days} onChange={(e) => setValues({ ...values, retention_days: Number(e.target.value) })} /><TextField label="Máximo de tentativas da fila" type="number" value={values.queue_max_attempts} onChange={(e) => setValues({ ...values, queue_max_attempts: Number(e.target.value) })} /><TextField label="Timeout de webhook (ms)" type="number" value={values.webhook_timeout_ms} onChange={(e) => setValues({ ...values, webhook_timeout_ms: Number(e.target.value) })} /><FormControl><InputLabel>Nível de log</InputLabel><Select label="Nível de log" value={values.log_level} onChange={(e) => setValues({ ...values, log_level: e.target.value })}><MenuItem value="debug">Debug</MenuItem><MenuItem value="info">Info</MenuItem><MenuItem value="warn">Warn</MenuItem><MenuItem value="error">Error</MenuItem></Select></FormControl>{[['auto_reconnect', 'Reconectar automaticamente'], ['store_message_body', 'Armazenar conteúdo das mensagens'], ['store_raw_payload', 'Armazenar payload bruto']].map(([key, label]) => <Stack key={key} direction="row" justifyContent="space-between" alignItems="center"><Typography>{label}</Typography><Switch checked={Boolean(values[key])} onChange={(e) => setValues({ ...values, [key]: e.target.checked })} /></Stack>)}<Button variant="contained" startIcon={<SaveRoundedIcon />} disabled={saving} onClick={() => void save()}>{saving ? 'Salvando...' : 'Salvar configurações'}</Button></Stack></Paper></Shell>;
}
