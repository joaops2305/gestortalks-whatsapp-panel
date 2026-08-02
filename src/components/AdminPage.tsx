'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputAdornment, InputLabel,
  MenuItem, Select, Snackbar, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { QrCodeDialog } from '@/components/ui';
import { api } from '@/services/api';
import { getUser } from '@/services/auth';

type Props = { title: string; description: string; actionLabel?: string; columns: string[]; emptyMessage?: string };
type Option = { label: string; value: string | number; company_id?: number };
type Field = { name: string; label: string; type?: 'text'|'email'|'password'|'number'|'url'|'select'|'boolean'; options?: Option[]; lookup?: 'companies'|'applications'; required?: boolean };
type Config = { endpoint: string; fields: Field[]; toRow: (item:any)=>Record<string,any>; toPayload: (values:Record<string,any>)=>Record<string,any> };

const active = (value: unknown) => Number(value) === 1 || value === true;
const status = (value: unknown) => active(value) ? 'Ativo' : 'Inativo';
const companyField = (name='company_id'): Field => ({ name, label:'Empresa', type:'select', lookup:'companies', required:true });
const appField: Field = { name:'application_id', label:'Aplicação', type:'select', lookup:'applications' };

const configs: Record<string, Config> = {
  Empresas: {
    endpoint:'/api/admin/companies',
    fields:[
      {name:'name',label:'Nome da empresa',required:true},{name:'document',label:'CPF/CNPJ'},
      {name:'email',label:'E-mail',type:'email'},{name:'phone',label:'Telefone'},
      {name:'plan',label:'Plano',type:'select',options:['Free','Starter','Pro','Enterprise'].map(value=>({label:value,value})),required:true},
      {name:'instance_limit',label:'Limite de instâncias',type:'number',required:true},{name:'status',label:'Ativa',type:'boolean'},
    ],
    toRow:item=>({id:item.id,Nome:item.name,Documento:item.document||'-',Plano:item.plan,'Instâncias':item.instances??0,Status:status(item.status)}),
    toPayload:v=>({...v,instance_limit:Number(v.instance_limit||1)}),
  },
  Usuários: {
    endpoint:'/api/admin/users',
    fields:[
      {name:'name',label:'Nome completo',required:true},{name:'email',label:'E-mail',type:'email',required:true},
      {name:'password',label:'Senha inicial',type:'password'},companyField(),
      {name:'role',label:'Perfil',type:'select',options:['superadmin','admin_empresa','desenvolvedor','operador','visualizador'].map(value=>({label:value,value})),required:true},
      {name:'status',label:'Ativo',type:'boolean'},
    ],
    toRow:item=>({id:item.id,Nome:item.name,Email:item.email,Empresa:item.company_name||'Global',Perfil:item.role,Status:status(item.status)}),
    toPayload:v=>({...v,company_id:v.company_id?Number(v.company_id):null,password:v.password||undefined}),
  },
  Instâncias: {
    endpoint:'/api/instances',
    fields:[{name:'name',label:'Nome da instância',required:true},companyField('empresa_id'),{name:'external_instance_id',label:'ID externo',type:'number'},{name:'session',label:'Identificador da sessão',required:true}],
    toRow:item=>({id:item.id,Nome:item.name||item.session,Empresa:item.company_name||item.empresa_id,Número:item.phone_number||'-',Provider:item.provider||'baileys',Status:item.status||'disconnected'}),
    toPayload:v=>({name:v.name,empresa_id:Number(v.empresa_id),external_instance_id:v.external_instance_id?Number(v.external_instance_id):null,session:v.session}),
  },
  Aplicações: {
    endpoint:'/api/admin/applications',
    fields:[{name:'name',label:'Nome da aplicação',required:true},companyField(),{name:'description',label:'Descrição'},{name:'webhook_url',label:'URL do webhook',type:'url'},{name:'rate_limit',label:'Limite por minuto',type:'number'},{name:'status',label:'Ativa',type:'boolean'}],
    toRow:item=>({id:item.id,Nome:item.name,Empresa:item.company_name||item.company_id,Descrição:item.description||'-','Rate limit':item.rate_limit,Status:status(item.status)}),
    toPayload:v=>({...v,company_id:Number(v.company_id),rate_limit:Number(v.rate_limit||300),webhook_url:v.webhook_url||null}),
  },
  'API Keys': {
    endpoint:'/api/admin/api-keys',
    fields:[{name:'name',label:'Nome da chave',required:true},companyField(),appField,{name:'environment',label:'Ambiente',type:'select',options:[{label:'Teste',value:'test'},{label:'Produção',value:'live'}],required:true},{name:'expires_in_days',label:'Validade em dias',type:'number'},{name:'status',label:'Ativa',type:'boolean'}],
    toRow:item=>({id:item.id,Nome:item.name,Empresa:item.company_name||item.company_id,Aplicação:item.application_name||'-',Ambiente:item.environment,Status:status(item.status)}),
    toPayload:v=>({...v,company_id:Number(v.company_id),application_id:v.application_id?Number(v.application_id):null,expires_in_days:v.expires_in_days?Number(v.expires_in_days):null}),
  },
  Webhooks: {
    endpoint:'/api/admin/webhooks',
    fields:[{name:'name',label:'Nome do webhook',required:true},companyField(),appField,{name:'url',label:'URL de destino',type:'url',required:true},{name:'events',label:'Eventos separados por vírgula'},{name:'secret',label:'Segredo de assinatura',type:'password'},{name:'status',label:'Ativo',type:'boolean'}],
    toRow:item=>({id:item.id,Nome:item.name,Empresa:item.company_name||item.company_id,URL:item.url,Eventos:Array.isArray(item.events)?item.events.join(', '):'-',Status:status(item.status)}),
    toPayload:v=>({...v,company_id:Number(v.company_id),application_id:v.application_id?Number(v.application_id):null,events:String(v.events||'onmessage,onconnection').split(',').map((x:string)=>x.trim()).filter(Boolean),secret:v.secret||null}),
  },
};

function initial(fields: Field[], companyId?: number | null) {
  return Object.fromEntries(fields.map(field => [field.name,
    field.type === 'boolean' ? true :
    (field.name === 'company_id' || field.name === 'empresa_id') && companyId ? companyId : '',
  ]));
}

export function AdminPage({ title, description, actionLabel='Novo', columns, emptyMessage='Nenhum registro encontrado.' }: Props) {
  const router = useRouter();
  const user = getUser();
  const isSuperAdmin = user?.role === 'superadmin';
  const companyId = user?.empresa_id ?? null;
  const config = configs[title];
  const restricted = title === 'Empresas' || title === 'Usuários';
  const visibleFields = useMemo(() => (config?.fields ?? []).filter(field => isSuperAdmin || (field.name !== 'company_id' && field.name !== 'empresa_id')), [config, isSuperAdmin]);

  const [items,setItems]=useState<Array<Record<string,any>>>([]);
  const [companies,setCompanies]=useState<Option[]>([]);
  const [applications,setApplications]=useState<Option[]>([]);
  const [values,setValues]=useState<Record<string,any>>(()=>initial(config?.fields??[],companyId));
  const [open,setOpen]=useState(false); const [editingId,setEditingId]=useState<number|null>(null);
  const [search,setSearch]=useState(''); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  const [error,setError]=useState(''); const [message,setMessage]=useState(''); const [generatedKey,setGeneratedKey]=useState('');
  const [qrOpen,setQrOpen]=useState(false); const [qrCode,setQrCode]=useState<string|null>(null); const [qrName,setQrName]=useState('');

  useEffect(()=>{ if (restricted && !isSuperAdmin) router.replace('/'); },[restricted,isSuperAdmin,router]);

  const loadLookups=useCallback(async()=>{
    if(!isSuperAdmin) return;
    try{
      const [c,a]=await Promise.all([api.get('/api/admin/companies'),api.get('/api/admin/applications')]);
      setCompanies((c.data?.data??[]).map((x:any)=>({label:x.name,value:x.id})));
      setApplications((a.data?.data??[]).map((x:any)=>({label:x.name,value:x.id,company_id:Number(x.company_id)})));
    }catch{}
  },[isSuperAdmin]);

  const load=useCallback(async(silent=false)=>{
    if(!config || (restricted&&!isSuperAdmin)) return;
    if(!silent) setLoading(true);
    try{
      const response=await api.get(config.endpoint);
      setItems((response.data?.data??[]).map((item:any)=>({...config.toRow(item),__raw:item})));
    }catch(e:any){if(!silent)setError(e?.response?.data?.error||'Não foi possível carregar os registros.');}
    finally{if(!silent)setLoading(false);}
  },[config,restricted,isSuperAdmin]);

  useEffect(()=>{void load();void loadLookups();},[load,loadLookups]);
  useEffect(()=>{
    if(title!=='Instâncias')return;
    const timer=window.setInterval(()=>{if(!document.hidden&&!open&&!saving&&!qrOpen)void load(true);},5000);
    return()=>window.clearInterval(timer);
  },[title,load,open,saving,qrOpen]);

  const filtered=items.filter(item=>Object.values(item).some(value=>typeof value!=='object'&&String(value).toLowerCase().includes(search.toLowerCase())));
  const options=(field:Field)=>field.lookup==='companies'?companies:field.lookup==='applications'?applications.filter(a=>!values.company_id||a.company_id===Number(values.company_id)):field.options??[];
  const reset=()=>setValues(initial(config?.fields??[],companyId));
  const close=()=>{setOpen(false);setEditingId(null);reset();};

  function edit(row:Record<string,any>){
    const raw=row.__raw??{};const next=initial(config.fields,companyId);
    for(const field of config.fields){if(field.name==='password'||field.name==='secret')continue;const value=raw[field.name];next[field.name]=field.type==='boolean'?active(value):field.name==='events'&&Array.isArray(value)?value.join(','):value??next[field.name];}
    setValues(next);setEditingId(Number(row.id));setOpen(true);
  }

  async function submit(event:FormEvent){
    event.preventDefault();setSaving(true);setError('');setGeneratedKey('');
    try{
      const tenantValues={...values};
      if(!isSuperAdmin&&companyId){tenantValues.company_id=companyId;tenantValues.empresa_id=companyId;}
      const payload=config.toPayload(tenantValues);
      const response=editingId?await api.put(`${config.endpoint}/${editingId}`,payload):await api.post(config.endpoint,payload);
      if(response.data?.api_key)setGeneratedKey(response.data.api_key);
      setMessage(editingId?'Registro atualizado.':'Registro cadastrado.');close();await load();
    }catch(e:any){setError(e?.response?.data?.error||'Não foi possível salvar.');}
    finally{setSaving(false);}
  }

  async function remove(row:Record<string,any>){if(!window.confirm(`Excluir ${row.Nome||row.id}?`))return;try{await api.delete(`${config.endpoint}/${row.id}`);await load();setMessage('Registro excluído.');}catch(e:any){setError(e?.response?.data?.error||'Não foi possível excluir.');}}
  async function instanceAction(id:number,action:'connect'|'disconnect'|'logout'){try{await api.post(`/api/instances/${id}/${action}`);setMessage('Ação executada.');await load(true);}catch(e:any){setError(e?.response?.data?.error||'Falha na ação.');}}
  async function showQr(row:Record<string,any>){try{const response=await api.get(`/api/instances/${row.id}/qrcode`);setQrCode(response.data?.data?.qrCode??null);setQrName(String(row.Nome||'instância'));setQrOpen(true);}catch(e:any){setError(e?.response?.data?.error||'Não foi possível consultar o QR.');}}

  if(restricted&&!isSuperAdmin)return null;

  return <AuthGuard><AppShell><Stack spacing={3}>
    <Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" spacing={2} alignItems={{sm:'center'}}>
      <Box><Typography variant="h4" fontWeight={800}>{title}</Typography><Typography color="text.secondary">{description}</Typography></Box>
      <Button variant="contained" startIcon={<AddRoundedIcon/>} onClick={()=>{reset();setEditingId(null);setOpen(true);}}>{actionLabel}</Button>
    </Stack>
    {error&&<Alert severity="error" onClose={()=>setError('')}>{error}</Alert>}
    {generatedKey&&<Alert severity="warning"><strong>Copie a API Key agora:</strong><Box component="code" sx={{display:'block',mt:1,wordBreak:'break-all'}}>{generatedKey}</Box></Alert>}
    <Card variant="outlined"><CardContent>
      <Stack direction={{xs:'column',sm:'row'}} spacing={2} mb={3}><TextField fullWidth size="small" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." InputProps={{startAdornment:<InputAdornment position="start"><SearchRoundedIcon/></InputAdornment>}}/><Button variant="outlined" startIcon={<RefreshRoundedIcon/>} onClick={()=>void load()}>Atualizar</Button></Stack>
      <Box sx={{overflowX:'auto'}}><Box sx={{minWidth:title==='Instâncias'?1040:820}}>
        <Stack direction="row" spacing={2} sx={{px:2,py:1.5,bgcolor:'action.hover',borderRadius:2}}>{columns.map(c=><Typography key={c} variant="caption" fontWeight={800} sx={{flex:1}}>{c}</Typography>)}<Typography variant="caption" fontWeight={800} sx={{width:title==='Instâncias'?220:90}}>Ações</Typography></Stack>
        {loading?<Stack alignItems="center" py={5}><CircularProgress/></Stack>:filtered.length===0?<Alert severity="info" sx={{mt:2}}>{emptyMessage}</Alert>:filtered.map(row=><Stack key={row.id} direction="row" spacing={2} alignItems="center" sx={{px:2,py:1.5,borderBottom:'1px solid',borderColor:'divider'}}>
          {columns.map(c=><Box key={c} sx={{flex:1,minWidth:0}}>{c==='Status'?<Chip size="small" label={String(row[c]??'-')} color={String(row[c]).includes('connect')||String(row[c]).includes('Ativo')?'success':'default'}/>:<Typography variant="body2" noWrap>{String(row[c]??'-')}</Typography>}</Box>)}
          <Stack direction="row" sx={{width:title==='Instâncias'?220:90}}>{title==='Instâncias'&&<><Tooltip title="Conectar"><IconButton color="success" onClick={()=>void instanceAction(row.id,'connect')}><LinkRoundedIcon/></IconButton></Tooltip><Tooltip title="QR Code"><IconButton onClick={()=>void showQr(row)}><QrCode2RoundedIcon/></IconButton></Tooltip><Tooltip title="Desconectar"><IconButton onClick={()=>void instanceAction(row.id,'disconnect')}><LinkOffRoundedIcon/></IconButton></Tooltip><Tooltip title="Logout"><IconButton color="warning" onClick={()=>void instanceAction(row.id,'logout')}><LogoutRoundedIcon/></IconButton></Tooltip></>}<IconButton onClick={()=>edit(row)}><EditRoundedIcon/></IconButton><IconButton color="error" onClick={()=>void remove(row)}><DeleteOutlineRoundedIcon/></IconButton></Stack>
        </Stack>)}
      </Box></Box>
    </CardContent></Card>
  </Stack>
  <Dialog open={open} onClose={saving?undefined:close} fullWidth maxWidth="sm"><Stack component="form" onSubmit={submit}><DialogTitle>{editingId?`Editar ${title}`:actionLabel}</DialogTitle><DialogContent><Stack spacing={2.2} pt={1}>
    {visibleFields.map(field=>field.type==='boolean'?<Stack key={field.name} direction="row" justifyContent="space-between" alignItems="center"><Typography>{field.label}</Typography><Switch checked={Boolean(values[field.name])} onChange={e=>setValues(v=>({...v,[field.name]:e.target.checked}))}/></Stack>:(field.type==='select'||field.lookup)?<FormControl key={field.name} fullWidth required={field.required}><InputLabel>{field.label}</InputLabel><Select label={field.label} value={String(values[field.name]??'')} onChange={e=>setValues(v=>({...v,[field.name]:e.target.value}))}>{!field.required&&<MenuItem value=""><em>Nenhum</em></MenuItem>}{options(field).map(o=><MenuItem key={String(o.value)} value={o.value}>{o.label}</MenuItem>)}</Select></FormControl>:<TextField key={field.name} label={field.label} type={field.type??'text'} required={field.required&&!(editingId&&(field.name==='password'||field.name==='secret'))} value={String(values[field.name]??'')} onChange={e=>setValues(v=>({...v,[field.name]:e.target.value}))}/>) }
  </Stack></DialogContent><DialogActions sx={{p:3}}><Button onClick={close}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving}>{saving?'Salvando...':'Salvar'}</Button></DialogActions></Stack></Dialog>
  <QrCodeDialog open={qrOpen} qrCode={qrCode} instanceName={qrName} onClose={()=>setQrOpen(false)} onRefresh={()=>void load(true)}/>
  <Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={()=>setMessage('')} message={message}/>
  </AppShell></AuthGuard>;
}
