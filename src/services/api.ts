import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3002',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const sessionToken = localStorage.getItem('gtw_token');
    const fallbackToken = process.env.NEXT_PUBLIC_API_TOKEN;
    const token = sessionToken || fallbackToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
