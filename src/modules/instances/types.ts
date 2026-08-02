export type InstanceStatus =
  | 'starting'
  | 'qr'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'logged_out'
  | 'error';

export type WhatsAppInstance = {
  id: number;
  empresa_id: number;
  company_name?: string | null;
  external_instance_id?: number | null;
  session: string;
  name?: string | null;
  provider?: string | null;
  status: InstanceStatus | string;
  runtime_status?: InstanceStatus | string | null;
  phone_number?: string | null;
  owner_jid?: string | null;
  qr_available?: boolean;
  ativo?: number | boolean;
  created_at?: string;
  updated_at?: string;
};

export type InstanceStatusResponse = {
  status: InstanceStatus | string;
  qrCode?: string | null;
  phone_number?: string | null;
  owner_jid?: string | null;
};
