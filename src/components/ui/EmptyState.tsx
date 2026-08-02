import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';

export function EmptyState({ title = 'Nenhum registro encontrado', description, actionLabel, onAction }: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
      <Stack alignItems="center" spacing={1.5}>
        <Box sx={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: 3, bgcolor: 'action.hover' }}>
          <InboxRoundedIcon color="action" />
        </Box>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
        {description && <Typography color="text.secondary" maxWidth={520}>{description}</Typography>}
        {actionLabel && onAction && <Button variant="contained" onClick={onAction}>{actionLabel}</Button>}
      </Stack>
    </Paper>
  );
}
