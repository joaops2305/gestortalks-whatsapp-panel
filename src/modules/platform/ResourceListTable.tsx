'use client';

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import type { ResourceConfig } from './resource.config';

const isEnabled = (value: unknown) => Number(value) === 1 || value === true || value === 'active';

function initials(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) return '?';
  return text.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.join(', ');
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function statusChip(value: unknown) {
  const active = isEnabled(value);
  return (
    <Chip
      size="small"
      label={active ? 'Ativo' : 'Inativo'}
      color={active ? 'success' : 'default'}
      variant={active ? 'filled' : 'outlined'}
      sx={{ minWidth: 72, fontWeight: 700 }}
    />
  );
}

export function ResourceListTable({
  config,
  rows,
  loading,
  onEdit,
  onDelete,
}: {
  config: ResourceConfig;
  rows: any[];
  loading: boolean;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}) {
  if (loading) {
    return <Stack alignItems="center" justifyContent="center" minHeight={260}><CircularProgress /></Stack>;
  }

  if (!rows.length) {
    return <Alert severity="info">Nenhum registro encontrado.</Alert>;
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        overflowX: 'auto',
        boxShadow: 'none',
      }}
    >
      <Table stickyHeader size="small" sx={{ minWidth: 960, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            {config.columns.map((column, index) => (
              <TableCell
                key={column.key}
                sx={{
                  width: index === 0 ? 220 : undefined,
                  py: 1.5,
                  bgcolor: 'background.paper',
                  borderBottomWidth: 2,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.25,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {column.label}
              </TableCell>
            ))}
            <TableCell
              align="right"
              sx={{
                width: 112,
                py: 1.5,
                bgcolor: 'background.paper',
                borderBottomWidth: 2,
                fontSize: 12,
                fontWeight: 800,
                color: 'text.secondary',
                textTransform: 'uppercase',
              }}
            >
              Ações
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((item) => (
            <TableRow
              hover
              key={item.id}
              sx={{
                '&:last-child td': { borderBottom: 0 },
                '& td': { py: 1.35 },
              }}
            >
              {config.columns.map((column, index) => {
                const value = item[column.key];
                const display = displayValue(value);

                return (
                  <TableCell key={column.key}>
                    {column.key === 'status' ? statusChip(value) : index === 0 ? (
                      <Stack direction="row" spacing={1.4} alignItems="center" minWidth={0}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 800, bgcolor: 'primary.main' }}>
                          {initials(display)}
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography variant="body2" fontWeight={700} noWrap title={display}>{display}</Typography>
                          {item.id && <Typography variant="caption" color="text.secondary">ID #{item.id}</Typography>}
                        </Box>
                      </Stack>
                    ) : (
                      <Typography
                        variant="body2"
                        noWrap
                        title={display}
                        sx={{ color: column.key.includes('url') ? 'primary.main' : 'text.primary' }}
                      >
                        {display}
                      </Typography>
                    )}
                  </TableCell>
                );
              })}

              <TableCell align="right">
                <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => onEdit(item)}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton size="small" color="error" onClick={() => onDelete(item)}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
