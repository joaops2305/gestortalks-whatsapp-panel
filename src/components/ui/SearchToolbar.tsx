'use client';

import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Button, InputAdornment, Paper, Stack, TextField } from '@mui/material';
import type { ReactNode } from 'react';

export function SearchToolbar({ value, onChange, placeholder = 'Pesquisar...', filters, onClear }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  onClear?: () => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
        <TextField
          size="small"
          fullWidth
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
        />
        {filters}
        {onClear && <Button startIcon={<FilterListRoundedIcon />} onClick={onClear}>Limpar</Button>}
      </Stack>
    </Paper>
  );
}
