import { api } from '@/services/api';
import type { InstanceApplication, InstanceStatusResponse, WhatsAppInstance } from './types';

export type CreateInstancePayload = {
  empresa_id: number;
  application_ids?: number[];
  external_instance_id?: number | null;
  session: string;
  name?: string | null;
};

export const instanceService = {
  async list(): Promise<WhatsAppInstance[]> {
    const response = await api.get('/api/instances');
    return response.data?.data ?? [];
  },

  async create(payload: CreateInstancePayload): Promise<WhatsAppInstance> {
    const response = await api.post('/api/instances', payload);
    return response.data?.data;
  },

  async get(id: number): Promise<WhatsAppInstance> {
    const response = await api.get(`/api/instances/${id}`);
    return response.data?.data;
  },

  async listApplications(id: number): Promise<InstanceApplication[]> {
    const response = await api.get(`/api/instances/${id}/applications`);
    return response.data?.data ?? [];
  },

  async linkApplication(id: number, applicationId: number) {
    const response = await api.post(`/api/instances/${id}/applications`, {
      application_id: applicationId,
    });
    return response.data?.data;
  },

  async unlinkApplication(id: number, applicationId: number) {
    await api.delete(`/api/instances/${id}/applications/${applicationId}`);
  },

  async status(id: number): Promise<InstanceStatusResponse> {
    const response = await api.get(`/api/instances/${id}/status`, {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    return response.data?.data;
  },

  async qrcode(id: number): Promise<InstanceStatusResponse> {
    const response = await api.get(`/api/instances/${id}/qrcode`, {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    return response.data?.data;
  },

  async connect(id: number) {
    const response = await api.post(`/api/instances/${id}/connect`);
    return response.data?.data;
  },

  async disconnect(id: number) {
    await api.post(`/api/instances/${id}/disconnect`);
  },

  async logout(id: number) {
    await api.post(`/api/instances/${id}/logout`);
  },

  async remove(id: number) {
    await api.delete(`/api/instances/${id}`);
  },
};
