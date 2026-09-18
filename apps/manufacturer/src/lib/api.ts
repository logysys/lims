import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});

client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const manufacturerApi = {
  stats: () => client.get('/reports/dashboard').then((r) => r.data),
  trends: (params: any) => client.get('/reports/trends', { params }).then((r) => r.data),
};

export const bulkApi = {
  template: () =>
    client.get('/bulk-submission/template', { responseType: 'blob' }).then((r) => r.data),
  parse: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client
      .post('/bulk-submission/parse', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  validate: (data: any) => client.post('/bulk-submission/validate', data).then((r) => r.data),
  submit: (rows: any[]) => client.post('/bulk-submission/submit', { rows }).then((r) => r.data),
};

export const badgesApi = {
  list: () => client.get('/badges').then((r) => r.data),
  generate: (data: any) => client.post('/badges', data).then((r) => r.data),
  revoke: (id: string) => client.post(`/badges/${id}/revoke`).then((r) => r.data),
};

export const apiKeysApi = {
  list: () => client.get('/api-keys').then((r) => r.data),
  create: (data: any) => client.post('/api-keys', data).then((r) => r.data),
  revoke: (id: string) => client.post(`/api-keys/${id}/revoke`).then((r) => r.data),
};