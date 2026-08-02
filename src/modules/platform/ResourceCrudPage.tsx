'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputAdornment, InputLabel,
  MenuItem, Select, Snackbar, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { api } from '@/services/api';
import { getUser } from '@/services/auth';
import { resourceConfigs, type ResourceField } from './resource.config';
import { resourceService } from './resource.service';
import { useResource } from './useResource';

const enabled = (value: unknown) => Number(value) === 1 || value === true;
const initialValues = (fields: ResourceField[], companyId?: number | null) => Object.fromEntries(fields.map((field) => [field.name,
  field.type === 'boolean' ? true : ((field.name === 'company_id' || field.name === 'empresa_id') && companyId ? companyId : ''),
]));

export function ResourceCrudPage({ resource }: { resource: keyof typeof resourceConfigs }) {
  const config = resourceConfigs[resource];
  const router = useRouter();
  const user = getUser();
  const isSuperAdmin = user?.role === 'superadmin';
  const companyId = user?.empresa_id ?? null;
  const allowed = !config.superadminOnly || isSuperAdmin;
  const { items, loading, error, setError, load, upsertLocal, removeLocal } = useResource<any>(config.endpoint, allowed);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, any>>(() => initialValues(config.fields, companyId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [companies, setCompanies] = useState<Array<{ label: string; value: number }>>([]);
  const [applications, setApplications] = useState<Array<{ label: string; value: number; company_id: number }>>([]);

  useEffect(() => { if (!allowed) router.replace('/'); }, [allowed, router]);
  useEffect(() => {
    if (!isSuperAdmin) return;
    void Promise.all([api.get('/api/admin/companies'), api.get('/api/admin/applications')]).then(([c, a]) => {
      setCompanies((c.data?.data ?? []).map((item: any) => ({ label: item.name, value: Number(item.id) })));
      setApplications((a.data?.data ?? []).map((item: any) => ({ label: item.name, value: Number(item.id), company_id: Number(item.company_id) })));
    }).catch(() => undefined);
  }, [isSuperAdmin]);

  const visibleFields = useMemo(() => config.fields.filter((field) => isSuperAdmin || !['company_id','empresa_id'].includes(field.name)), [config.fields, isSuperAdmin]);
  const filtered = useMemo(() => items.filter((item) => Object.values(item).some((value) => String(Array.isArray(value) ? value.join(', ') : value ?? '').toLowerCase().includes(search.toLowerCase()))), [items, search]);

  const close = () => { setOpen(false); setEditingId(null); setValues(initialValues(config.fields, companyId)); };
  const optionsFor = (field: ResourceField) => field.lookup === 'companies'
    ? companies
    : field.lookup === 'applications'
      ? applications.filter((item) => !values.company_id || item.company_id === Number(values.company_id))
      : field.options ?? [];

  const edit = (item: any) => {
    const next = initialValues(config.fields, companyId);
    for (const field of config.fields) {
      if (field.type === 'password') continue;
      const value = item[field.name];
      next[field.name] = field.type === 'boolean' ? enabled(value) : field.name === 'events' && Array.isArray(value) ? value.join(',') : value ?? next[field.name];
    }
    setValues(next); setEditingId(Number(item.id)); setOpen(true);
  };

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setGeneratedKey('');
    try {
      const normalized = { ...values };
      if (!isSuperAdmin && companyId) { normalized.company_id = companyId; normalized.empresa_id = companyId; }
      const payload = config.toPayload(normalized);
      if (editingId) {
        const updated = await resourceService.update<any>(config.endpoint, editingId, payload);
        upsertLocal(updated); setMessage('Registro atualizado com sucesso.');
      } else {
        const created = await resourceService.create<any>(config.endpoint, payload);
        upsertLocal(created.data); if (created.apiKey) setGeneratedKey(created.apiKey); setMessage('Registro cadastrado com sucesso.');
      }
      close();
    } catch (requestError: any) { setError(requestError?.response?.data?.error || 'Não foi possível salvar o registro.'); }
    finally { setSaving(false); }
  }

  async function remove(item: any) {
    if (!window.confirm(`Excluir ${item.name || item.id}?`)) return;
    try { await resourceService.remove(config.endpoint, Number(item.id)); removeLocal(Number(item.id)); setMessage('Registro excluído.'); }
    catch (requestError: any) { setError(requestError?.response?.data?.error || 'Não foi possível excluir o registro.'); }
  }

  if (!allowed) return null;

  return <AuthGuard><AppShell><Stack spacing={3}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
      <Box><Typography variant="h4" fontWeight={800}>{config.title}</Typography><Typography color="text.secondary">{config.description}</Typography></Box>
      <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditingId(null); setValues(initialValues(config.fields, companyId)); setOpen(true); }}>{config.actionLabel}</Button>
    </Stack>
    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
    {generatedKey && <Alert severity="warning"><strong>Copie a API Key agora:</strong><Box component="code" sx={{ display: 'block', mt: 1, wordBreak: 'break-all' }}>{generatedKey}</Box></Alert>}
    <Card variant="outlined"><CardContent>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField fullWidth size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }} />
        <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => void load()} disabled={loading}>Atualizar</Button>
      </Stack>
      <Box sx={{ overflowX: 'auto' }}><Box sx={{ minWidth: 860 }}>
        <Stack direction="row" spacing={2} sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
          {config.columns.map((column) => <Typography key={column.key} variant="caption" fontWeight={800} sx={{ flex: 1 }}>{column.label}</Typography>)}
          <Typography variant="caption" fontWeight={800} sx={{ width: 92 }}>Ações</Typography>
        </Stack>
        {loading ? <Stack alignItems="center" py={5}><CircularProgress /></Stack> : filtered.length === 0 ? <Alert severity="info" sx={{ mt: 2 }}>Nenhum registro encontrado.</Alert> : filtered.map((item) => <Stack key={item.id} direction="row" spacing={2} alignItems="center" sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          {config.columns.map((column) => { const value = item[column.key]; const display = Array.isArray(value) ? value.join(', ') : value ?? '-'; return <Box key={column.key} sx={{ flex: 1, minWidth: 0 }}>{column.key === 'status' ? <Chip size="small" label={enabled(value) ? 'Ativo' : 'Inativo'} color={enabled(value) ? 'success' : 'default'} /> : <Typography variant="body2" noWrap title={String(display)}>{String(display)}</Typography>}</Box>; })}
          <Stack direction="row" sx={{ width: 92 }}><Tooltip title="Editar"><IconButton onClick={() => edit(item)}><EditRoundedIcon /></IconButton></Tooltip><Tooltip title="Excluir"><IconButton color="error" onClick={() => void remove(item)}><DeleteOutlineRoundedIcon /></IconButton></Tooltip></Stack>
        </Stack>)}
      </Box></Box>
    </CardContent></Card>
  </Stack>
  <Dialog open={open} onClose={saving ? undefined : close} fullWidth maxWidth="sm"><Stack component="form" onSubmit={submit}><DialogTitle>{editingId ? `Editar ${config.title}` : config.actionLabel}</DialogTitle><DialogContent><Stack spacing={2.2} pt={1}>
    {visibleFields.map((field) => field.type === 'boolean' ? <Stack key={field.name} direction="row" justifyContent="space-between" alignItems="center"><Typography>{field.label}</Typography><Switch checked={Boolean(values[field.name])} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked }))} /></Stack> : (field.type === 'select' || field.lookup) ? <FormControl key={field.name} fullWidth required={field.required}><InputLabel>{field.label}</InputLabel><Select label={field.label} value={String(values[field.name] ?? '')} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}>{!field.required && <MenuItem value=""><em>Nenhum</em></MenuItem>}{optionsFor(field).map((option) => <MenuItem key={String(option.value)} value={option.value}>{option.label}</MenuItem>)}</Select></FormControl> : <TextField key={field.name} label={field.label} type={field.type ?? 'text'} required={field.required && !(editingId && field.type === 'password')} fullWidth value={String(values[field.name] ?? '')} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />)}
  </Stack></DialogContent><DialogActions sx={{ p: 3 }}><Button onClick={close} disabled={saving}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></DialogActions></Stack></Dialog>
  <Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={() => setMessage('')} message={message} />
  </AppShell></AuthGuard>;
}
