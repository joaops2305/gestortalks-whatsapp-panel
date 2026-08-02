import { api } from '@/services/api';

export const resourceService = {
  async list<T>(endpoint: string): Promise<T[]> {
    const response = await api.get(endpoint);
    return response.data?.data ?? [];
  },

  async create<T>(endpoint: string, payload: Record<string, unknown>): Promise<{ data: T; apiKey?: string }> {
    const response = await api.post(endpoint, payload);
    return { data: response.data?.data, apiKey: response.data?.api_key };
  },

  async update<T>(endpoint: string, id: number, payload: Record<string, unknown>): Promise<T> {
    const response = await api.put(`${endpoint}/${id}`, payload);
    return response.data?.data;
  },

  async remove(endpoint: string, id: number): Promise<void> {
    await api.delete(`${endpoint}/${id}`);
  },
};
