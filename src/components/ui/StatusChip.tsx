import { Chip, type ChipProps } from '@mui/material';

const statusMap: Record<string, { label: string; color: ChipProps['color'] }> = {
  connected: { label: 'Conectado', color: 'success' },
  disconnected: { label: 'Desconectado', color: 'default' },
  reconnecting: { label: 'Reconectando', color: 'warning' },
  qr: { label: 'Aguardando QR', color: 'info' },
  active: { label: 'Ativo', color: 'success' },
  inactive: { label: 'Inativo', color: 'default' },
  error: { label: 'Erro', color: 'error' },
  pending: { label: 'Pendente', color: 'warning' },
};

export function StatusChip({ status }: { status?: string | null }) {
  const normalized = String(status ?? 'unknown').toLowerCase();
  const config = statusMap[normalized] ?? { label: status || 'Desconhecido', color: 'default' as const };
  return <Chip size="small" label={config.label} color={config.color} variant={config.color === 'default' ? 'outlined' : 'filled'} />;
}
