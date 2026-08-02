'use client';

import { MenuItem, Pagination, Select, Stack, Typography } from '@mui/material';

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
  const currentPage = Math.min(page, pages);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        minHeight: 64,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          Itens por página:
        </Typography>
        <Select
          size="small"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          sx={{ minWidth: 82 }}
        >
          {[10, 25, 50, 100].map((value) => (
            <MenuItem key={value} value={value}>{value}</MenuItem>
          ))}
        </Select>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1, sm: 1.5 }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="flex-end"
      >
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
          {start}-{end} de {total}
        </Typography>

        <Pagination
          page={currentPage}
          count={pages}
          onChange={(_, value) => onPageChange(value)}
          color="primary"
          size="small"
          showFirstButton
          showLastButton
          siblingCount={1}
          boundaryCount={1}
        />
      </Stack>
    </Stack>
  );
}
