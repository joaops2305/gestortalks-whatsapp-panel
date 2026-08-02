'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, IconButton, InputAdornment, InputLabel,
  MenuItem, Select, Snackbar, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AuthGuard } from '@/components/AuthGuard';
import { QrCodeDialog } from '@/components/ui';
import { api } from '@/services/api';

type AdminPageProps = { title: string; description: string; actionLabel?: string; columns: string[]; emptyMessage?: string };
type Option = { label: string; value: string | number };
type FieldConfig = { name: string; label: string; type?: 'text'|'email'|'password'|'number'|'url'|'select'|'boolean'; options?: Option[]; lookup?: 'companies'|'applications'; required?: boolean };
type ResourceConfig = { endpoint: string; fields: FieldConfig[]; toRow: (item:any)=>Record<string,any>; toPayload:(values:Record<string,any>)=>Record<string,any> };

const boolStatus = (value: unknown) => Number(value) === 1 || value === true;
const statusLabel = (value: unknown) => boolStatus(value) ? 'Ativo' : 'Inativo';
const companyField = (name='company_id', required=true): FieldConfig => ({ name, label:'Empresa', type:'select', lookup:'companies', required });
const applicationField = (required=false): FieldConfig => ({ name:'application_id', label:'Aplicação', type:'select', lookup:'applications', required });

const RESOURCES: Record<string, ResourceConfig> = {
  Empresas: {
    endpoint:'/api/admin/companies',
    fields:[
      {name:'name',label:'Nome da empresa',required:true},{name:'document',label:'CPF/CNPJ'},
      {name:'email',label:'E-mail',type:'email'},{name:'phone',label:'Telefone'},
      {name:'plan',label:'Plano',type:'select',options:['Free','Starter','Pro','Enterprise'].map(value=>({label:value,value})),required:true},
      {name:'instance_limit',label:'Limite de instâncias',type:'number',required:true},{name:'status',label:'Ativa',type:'boolean'},
    ],
    toRow:item=>({id:item.id,Nome:item.name,Documento:item.document||'-',Plano:item.plan,'Instâncias':item.instances??0,Status:statusLabel(item.status)}),
    toPayload:values=>({...values,instance_limit:Number(values.instance_limit||1)}),
  },
  Usuários: {
    endpoint:'/api/admin/users',
    fields:[{name:'name',label:'Nome completo',required:true},{name:'email',label:'E-mail',type:'email',required:true},{name:'password',label:'Senha inicial',type:'password'},companyField('company_id',false),{name:'role',label:'Perfil',type:'select',options:['superadmin','admin_empresa','desenvolvedor','operador','visualizador'].map(value=>({label:value,value})),required:true},{name:'status',label:'Ativo',type:'boolean'}],
    toRow:item=>({id:item.id,Nome:item.name,Email:item.email,Empresa:item.company_name||'Global',Perfil:item.role,Status:statusLabel(item.status)}),
    toPayload:values=>({...values,company_id:values.company_id?Number(values.company_id):null,password:values.password||undefined}),
  },
  Instâncias: {
    endpoint:'/api/instances',
    fields:[{name:'name',label:'Nome da instância',required:true},companyField('empresa_id',true),{name:'external_instance_id',label:'ID externo',type:'number'},{name:'session',label:'Identificador da sessão',required:true}],
    toRow:item=>({id:item.id,Nome:item.name||item.session,Empresa:item.company_name||item.empresa_id,Número:item.phone_number||'-',Provider:item.provider||'baileys',Status:item.status||'disconnected'}),
    toPayload:values=>({name:values.name,empresa_id:Number(values.empresa_id),external_instance_id:values.external_instance_id?Number(values.external_instance_id):null,session:values.session}),
  },
  Aplicações: {
    endpoint:'/api/admin/applications',
    fields:[{name:'name',label:'Nome da aplicação',required:true},companyField(),{name:'description',label:'Descrição'},{name:'webhook_url',label:'URL do webhook',type:'url'},{name:'rate_limit',label:'Limite por minuto',type:'number'},{name:'status',label:'Ativa',type:'boolean'}],
    toRow:item=>({id:item.id,Nome:item.name,Empresa:item.company_name||item.company_id,Descrição:item.description||'-','Rate limit':item.rate_limit,Status:statusLabel(item.status)}),
    toPayload:values=>({...values,company_id:Number(values.company_id),rate_limit:Number(values.rate_limit||300),webhook_url:values.webhook_url||null}),
  },
  'API Keys': {
    endpoint:'/api/admin/api-keys',
    fields:[{name:'name',label:'Nome da chave',required:true},companyField(),applicationField(false),{name:'environment',label:'Ambiente',type:'select',options:[{label:'Teste',value:'test'},{label:'Produção',value:'live'}],required:true},{name:'expires_in_days',label:'Validade em dias',type:'number'},{name:'status',label:'Ativa',type:'boolean'}],
    toRow:item=>({id:item.id,Nome:item.name,Empresa:item.company_name||item.company_id,Aplicação:item.application_name||'-',Ambiente:item.environment,Status:statusLabel(item.status)}),
    toPayload:values=>({...values,company_id:Number(values.company_id),application_id:values.application_id?Number(values.application_id):null,expires_in_days:values.expires_in_days?Number(values.expires_in_days):null}),
  },
  Webhooks: {
    endpoint:'/api/admin/webhooks',
    fields:[{name:'name',label:'Nome do webhook',required:true},companyField(),applicationField(false),{name:'url',label:'URL de destino',type:'url',required:true},{name:'events',label:'Eventos separados por vírgula'},{name:'secret',label:'Segredo de assinatura',type:'password'},{name:'status',label:'Ativo',type:'boolean'}],
    toRow:item=>({id:item.id,Nome:item.name,Empresa:item.company_name||item.company_id,URL:item.url,Eventos:Array.isArray(item.events)?item.events.join(', '):'-',Status:statusLabel(item.status)}),
    toPayload:values=>({...values,company_id:Number(values.company_id),application_id:values.application_id?Number(values.application_id):null,events:String(values.events||'onmessage,onconnection').split(',').map(value=>value.trim()).filter(Boolean),secret:values.secret||null}),
  },
};

function initialValues(fields: FieldConfig[]) { return Object.fromEntries(fields.map(field=>[field.name,field.type==='boolean'?true:''])); }

export function AdminPage({title,description,actionLabel='Novo',columns,emptyMessage='Nenhum registro encontrado.'}:AdminPageProps){
  const config=RESOURCES[title];
  const fields=useMemo(()=>config?.fields??[],[config]);
  const [items,setItems]=useState<Array<Record<string,any>>>([]);
  const [companies,setCompanies]=useState<Option[]>([]);
  const [applications,setApplications]=useState<Array<Option & {company_id?:number}>>([]);
  const [open,setOpen]=useState(false); const [editingId,setEditingId]=useState<number|null>(null);
  const [values,setValues]=useState<Record<string,any>>(()=>initialValues(fields));
  const [search,setSearch]=useState(''); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState(''); const [error,setError]=useState(''); const [generatedKey,setGeneratedKey]=useState('');
  const [qrOpen,setQrOpen]=useState(false); const [qrCode,setQrCode]=useState<string|null>(null); const [qrStatus,setQrStatus]=useState('');

  const loadLookups=useCallback(async()=>{
    try{
      const [companiesResponse,applicationsResponse]=await Promise.all([api.get('/api/admin/companies'),api.get('/api/admin/applications')]);
      setCompanies((companiesResponse.data?.data??[]).map((item:any)=>({label:item.name,value:item.id})));
      setApplications((applicationsResponse.data?.data??[]).map((item:any)=>({label:item.name,value:item.id,company_id:Number(item.company_id)})));
    }catch{ /* páginas continuam funcionando sem lookup */ }
  },[]);

  const load=useCallback(async(silent=false)=>{
    if(!config)return;
    if(!silent){setLoading(true);setError('');}
    try{
      const response=await api.get(config.endpoint);
      const source=response.data?.data??[];
      setItems(source.map((item:any)=>({...config.toRow(item),__raw:item})));
    }catch(requestError:any){
      if(!silent)setError(requestError?.response?.data?.error||'Não foi possível carregar os registros.');
    }finally{
      if(!silent)setLoading(false);
    }
  },[config]);

  useEffect(()=>{
    void load();
    void loadLookups();
  },[load,loadLookups]);

  useEffect(()=>{
    if(title!=='Instâncias')return;

    const timer=window.setInterval(()=>{
      if(document.hidden||open||saving||qrOpen)return;
      void load(true);
    },5000);

    return()=>window.clearInterval(timer);
  },[title,load,open,saving,qrOpen]);

  const filteredItems=items.filter(item=>Object.values(item).some(value=>typeof value!=='object'&&String(value).toLowerCase().includes(search.toLowerCase())));
  function closeDialog(){setOpen(false);setEditingId(null);setValues(initialValues(fields));}
  function startEdit(row:Record<string,any>){const raw=row.__raw??{};const next=initialValues(fields);for(const field of fields){if(field.name==='password'||field.name==='secret')continue;const rawValue=raw[field.name];if(field.type==='boolean')next[field.name]=boolStatus(rawValue);else if(field.name==='events'&&Array.isArray(rawValue))next[field.name]=rawValue.join(',');else next[field.name]=rawValue??'';}setValues(next);setEditingId(Number(row.id));setOpen(true);}

  async function submit(event:FormEvent){event.preventDefault();if(!config)return;setSaving(true);setError('');setGeneratedKey('');try{const payload=config.toPayload(values);const response=editingId?await api.put(`${config.endpoint}/${editingId}`,payload):await api.post(config.endpoint,payload);if(response.data?.api_key)setGeneratedKey(response.data.api_key);setMessage(editingId?'Registro atualizado com sucesso.':'Registro cadastrado com sucesso.');closeDialog();await Promise.all([load(),loadLookups()]);}catch(requestError:any){setError(requestError?.response?.data?.error||'Não foi possível salvar o registro.');}finally{setSaving(false);}}
  async function remove(row:Record<string,any>){if(!config||!window.confirm(`Excluir ${row.Nome||row.id}?`))return;try{await api.delete(`${config.endpoint}/${row.id}`);setMessage('Registro excluído com sucesso.');await load();}catch(requestError:any){setError(requestError?.response?.data?.error||'Não foi possível excluir o registro.');}}
  async function instanceAction(id:number,action:'connect'|'disconnect'|'logout'){try{await api.post(`/api/instances/${id}/${action}`);setMessage(action==='connect'?'Conexão iniciada.':action==='logout'?'Logout realizado.':'Instância desconectada.');await load(true);}catch(requestError:any){setError(requestError?.response?.data?.error||'Não foi possível executar a ação.');}}
  async function showQr(id:number){try{const response=await api.get(`/api/instances/${id}/qrcode`);setQrCode(response.data?.data?.qrCode??null);setQrStatus(response.data?.data?.status??'');setQrOpen(true);}catch(requestError:any){setError(requestError?.response?.data?.error||'Não foi possível consultar o QR Code.');}}

  const getOptions=(field:FieldConfig):Option[]=>{if(field.lookup==='companies')return companies;if(field.lookup==='applications'){const companyId=Number(values.company_id||values.empresa_id||0);return companyId?applications.filter(item=>item.company_id===companyId):applications;}return field.options??[];};

  return <AuthGuard><AppShell><Stack spacing={3}>
    <Stack direction={{xs:'column',sm:'row'}} justifyContent="space-between" spacing={2} alignItems={{sm:'center'}}><Box><Typography variant="h4" fontWeight={800}>{title}</Typography><Typography color="text.secondary">{description}</Typography></Box>{config&&<Button variant="contained" startIcon={<AddRoundedIcon/>} onClick={()=>{setValues(initialValues(fields));setEditingId(null);setOpen(true);}}>{actionLabel}</Button>}</Stack>
    {error&&<Alert severity="error" onClose={()=>setError('')}>{error}</Alert>}{generatedKey&&<Alert severity="warning"><strong>Copie a API Key agora:</strong><Box component="code" sx={{display:'block',mt:1,wordBreak:'break-all'}}>{generatedKey}</Box></Alert>}
    <Card elevation={0} sx={{border:'1px solid',borderColor:'divider'}}><CardContent><Stack direction={{xs:'column',sm:'row'}} spacing={2} mb={3}><TextField fullWidth size="small" value={search} onChange={event=>setSearch(event.target.value)} placeholder={`Buscar em ${title.toLowerCase()}...`} InputProps={{startAdornment:<InputAdornment position="start"><SearchRoundedIcon fontSize="small"/></InputAdornment>}}/><Button variant="outlined" startIcon={loading?<CircularProgress size={16}/>:<RefreshRoundedIcon/>} onClick={()=>void load()} disabled={loading}>Atualizar</Button></Stack>
      <Box sx={{overflowX:'auto'}}><Box sx={{minWidth:title==='Instâncias'?1040:820}}><Stack direction="row" spacing={2} sx={{px:2,py:1.5,bgcolor:'action.hover',borderRadius:2}}>{columns.map(column=><Typography key={column} variant="caption" fontWeight={800} sx={{flex:1}}>{column}</Typography>)}<Typography variant="caption" fontWeight={800} sx={{width:title==='Instâncias'?220:90}}>Ações</Typography></Stack>
      {loading?<Stack alignItems="center" py={5}><CircularProgress/></Stack>:filteredItems.length===0?<Alert severity="info" sx={{mt:2}}>{emptyMessage}</Alert>:filteredItems.map(row=><Stack key={row.id} direction="row" spacing={2} alignItems="center" sx={{px:2,py:1.5,borderBottom:'1px solid',borderColor:'divider'}}>{columns.map(column=>{const value=row[column]??'-';return <Box key={column} sx={{flex:1,minWidth:0}}>{column==='Status'?<Chip label={String(value)} size="small" color={String(value).toLowerCase().includes('ativo')||String(value).toLowerCase().includes('connect')?'success':'default'}/>:<Typography variant="body2" noWrap title={String(value)}>{String(value)}</Typography>}</Box>;})}<Stack direction="row" sx={{width:title==='Instâncias'?220:90}}>{title==='Instâncias'&&<><Tooltip title="Conectar"><IconButton size="small" color="success" onClick={()=>void instanceAction(Number(row.id),'connect')}><LinkRoundedIcon fontSize="small"/></IconButton></Tooltip><Tooltip title="QR Code"><IconButton size="small" onClick={()=>void showQr(Number(row.id))}><QrCode2RoundedIcon fontSize="small"/></IconButton></Tooltip><Tooltip title="Desconectar"><IconButton size="small" onClick={()=>void instanceAction(Number(row.id),'disconnect')}><LinkOffRoundedIcon fontSize="small"/></IconButton></Tooltip><Tooltip title="Logout"><IconButton size="small" color="warning" onClick={()=>void instanceAction(Number(row.id),'logout')}><LogoutRoundedIcon fontSize="small"/></IconButton></Tooltip></>}<Tooltip title="Editar"><IconButton size="small" onClick={()=>startEdit(row)}><EditRoundedIcon fontSize="small"/></IconButton></Tooltip><Tooltip title="Excluir"><IconButton size="small" color="error" onClick={()=>void remove(row)}><DeleteOutlineRoundedIcon fontSize="small"/></IconButton></Tooltip></Stack></Stack>)}</Box></Box>
    </CardContent></Card>
  </Stack>
  <Dialog open={open} onClose={saving?undefined:closeDialog} fullWidth maxWidth="sm"><Stack component="form" onSubmit={submit}><DialogTitle>{editingId?`Editar ${title}`:actionLabel}</DialogTitle><DialogContent><Stack spacing={2.2} pt={1}>{fields.map(field=>field.type==='boolean'?<Stack key={field.name} direction="row" justifyContent="space-between" alignItems="center"><Typography>{field.label}</Typography><Switch checked={Boolean(values[field.name])} onChange={event=>setValues(current=>({...current,[field.name]:event.target.checked}))}/></Stack>:(field.type==='select'||field.lookup)?<FormControl key={field.name} fullWidth required={field.required}><InputLabel>{field.label}</InputLabel><Select label={field.label} value={String(values[field.name]??'')} onChange={event=>setValues(current=>({...current,[field.name]:event.target.value}))}>{!field.required&&<MenuItem value=""><em>Nenhum</em></MenuItem>}{getOptions(field).map(option=><MenuItem key={String(option.value)} value={option.value}>{option.label}</MenuItem>)}</Select></FormControl>:<TextField key={field.name} label={field.label} type={field.type??'text'} required={field.required&&!(editingId&&(field.name==='password'||field.name==='secret'))} fullWidth value={String(values[field.name]??'')} onChange={event=>setValues(current=>({...current,[field.name]:event.target.value}))}/>)}</Stack></DialogContent><DialogActions sx={{px:3,pb:3}}><Button onClick={closeDialog} disabled={saving}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving}>{saving?'Salvando...':'Salvar'}</Button></DialogActions></Stack></Dialog>
  <QrCodeDialog open={qrOpen} onClose={()=>setQrOpen(false)} qrCode={qrCode} instanceName={qrStatus||'instância'}/>
  <Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={()=>setMessage('')} message={message}/>
  </AppShell></AuthGuard>;
}
