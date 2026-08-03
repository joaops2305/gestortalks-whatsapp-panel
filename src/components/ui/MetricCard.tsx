import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function MetricCard({ label, value, helper, icon }: { label: string; value: ReactNode; helper?: string; icon?: ReactNode }) {
  return (
    <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography color="text.secondary" variant="body2">{label}</Typography>
            <Typography variant="h4" fontWeight={800} mt={0.75}>{value}</Typography>
            {helper && <Typography variant="caption" color="text.secondary">{helper}</Typography>}
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: 'action.hover', display: 'grid', placeItems: 'center', color: 'primary.main' }}>
            {icon ?? <TrendingUpRoundedIcon />}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
