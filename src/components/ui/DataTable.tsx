'use client';

import { Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';

export type DataColumn<T> = {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({ rows, columns, loading = false, getRowKey, page = 0, rowsPerPage = 10, total = rows.length, onPageChange, onRowsPerPageChange, emptyTitle, emptyDescription }: {
  rows: T[];
  columns: DataColumn<T>[];
  loading?: boolean;
  getRowKey: (row: T) => string | number;
  page?: number;
  rowsPerPage?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!loading && rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => <TableCell key={column.key} align={column.align} sx={{ width: column.width, fontWeight: 700 }}>{column.label}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? Array.from({ length: Math.min(rowsPerPage, 5) }).map((_, index) => (
              <TableRow key={index}>{columns.map((column) => <TableCell key={column.key}><Skeleton /></TableCell>)}</TableRow>
            )) : rows.map((row) => (
              <TableRow hover key={getRowKey(row)}>{columns.map((column) => <TableCell key={column.key} align={column.align}>{column.render(row)}</TableCell>)}</TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {(onPageChange || onRowsPerPageChange) && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, nextPage) => onPageChange?.(nextPage)}
          onRowsPerPageChange={(event) => onRowsPerPageChange?.(Number(event.target.value))}
          labelRowsPerPage="Itens por página"
          labelDisplayedRows={({ from, to, count }) => <Typography variant="caption">{from}–{to} de {count}</Typography> as any}
        />
      )}
    </Paper>
  );
}
