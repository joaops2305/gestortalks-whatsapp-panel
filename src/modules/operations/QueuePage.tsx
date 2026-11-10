'use client';

import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert, Box, Button, Card, Chip, CircularProgress, FormControl, InputAdornment, InputLabel,
  MenuItem, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { PaginationBar } from '@/components/ui/PaginationBar';
import { instanceService } from '@/modules/instances/instance.service';
import type { WhatsAppInstance } from '@/modules/instances/types';
import { operationsService } from './operations.service';

const labels: Record<string,string> = { pending:'Pendente', processing:'Processando', sent:'Enviada', failed:'Falhou' };
const colors: Record<string,any> = { pending:'warning', processing:'info', sent:'success', failed:'error' };

type Period = 'today' | 'yesterday' | '7days' | 'custom';

function dayRange(period: Period, customFrom = '', customTo = '') {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(end.getDate()+1);
  if (period === 'yesterday') { start.setDate(start.getDate()-1); end.setDate(end.getDate()-1); }
  if (period === '7days') start.setDate(start.getDate()-6);
  if (period === 'custom' && customFrom && customTo) {
    const from = new Date(customFrom + 'T00:00:00');
    const to = new Date(customTo + 'T00:00:00');
    to.setDate(to.getDate()+1);
    return { date_from: from.toISOString(), date_to: to.toISOString() };
  }
  return { date_from: start.toISOString(), date_to: end.toISOString() };
}

function fmt(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

export function QueuePage() {
  const [rows,setRows]=useState<any[]>([]);
  const [instances,setInstances]=useState<WhatsAppInstance[]>([]);
  const [instanceId,setInstanceId]=useState('');
  const [status,setStatus]=useState('');
  const [search,setSearch]=useState('');
  const [period,setPeriod]=useState<Period>('today');
  const [customFrom,setCustomFrom]=useState('');
  const [customTo,setCustomTo]=useState('');
  const [filters,setFilters]=useState({instance_id:'',status:'',search:'',period:'today' as Period,customFrom:'',customTo:''});
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState(25);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  useEffect(()=>{ void instanceService.list().then(setInstances).catch(()=>setInstances([])); },[]);

  const load=useCallback(async(silent=false)=>{
    if(!silent) setLoading(true);
    setError('');
    try {
      const result=await operationsService.queue({
        instance_id: filters.instance_id ? Number(filters.instance_id) : undefined,
        status: filters.status,
        search: filters.search,
        ...dayRange(filters.period, filters.customFrom, filters.customTo),
        page, limit: pageSize,
      });
      setRows(result.data ?? []);
      setTotal(Number(result.total ?? 0));
    } catch(e:any) {
      setError(e?.response?.data?.error || 'Não foi possível carregar a fila.');
    } finally { if(!silent) setLoading(false); }
  },[filters,page,pageSize]);

  useEffect(()=>{ void load(); },[load]);
  useEffect(()=>{
    const timer=window.setInterval(()=>void load(true),5000);
    return ()=>window.clearInterval(timer);
  },[load]);

  const apply=()=>{
    if(period==='custom' && (!customFrom || !customTo)) return;
    setPage(1);
    setFilters({instance_id:instanceId,status,search,period,customFrom,customTo});
  };

  return <AuthGuard><AppShell><Stack spacing={3}>
    <Box>
      <Typography variant="h4" fontWeight={800}>Fila</Typography>
      <Typography color="text.secondary">Acompanhe os envios enfileirados por instância.</Typography>
    </Box>
    <Card variant="outlined" sx={{overflow:'hidden'}}>
      <Box sx={{p:2.5}}>
        <Stack direction={{xs:'column',lg:'row'}} spacing={1.5}>
          <TextField fullWidth size="small" placeholder="Buscar número, mensagem ou erro" value={search}
            onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&apply()}
            InputProps={{startAdornment:<InputAdornment position="start"><SearchRoundedIcon fontSize="small"/></InputAdornment>}}/>
          <FormControl size="small" sx={{minWidth:230}}>
            <InputLabel>Instância</InputLabel>
            <Select label="Instância" value={instanceId} onChange={e=>setInstanceId(String(e.target.value))}>
              <MenuItem value="">Todas as instâncias</MenuItem>
              {instances.map(i=><MenuItem key={i.id} value={String(i.id)}>{i.name || i.session} (ID {i.id})</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{minWidth:170}}>
            <InputLabel>Período</InputLabel>
            <Select label="Período" value={period} onChange={e=>setPeriod(e.target.value as Period)}>
              <MenuItem value="today">Hoje</MenuItem>
              <MenuItem value="yesterday">Ontem</MenuItem>
              <MenuItem value="7days">Últimos 7 dias</MenuItem>
              <MenuItem value="custom">Personalizado</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{minWidth:170}}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={e=>setStatus(String(e.target.value))}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pending">Pendente</MenuItem>
              <MenuItem value="processing">Processando</MenuItem>
              <MenuItem value="sent">Enviada</MenuItem>
              <MenuItem value="failed">Falhou</MenuItem>
            </Select>
          </FormControl>
          {period==='custom'&&<>
            <TextField size="small" type="date" label="De" InputLabelProps={{shrink:true}} value={customFrom} onChange={e=>setCustomFrom(e.target.value)}/>
            <TextField size="small" type="date" label="Até" InputLabelProps={{shrink:true}} value={customTo} onChange={e=>setCustomTo(e.target.value)}/>
          </>}
          <Button variant="contained" startIcon={<RefreshRoundedIcon/>} onClick={apply}>Filtrar</Button>
        </Stack>
      </Box>
      {error&&<Alert severity="error" sx={{mx:2.5,mb:2}}>{error}</Alert>}
      {loading?<Stack alignItems="center" py={8}><CircularProgress/></Stack>:<>
        <TableContainer sx={{borderTop:'1px solid',borderColor:'divider'}}>
          <Table size="small" sx={{minWidth:1100}}>
            <TableHead><TableRow>
              {['Entrada','Instância','Destino','Tipo','Status','Tentativas','Enviada em','Erro'].map(x=><TableCell key={x} sx={{fontSize:11,fontWeight:800,textTransform:'uppercase',bgcolor:'action.hover'}}>{x}</TableCell>)}
            </TableRow></TableHead>
            <TableBody>
              {rows.map(row=><TableRow key={row.id} hover>
                <TableCell>{fmt(row.created_at)}</TableCell>
                <TableCell><Typography variant="body2" fontWeight={700}>{row.instance_name || 'Sem nome'}</Typography><Typography variant="caption" color="text.secondary">{row.session || 'ID '+row.instance_id}</Typography></TableCell>
                <TableCell>{row.phone}</TableCell>
                <TableCell><Chip size="small" variant="outlined" label={row.message_type}/></TableCell>
                <TableCell><Chip size="small" color={colors[row.status]||'default'} label={labels[row.status]||row.status}/></TableCell>
                <TableCell>{row.attempts ?? 0}</TableCell>
                <TableCell>{fmt(row.sent_at)}</TableCell>
                <TableCell sx={{maxWidth:280}}><Typography variant="body2" noWrap title={row.error_message||''}>{row.error_message||'-'}</Typography></TableCell>
              </TableRow>)}
              {!rows.length&&<TableRow><TableCell colSpan={8} sx={{py:5,textAlign:'center',color:'text.secondary'}}>Nenhum item na fila.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={v=>{setPageSize(v);setPage(1);}}/>
      </>}
    </Card>
  </Stack></AppShell></AuthGuard>;
}
