'use client';

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import {
  Alert, Avatar, Box, Chip, CircularProgress, IconButton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
import type { WhatsAppInstance } from './types';

function statusColor(status: string) {
  if (status === 'connected') return 'success' as const;
  if (status === 'qr' || status === 'connecting' || status === 'starting') return 'warning' as const;
  if (status === 'error' || status === 'logged_out') return 'error' as const;
  return 'default' as const;
}

export function InstanceListTable({ rows, loading, busyId, onQr, onDisconnect, onLogout, onDelete }: {
  rows: WhatsAppInstance[];
  loading: boolean;
  busyId: number | null;
  onQr: (instance: WhatsAppInstance) => void;
  onDisconnect: (instance: WhatsAppInstance) => void;
  onLogout: (instance: WhatsAppInstance) => void;
  onDelete: (instance: WhatsAppInstance) => void;
}) {
  if (loading) return <Stack alignItems="center" justifyContent="center" minHeight={260}><CircularProgress /></Stack>;
  if (!rows.length) return <Alert severity="info" sx={{ m: 2 }}>Nenhuma instância encontrada.</Alert>;

  const columns: Array<[string, number]> = [['Instância', 250], ['Empresa', 190], ['Número', 170], ['Provider', 120], ['Status', 130]];

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table stickyHeader size="small" sx={{ minWidth: 1040, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            {columns.map(([label, width]) => <TableCell key={label} sx={{ width, py: 1.25, bgcolor: 'action.selected', borderBottom: '1px solid', borderColor: 'divider', fontSize: 11, fontWeight: 800, letterSpacing: .35, color: 'text.secondary', textTransform: 'uppercase' }}>{label}</TableCell>)}
            <TableCell align="right" sx={{ width: 190, py: 1.25, bgcolor: 'action.selected', borderBottom: '1px solid', borderColor: 'divider', fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((instance) => (
            <TableRow hover key={instance.id} sx={{ '&:last-child td': { borderBottom: 0 }, '& td': { py: 1.2 } }}>
              <TableCell>
                <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12, fontWeight: 800 }}>{(instance.name || instance.session || '?').slice(0, 2).toUpperCase()}</Avatar>
                  <Box minWidth={0}>
                    <Typography variant="body2" fontWeight={700} noWrap title={instance.name || instance.session}>{instance.name || instance.session}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{instance.session}</Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell><Typography variant="body2" noWrap title={instance.company_name || String(instance.empresa_id)}>{instance.company_name || instance.empresa_id}</Typography></TableCell>
              <TableCell><Typography variant="body2" noWrap>{instance.phone_number || '-'}</Typography></TableCell>
              <TableCell><Chip size="small" label={instance.provider || 'baileys'} variant="outlined" /></TableCell>
              <TableCell><Chip size="small" label={instance.status} color={statusColor(String(instance.status))} sx={{ minWidth: 92, fontWeight: 700 }} /></TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                  <Tooltip title="Conectar / QR Code"><IconButton size="small" onClick={() => onQr(instance)}><QrCode2RoundedIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Desconectar"><span><IconButton size="small" disabled={busyId === instance.id} onClick={() => onDisconnect(instance)}><LinkOffRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title="Logout"><span><IconButton size="small" color="warning" disabled={busyId === instance.id} onClick={() => onLogout(instance)}><LogoutRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
                  <Tooltip title="Excluir"><span><IconButton size="small" color="error" disabled={busyId === instance.id} onClick={() => onDelete(instance)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
