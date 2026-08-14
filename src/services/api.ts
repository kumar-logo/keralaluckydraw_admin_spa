import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { getApiBaseUrl } from '../config/env';

interface ApiEnvelope {
  code: number;
  msg?: string;
  data: unknown;
}

const SUCCESS_CODE = 0;
const UNAUTHORIZED_CODE = 701;
const DEFAULT_ERROR_MESSAGE = 'Request failed';

const api = axios.create({
  baseURL: `${getApiBaseUrl()}/admin/api/v1`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Token = token;
  return config;
});

const unwrapEnvelope = (res: AxiosResponse<ApiEnvelope>): unknown => {
  const envelope = res.data;
  if (envelope.code === SUCCESS_CODE) return envelope.data;
  if (envelope.code === UNAUTHORIZED_CODE) {
    localStorage.removeItem('admin_token');
    const loginPath = `${import.meta.env.BASE_URL}login`;
    if (window.location.pathname !== loginPath) {
      window.location.href = loginPath;
    }
  }
  return Promise.reject(new Error(envelope.msg ? envelope.msg : DEFAULT_ERROR_MESSAGE));
};

api.interceptors.response.use(
  unwrapEnvelope as (res: AxiosResponse) => AxiosResponse,
  (err) => Promise.reject(err),
);

export default api;
