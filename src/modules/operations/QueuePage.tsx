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
  const [filters,setFilters]=useState({instance_id:'',status:'',search:''});
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

  const apply=()=>{ setPage(1); setFilters({instance_id:instanceId,status,search}); };

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
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={e=>setStatus(String(e.target.value))}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pending">Pendente</MenuItem>
              <MenuItem value="processing">Processando</MenuItem>
              <MenuItem value="sent">Enviada</MenuItem>
              <MenuItem value="failed">Falhou</MenuItem>
            </Select>
          </FormControl>
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
