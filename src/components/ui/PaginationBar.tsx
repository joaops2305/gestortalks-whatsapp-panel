'use client';

import { Box, MenuItem, Pagination, Select, Stack, Typography } from '@mui/material';

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ sm: 'center' }}
      justifyContent="space-between"
      sx={{ pt: 2 }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">Itens por página:</Typography>
        <Select
          size="small"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          sx={{ minWidth: 82 }}
        >
          {[10, 25, 50, 100].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
        </Select>
      </Stack>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: { xs: 'left', sm: 'right' }, mb: 0.5 }}>
          {start}-{end} de {total}
        </Typography>
        <Pagination
          page={Math.min(page, pages)}
          count={pages}
          onChange={(_, value) => onPageChange(value)}
          color="primary"
          size="small"
          showFirstButton
          showLastButton
        />
      </Box>
    </Stack>
  );
}
