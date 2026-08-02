import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3002',
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN ?? 'change-me'}`,
  },
});
