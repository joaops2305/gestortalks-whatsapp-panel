'use client';

import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { operationsService } from './operations.service';

function Shell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800}>{title}</Typography>
            <Typography color="text.secondary">{description}</Typography>
          </Box>
          {children}
        </Stack>
      </AppShell>
    </AuthGuard>
  );
}

function Loading() {
  return <Stack alignItems="center" justifyContent="center" py={8}><CircularProgress /></Stack>;
}

function formatDate(value?: string | null) {
  if (!value) return { date: '-', time: '' };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('pt-BR'),
    time: date.toLocaleTimeString('pt-BR'),
  };
}

function cleanJid(value?: string | null) {
  if (!value) return '-';
  return value
    .replace(/@s\.whatsapp\.net$/i, '')
    .replace(/@c\.us$/i, '')
    .replace(/@lid$/i, '')
    .replace(/@g\.us$/i, ' (grupo)');
}

function messageTypeLabel(value?: string | null) {
  const labels: Record<string, string> = {
    text: 'Texto',
    image: 'Imagem',
    audio: 'Áudio',
    video: 'Vídeo',
    document: 'Documento',
    sticker: 'Figurinha',
    location: 'Localização',
    contact: 'Contato',
    protocolMessage: 'Sistema',
    senderKeyDistributionMessage: 'Sistema',
  };
  return labels[String(value || '')] || String(value || '-');
}

function statusLabel(value?: string | null) {
  const labels: Record<string, string> = {
    connected: 'Conectado',
    disconnected: 'Desconectado',
    reconnecting: 'Reconectando',
    logged_out: 'Logout',
    error: 'Erro',
    pending: 'Pendente',
    queued: 'Na fila',
    sent: 'Enviada',
    delivered: 'Entregue',
    read: 'Lida',
    received: 'Recebida',
    failed: 'Falhou',
  };
  return labels[String(value || '').toLowerCase()] || String(value || '-');
}

function StatusChip({ value }: { value?: string | null }) {
  const status = String(value || '').toLowerCase();
  const color = ['connected', 'sent', 'delivered', 'read', 'received'].includes(status)
    ? 'success'
    : ['failed', 'error', 'disconnected', 'logged_out'].includes(status)
      ? 'error'
      : ['pending', 'queued', 'reconnecting'].includes(status)
        ? 'warning'
        : 'default';

  return (
    <Chip
      size="small"
      label={statusLabel(value)}
      color={color as any}
      variant={color === 'default' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 700 }}
    />
  );
}

function DirectionChip({ value }: { value?: string | null }) {
  const inbound = value === 'inbound';
  return (
    <Chip
      size="small"
      label={inbound ? 'Recebida' : 'Enviada'}
      color={inbound ? 'info' : 'primary'}
      variant="outlined"
      sx={{ fontWeight: 700 }}
    />
  );
}

const headCellSx = {
  fontSize: 11,
  fontWeight: 800,
  color: 'text.secondary',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
  bgcolor: 'action.hover',
  whiteSpace: 'nowrap',
};

const bodyCellSx = {
  py: 1.4,
  borderColor: 'divider',
  verticalAlign: 'middle',
};

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
    setLoading(true);
    setError('');
    try {
      const result = await operationsService.messages({ ...filters, page, limit: pageSize });
      setRows(result.data ?? []);
      setTotal(Number(result.total ?? 0));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível carregar as mensagens.');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => { void load(); }, [load]);

  const applyFilters = () => {
    setPage(1);
    setFilters({ search, direction, status });
  };

  return (
    <Shell title="Mensagens" description="Histórico técnico de mensagens recebidas e enviadas pelas instâncias.">
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar número, conteúdo ou ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Direção</InputLabel>
              <Select label="Direção" value={direction} onChange={(event) => setDirection(event.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="inbound">Recebidas</MenuItem>
                <MenuItem value="outbound">Enviadas</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="pending">Pendente</MenuItem>
                <MenuItem value="sent">Enviada</MenuItem>
                <MenuItem value="delivered">Entregue</MenuItem>
                <MenuItem value="read">Lida</MenuItem>
                <MenuItem value="received">Recebida</MenuItem>
                <MenuItem value="failed">Falhou</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<RefreshRoundedIcon />} onClick={applyFilters} sx={{ minWidth: 120 }}>
              Filtrar
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mx: 2.5, mb: 2 }}>{error}</Alert>}

        {loading ? <Loading /> : (
          <>
            <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 1080 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headCellSx, width: 120 }}>Data</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 190 }}>Instância</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 185 }}>Contato</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 110 }}>Direção</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 110 }}>Tipo</TableCell>
                    <TableCell sx={headCellSx}>Mensagem</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 115 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const when = formatDate(row.created_at);
                    const content = row.body || row.media_url || row.error_message || '-';
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={bodyCellSx}>
                          <Typography variant="body2" fontWeight={600}>{when.date}</Typography>
                          <Typography variant="caption" color="text.secondary">{when.time}</Typography>
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Typography variant="body2" fontWeight={700} noWrap>{row.instance_name || 'Sem nome'}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{row.session || `ID ${row.instance_id}`}</Typography>
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Typography variant="body2" fontWeight={600} noWrap title={row.remote_jid}>{cleanJid(row.remote_jid)}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{row.message_id || '-'}</Typography>
                        </TableCell>
                        <TableCell sx={bodyCellSx}><DirectionChip value={row.direction} /></TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Chip size="small" variant="outlined" label={messageTypeLabel(row.message_type)} />
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, maxWidth: 360 }}>
                          <Typography variant="body2" noWrap title={String(content)}>{content}</Typography>
                        </TableCell>
                        <TableCell sx={bodyCellSx}><StatusChip value={row.status} /></TableCell>
                      </TableRow>
                    );
                  })}
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                        Nenhuma mensagem encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(value) => { setPageSize(value); setPage(1); }}
            />
          </>
        )}
      </Card>
    </Shell>
  );
}

export function MetricsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await operationsService.metrics());
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível carregar as métricas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <Shell title="Métricas" description="Indicadores operacionais do gateway."><Loading /></Shell>;

  const cards = [
    ['Instâncias', data?.instances?.total],
    ['Conectadas', data?.instances?.connected],
    ['Mensagens hoje', data?.messages?.today],
    ['Falhas hoje', data?.messages?.failed],
    ['Fila pendente', data?.queue?.queued],
    ['Webhooks com falha', data?.webhooks?.failed],
    ['Tempo médio webhook', `${data?.webhooks?.avg_ms ?? 0} ms`],
  ];

  return (
    <Shell title="Métricas" description="Indicadores operacionais do gateway, carregados sob demanda.">
      <Stack direction="row" justifyContent="flex-end">
        <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void load()}>Atualizar</Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 2 }}>
        {cards.map(([label, value]) => (
          <Card key={String(label)} variant="outlined">
            <CardContent>
              <Typography color="text.secondary" variant="body2">{label}</Typography>
              <Typography variant="h4" fontWeight={800} mt={1}>{value ?? 0}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" fontWeight={800} mb={2}>Últimas 24 horas</Typography>
          {(data?.hourly ?? []).map((row: any) => (
            <Stack key={row.hour} direction="row" spacing={2} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ width: 180 }}>{new Date(row.hour).toLocaleString('pt-BR')}</Typography>
              <Typography>Total: {row.total}</Typography>
              <Typography>Recebidas: {row.inbound}</Typography>
              <Typography>Enviadas: {row.outbound}</Typography>
            </Stack>
          ))}
        </CardContent>
      </Card>
    </Shell>
  );
}

export function LogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await operationsService.logs({ ...filters, page, limit: pageSize });
      setRows(result.data ?? []);
      setTotal(Number(result.total ?? 0));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível carregar os logs.');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => { void load(); }, [load]);

  const applyFilters = () => {
    setPage(1);
    setFilters({ search, status });
  };

  return (
    <Shell title="Logs" description="Eventos técnicos de conexão e desconexão das instâncias.">
      <Card variant="outlined" sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar instância ou motivo"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="connected">Conectado</MenuItem>
                <MenuItem value="disconnected">Desconectado</MenuItem>
                <MenuItem value="reconnecting">Reconectando</MenuItem>
                <MenuItem value="error">Erro</MenuItem>
                <MenuItem value="logged_out">Logout</MenuItem>
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<RefreshRoundedIcon />} onClick={applyFilters} sx={{ minWidth: 120 }}>
              Filtrar
            </Button>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mx: 2.5, mb: 2 }}>{error}</Alert>}

        {loading ? <Loading /> : (
          <>
            <TableContainer sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 940 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...headCellSx, width: 120 }}>Data</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 220 }}>Instância</TableCell>
                    <TableCell sx={{ ...headCellSx, width: 150 }}>Evento</TableCell>
                    <TableCell sx={headCellSx}>Detalhes</TableCell>
                    <TableCell align="right" sx={{ ...headCellSx, width: 100 }}>Código</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const when = formatDate(row.created_at);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={bodyCellSx}>
                          <Typography variant="body2" fontWeight={600}>{when.date}</Typography>
                          <Typography variant="caption" color="text.secondary">{when.time}</Typography>
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Typography variant="body2" fontWeight={700} noWrap>{row.instance_name || 'Sem nome'}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{row.session || `ID ${row.instance_id}`}</Typography>
                        </TableCell>
                        <TableCell sx={bodyCellSx}><StatusChip value={row.status} /></TableCell>
                        <TableCell sx={{ ...bodyCellSx, maxWidth: 440 }}>
                          <Typography variant="body2" noWrap title={row.reason || '-'}>{row.reason || '-'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={bodyCellSx}>
                          <Typography variant="body2" fontWeight={700}>{row.disconnect_code ?? '-'}</Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!rows.length && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                        Nenhum log encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(value) => { setPageSize(value); setPage(1); }}
            />
          </>
        )}
      </Card>
    </Shell>
  );
}

const defaultSettings = {
  retention_days: 90,
  queue_max_attempts: 5,
  webhook_timeout_ms: 15000,
  auto_reconnect: true,
  store_message_body: true,
  store_raw_payload: true,
  log_level: 'info',
};

export function SettingsPage() {
  const [values, setValues] = useState<any>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void operationsService.settings()
      .then((data) => setValues({ ...defaultSettings, ...(data ?? {}) }))
      .catch((requestError: any) => setError(requestError?.response?.data?.error || 'Não foi possível carregar as configurações.'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const data = await operationsService.saveSettings(values);
      setValues({ ...defaultSettings, ...(data ?? {}) });
      setMessage('Configurações salvas com sucesso.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Shell title="Configurações" description="Parâmetros operacionais por empresa."><Loading /></Shell>;

  return (
    <Shell title="Configurações" description="Parâmetros operacionais persistidos por empresa.">
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage('')}>{message}</Alert>}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <TextField label="Retenção de dados (dias)" type="number" value={values.retention_days} onChange={(event) => setValues({ ...values, retention_days: Number(event.target.value) })} />
          <TextField label="Máximo de tentativas da fila" type="number" value={values.queue_max_attempts} onChange={(event) => setValues({ ...values, queue_max_attempts: Number(event.target.value) })} />
          <TextField label="Timeout de webhook (ms)" type="number" value={values.webhook_timeout_ms} onChange={(event) => setValues({ ...values, webhook_timeout_ms: Number(event.target.value) })} />
          <FormControl>
            <InputLabel>Nível de log</InputLabel>
            <Select label="Nível de log" value={values.log_level} onChange={(event) => setValues({ ...values, log_level: event.target.value })}>
              <MenuItem value="debug">Debug</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="warn">Warn</MenuItem>
              <MenuItem value="error">Error</MenuItem>
            </Select>
          </FormControl>
          {[
            ['auto_reconnect', 'Reconectar automaticamente'],
            ['store_message_body', 'Armazenar conteúdo das mensagens'],
            ['store_raw_payload', 'Armazenar payload bruto'],
          ].map(([key, label]) => (
            <Stack key={key} direction="row" justifyContent="space-between" alignItems="center">
              <Typography>{label}</Typography>
              <Switch checked={Boolean(values[key])} onChange={(event) => setValues({ ...values, [key]: event.target.checked })} />
            </Stack>
          ))}
          <Button variant="contained" startIcon={<SaveRoundedIcon />} disabled={saving} onClick={() => void save()}>
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </Stack>
      </Paper>
    </Shell>
  );
}
