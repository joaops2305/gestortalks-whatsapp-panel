import { api } from '@/services/api';
import type { InstanceStatusResponse, WhatsAppInstance } from './types';

export type CreateInstancePayload = {
  empresa_id: number;
  application_id: number;
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
