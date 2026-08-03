import axios from 'axios';
import { notifyError, notifySuccess } from '@/services/notifications';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3002',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('gtw_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      const config = response.config as any;
      const method = String(config.method || 'get').toLowerCase();
      const url = String(config.url || '');
      const isMutation = ['post', 'put', 'patch', 'delete'].includes(method);
      const shouldNotify = isMutation && !config.skipGlobalSuccess && !url.includes('/api/auth/login');

      if (shouldNotify) {
        const message =
          response.data?.message ||
          response.data?.warning ||
          (method === 'delete'
            ? 'Registro excluído com sucesso.'
            : method === 'post'
              ? 'Operação realizada com sucesso.'
              : 'Alterações salvas com sucesso.');

        notifySuccess(String(message));
      }
    }

    return response;
  },
  (error) => {
    if (typeof window !== 'undefined' && !(error?.config as any)?.skipGlobalError) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Não foi possível concluir a operação.';

      notifyError(String(message));
    }

    return Promise.reject(error);
  },
);
