import { api } from '@/services/api';

export type Query = { page?: number; limit?: number; search?: string; instance_id?: number; status?: string; direction?: string };
const params = (query: Query) => Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value !== undefined && value !== null));

export const operationsService = {
  async messages(query: Query = {}) { const { data } = await api.get('/api/operations/messages', { params: params(query) }); return data; },
  async metrics() { const { data } = await api.get('/api/operations/metrics'); return data.data; },
  async logs(query: Query = {}) { const { data } = await api.get('/api/operations/logs', { params: params(query) }); return data; },
  async settings() { const { data } = await api.get('/api/operations/settings'); return data.data; },
  async saveSettings(payload: Record<string, unknown>) { const { data } = await api.put('/api/operations/settings', payload); return data.data; },
};
