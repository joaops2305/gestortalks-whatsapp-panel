'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Button, Stack, Typography } from '@mui/material';

export function PageHeader({ title, description, actionLabel = 'Novo', onAction, onRefresh }: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onRefresh?: () => void;
}) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
      <Box>
        <Typography variant="h4" fontWeight={800}>{title}</Typography>
        {description && <Typography color="text.secondary">{description}</Typography>}
      </Box>
      <Stack direction="row" spacing={1}>
        {onRefresh && <Button variant="outlined" startIcon={<RefreshRoundedIcon />} onClick={onRefresh}>Atualizar</Button>}
        {onAction && <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onAction}>{actionLabel}</Button>}
      </Stack>
    </Stack>
  );
}
