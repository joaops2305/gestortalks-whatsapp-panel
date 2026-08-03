'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, InputAdornment, InputLabel, MenuItem, Select, Snackbar,
  Stack, Switch, TextField, Typography,
} from '@mui/material';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { api } from '@/services/api';
import { getUser } from '@/services/auth';
import { ResourceListTable } from './ResourceListTable';
import { resourceConfigs, type ResourceField } from './resource.config';
import { resourceService } from './resource.service';
import { useResource } from './useResource';

const enabled = (value: unknown) => Number(value) === 1 || value === true;
const initialValues = (fields: ResourceField[], companyId?: number | null) => Object.fromEntries(
  fields.map((field) => [field.name, field.type === 'boolean' ? true : ((field.name === 'company_id' || field.name === 'empresa_id') && companyId ? companyId : '')]),
);

export function ResourceCrudPage({ resource }: { resource: keyof typeof resourceConfigs }) {
  const config = resourceConfigs[resource];
  const router = useRouter();
  const user = getUser();
  const isSuperAdmin = user?.role === 'superadmin';
  const companyId = user?.empresa_id ?? null;
  const allowed = !config.superadminOnly || isSuperAdmin;
  const { items, loading, error, setError, load, upsertLocal, removeLocal } = useResource<any>(config.endpoint, allowed);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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
    if (!allowed) return;
    const requests: Promise<any>[] = [api.get('/api/admin/applications')];
    if (isSuperAdmin) requests.push(api.get('/api/admin/companies'));
    void Promise.all(requests).then(([applicationsResponse, companiesResponse]) => {
      setApplications((applicationsResponse.data?.data ?? []).map((item: any) => ({ label: item.name, value: Number(item.id), company_id: Number(item.company_id) })));
      if (companiesResponse) setCompanies((companiesResponse.data?.data ?? []).map((item: any) => ({ label: item.name, value: Number(item.id) })));
    }).catch(() => undefined);
  }, [allowed, isSuperAdmin]);

  const visibleFields = useMemo(() => config.fields.filter((field) => isSuperAdmin || !['company_id', 'empresa_id'].includes(field.name)), [config.fields, isSuperAdmin]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => Object.values(item).some((value) => String(Array.isArray(value) ? value.join(', ') : value ?? '').toLowerCase().includes(term)));
  }, [items, search]);
  const paginated = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [search, pageSize]);
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (page > maxPage) setPage(maxPage);
  }, [filtered.length, page, pageSize]);

  const close = () => { setOpen(false); setEditingId(null); setValues(initialValues(config.fields, companyId)); };
  const optionsFor = (field: ResourceField) => field.lookup === 'companies' ? companies : field.lookup === 'applications' ? applications.filter((item) => !values.company_id || item.company_id === Number(values.company_id)) : field.options ?? [];

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

  async function regenerate(item: any) {
    if (!window.confirm(`Regenerar o token de ${item.name}? O token atual deixará de funcionar imediatamente.`)) return;
    try {
      const response = await api.post(`/api/admin/api-keys/${item.id}/regenerate`);
      upsertLocal(response.data?.data);
      setGeneratedKey(response.data?.api_key ?? '');
      setMessage('API Key regenerada com sucesso.');
    } catch (requestError: any) { setError(requestError?.response?.data?.error || 'Não foi possível regenerar a API Key.'); }
  }

  async function revoke(item: any) {
    if (!window.confirm(`Revogar a API Key ${item.name}?`)) return;
    try {
      const response = await api.post(`/api/admin/api-keys/${item.id}/revoke`);
      upsertLocal(response.data?.data);
      setMessage('API Key revogada.');
    } catch (requestError: any) { setError(requestError?.response?.data?.error || 'Não foi possível revogar a API Key.'); }
  }

  async function copyGeneratedKey() {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setMessage('Token copiado para a área de transferência.');
  }

  if (!allowed) return null;

  return <AuthGuard><AppShell><Stack spacing={3}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
      <Box><Typography variant="h4" fontWeight={800}>{config.title}</Typography><Typography color="text.secondary">{config.description}</Typography></Box>
      <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setEditingId(null); setValues(initialValues(config.fields, companyId)); setOpen(true); }}>{config.actionLabel}</Button>
    </Stack>
    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
    {generatedKey && <Alert severity="warning" onClose={() => setGeneratedKey('')} action={<Button color="inherit" size="small" startIcon={<ContentCopyRoundedIcon />} onClick={() => void copyGeneratedKey()}>Copiar</Button>}><strong>Copie o token agora. Ele não será exibido novamente.</strong><Box component="code" sx={{ display: 'block', mt: 1, wordBreak: 'break-all', fontWeight: 700 }}>{generatedKey}</Box></Alert>}

    <Card variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}><Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
        <TextField fullWidth size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Buscar em ${config.title.toLowerCase()}...`} InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }} />
        <Button variant="contained" startIcon={<RefreshRoundedIcon />} onClick={() => void load()} disabled={loading} sx={{ minWidth: 120 }}>Atualizar</Button>
      </Stack></Box>
      <Divider />
      <ResourceListTable config={config} rows={paginated} loading={loading} onEdit={edit} onDelete={(item) => void remove(item)} onRegenerate={resource === 'apiKeys' ? (item) => void regenerate(item) : undefined} onRevoke={resource === 'apiKeys' ? (item) => void revoke(item) : undefined} />
      {!loading && <PaginationBar page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1); }} />}
    </Card>
  </Stack>

  <Dialog open={open} onClose={saving ? undefined : close} fullWidth maxWidth="sm">
    <Stack component="form" onSubmit={submit}>
      <DialogTitle>{editingId ? `Editar ${config.title}` : config.actionLabel}</DialogTitle>
      <DialogContent><Stack spacing={2.2} pt={1}>
        {visibleFields.map((field) => field.type === 'boolean' ? (
          <Stack key={field.name} direction="row" justifyContent="space-between" alignItems="center"><Typography>{field.label}</Typography><Switch checked={Boolean(values[field.name])} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked }))} /></Stack>
        ) : (field.type === 'select' || field.lookup) ? (
          <FormControl key={field.name} fullWidth required={field.required}><InputLabel>{field.label}</InputLabel><Select label={field.label} value={String(values[field.name] ?? '')} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}>{!field.required && <MenuItem value=""><em>Nenhum</em></MenuItem>}{optionsFor(field).map((option) => <MenuItem key={String(option.value)} value={option.value}>{option.label}</MenuItem>)}</Select></FormControl>
        ) : (
          <TextField key={field.name} label={field.label} type={field.type ?? 'text'} required={field.required && !(editingId && field.type === 'password')} fullWidth value={String(values[field.name] ?? '')} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />
        ))}
      </Stack></DialogContent>
      <DialogActions sx={{ p: 3 }}><Button onClick={close} disabled={saving}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></DialogActions>
    </Stack>
  </Dialog>
  <Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={() => setMessage('')} message={message} />
  </AppShell></AuthGuard>;
}
