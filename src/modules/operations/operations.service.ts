import { api } from '@/services/api';

export type Query = {
  page?: number;
  limit?: number;
  search?: string;
  instance_id?: number;
  status?: string;
  direction?: string;
};

export type OperationsSettings = {
  retention_days: number;
  queue_max_attempts: number;
  webhook_timeout_ms: number;
  auto_reconnect: boolean;
  store_message_body: boolean;
  store_raw_payload: boolean;
  log_level: 'debug' | 'info' | 'warn' | 'error';
};

export const DEFAULT_OPERATIONS_SETTINGS: OperationsSettings = {
  retention_days: 90,
  queue_max_attempts: 5,
  webhook_timeout_ms: 15000,
  auto_reconnect: true,
  store_message_body: true,
  store_raw_payload: true,
  log_level: 'info',
};

const params = (query: Query) =>
  Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null,
    ),
  );

const normalizeSettings = (value: unknown): OperationsSettings => ({
  ...DEFAULT_OPERATIONS_SETTINGS,
  ...(value && typeof value === 'object' ? value : {}),
});

export const operationsService = {
  async messages(query: Query = {}) {
    const { data } = await api.get('/api/operations/messages', {
      params: params(query),
    });
    return data;
  },

  async metrics() {
    const { data } = await api.get('/api/operations/metrics');
    return data?.data ?? {};
  },

  async logs(query: Query = {}) {
    const { data } = await api.get('/api/operations/logs', {
      params: params(query),
    });
    return data;
  },

  async settings(): Promise<OperationsSettings> {
    try {
      const { data } = await api.get('/api/operations/settings');
      return normalizeSettings(data?.data);
    } catch {
      return { ...DEFAULT_OPERATIONS_SETTINGS };
    }
  },

  async saveSettings(
    payload: Partial<OperationsSettings>,
  ): Promise<OperationsSettings> {
    const normalizedPayload = normalizeSettings(payload);
    const { data } = await api.put(
      '/api/operations/settings',
      normalizedPayload,
    );
    return normalizeSettings(data?.data);
  },
};
