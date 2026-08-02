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
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';

type AdminPageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  columns: string[];
  rows?: Array<Record<string, string | number>>;
  emptyMessage?: string;
};

type FieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'url' | 'select' | 'boolean';
  options?: string[];
  required?: boolean;
};

const FORM_FIELDS: Record<string, FieldConfig[]> = {
  Empresas: [
    { name: 'Nome', label: 'Nome da empresa', required: true },
    { name: 'Documento', label: 'CPF/CNPJ', required: true },
    { name: 'Email', label: 'E-mail', type: 'email', required: true },
    { name: 'Telefone', label: 'Telefone' },
    { name: 'Plano', label: 'Plano', type: 'select', options: ['Free', 'Starter', 'Pro', 'Enterprise'], required: true },
    { name: 'Limite de instâncias', label: 'Limite de instâncias', type: 'number', required: true },
    { name: 'Status', label: 'Ativa', type: 'boolean' },
  ],
  Usuários: [
    { name: 'Nome', label: 'Nome completo', required: true },
    { name: 'Email', label: 'E-mail', type: 'email', required: true },
    { name: 'Senha', label: 'Senha inicial', type: 'password', required: true },
    { name: 'Empresa', label: 'Empresa' },
    { name: 'Perfil', label: 'Perfil', type: 'select', options: ['superadmin', 'admin_empresa', 'desenvolvedor', 'operador', 'visualizador'], required: true },
    { name: 'Status', label: 'Ativo', type: 'boolean' },
  ],
  Instâncias: [
    { name: 'Nome', label: 'Nome da instância', required: true },
    { name: 'Empresa', label: 'Empresa', required: true },
    { name: 'Sessão', label: 'Identificador da sessão', required: true },
    { name: 'Provider', label: 'Provider', type: 'select', options: ['baileys', 'meta'], required: true },
    { name: 'Webhook', label: 'URL do webhook', type: 'url' },
    { name: 'Status', label: 'Ativa', type: 'boolean' },
  ],
  Aplicações: [
    { name: 'Nome', label: 'Nome da aplicação', required: true },
    { name: 'Empresa', label: 'Empresa', required: true },
    { name: 'Descrição', label: 'Descrição' },
    { name: 'Webhook', label: 'URL do webhook', type: 'url' },
    { name: 'Rate limit', label: 'Limite por minuto', type: 'number' },
    { name: 'Status', label: 'Ativa', type: 'boolean' },
  ],
  'API Keys': [
    { name: 'Nome', label: 'Nome da chave', required: true },
    { name: 'Empresa', label: 'Empresa', required: true },
    { name: 'Aplicação', label: 'Aplicação' },
    { name: 'Ambiente', label: 'Ambiente', type: 'select', options: ['test', 'live'], required: true },
    { name: 'Expiração', label: 'Validade em dias', type: 'number' },
    { name: 'Status', label: 'Ativa', type: 'boolean' },
  ],
  Webhooks: [
    { name: 'Nome', label: 'Nome do webhook', required: true },
    { name: 'Empresa', label: 'Empresa', required: true },
    { name: 'URL', label: 'URL de destino', type: 'url', required: true },
    { name: 'Eventos', label: 'Eventos' },
    { name: 'Secret', label: 'Segredo de assinatura', type: 'password' },
    { name: 'Status', label: 'Ativo', type: 'boolean' },
  ],
};

function initialValues(fields: FieldConfig[]) {
  return Object.fromEntries(fields.map((field) => [field.name, field.type === 'boolean' ? true : '']));
}

export function AdminPage({ title, description, actionLabel = 'Novo', columns, rows = [], emptyMessage = 'Nenhum registro encontrado.' }: AdminPageProps) {
  const fields = useMemo(() => FORM_FIELDS[title] ?? [
    { name: 'Nome', label: 'Nome', required: true },
    { name: 'Status', label: 'Ativo', type: 'boolean' },
  ], [title]);

  const [items, setItems] = useState(rows);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | number | boolean>>(() => initialValues(fields));
  const [search, setSearch] = useState('');
  const [success, setSuccess] = useState(false);

  const filteredItems = items.filter((item) =>
    Object.values(item).some((value) => String(value).toLowerCase().includes(search.toLowerCase())),
  );

  function closeDialog() {
    setOpen(false);
    setValues(initialValues(fields));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const newRow: Record<string, string | number> = {};
    for (const column of columns) {
      const value = values[column];
      if (typeof value === 'boolean') newRow[column] = value ? 'Ativo' : 'Inativo';
      else newRow[column] = value === undefined || value === '' ? '-' : String(value);
    }
    if ('Status' in newRow && newRow.Status === '-') newRow.Status = values.Status === false ? 'Inativo' : 'Ativo';
    setItems((current) => [newRow, ...current]);
    closeDialog();
    setSuccess(true);
  }

  return (
    <AuthGuard>
      <AppShell>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>{title}</Typography>
              <Typography color="text.secondary">{description}</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setOpen(true)}>{actionLabel}</Button>
          </Stack>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                <TextField
                  fullWidth
                  size="small"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Buscar em ${title.toLowerCase()}...`}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
                />
                <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={() => setSearch('')}>Atualizar</Button>
              </Stack>

              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 720 }}>
                  <Stack direction="row" spacing={2} sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                    {columns.map((column) => <Typography key={column} variant="caption" fontWeight={800} sx={{ flex: 1 }}>{column}</Typography>)}
                  </Stack>
                  {filteredItems.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>{emptyMessage}</Alert>
                  ) : filteredItems.map((row, index) => (
                    <Stack key={index} direction="row" spacing={2} sx={{ px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                      {columns.map((column) => {
                        const value = row[column] ?? '-';
                        return <Box key={column} sx={{ flex: 1 }}>{column === 'Status' ? <Chip label={String(value)} size="small" color={String(value).toLowerCase().includes('ativo') || String(value).toLowerCase().includes('conect') ? 'success' : 'default'} /> : <Typography variant="body2">{value}</Typography>}</Box>;
                      })}
                    </Stack>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Stack>

        <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
          <Stack component="form" onSubmit={submit}>
            <DialogTitle>{actionLabel}</DialogTitle>
            <DialogContent>
              <Stack spacing={2.2} pt={1}>
                {fields.map((field) => {
                  if (field.type === 'boolean') {
                    return (
                      <Stack key={field.name} direction="row" justifyContent="space-between" alignItems="center">
                        <Typography>{field.label}</Typography>
                        <Switch
                          checked={Boolean(values[field.name])}
                          onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.checked }))}
                        />
                      </Stack>
                    );
                  }
                  if (field.type === 'select') {
                    return (
                      <FormControl key={field.name} fullWidth required={field.required}>
                        <InputLabel>{field.label}</InputLabel>
                        <Select
                          label={field.label}
                          value={String(values[field.name] ?? '')}
                          onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                        >
                          {field.options?.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
                        </Select>
                      </FormControl>
                    );
                  }
                  return (
                    <TextField
                      key={field.name}
                      label={field.label}
                      type={field.type ?? 'text'}
                      required={field.required}
                      fullWidth
                      value={String(values[field.name] ?? '')}
                      onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
                    />
                  );
                })}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" variant="contained">Salvar</Button>
            </DialogActions>
          </Stack>
        </Dialog>

        <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} message={`${title.slice(0, -1)} cadastrado com sucesso.`} />
      </AppShell>
    </AuthGuard>
  );
}
