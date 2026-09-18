import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email: string, password: string, mfaCode?: string) =>
    client.post('/auth/login', { email, password, mfaCode }).then((r) => r.data),
  logout: () => client.post('/auth/logout').then((r) => r.data),
  register: (data: any) => client.post('/auth/register', data).then((r) => r.data),
};

export const samplesApi = {
  list: (params?: any) => client.get('/samples', { params }).then((r) => r.data),
  get: (id: string) => client.get(`/samples/${id}`).then((r) => r.data),
  createBatch: (data: any) => client.post('/samples/batches', data).then((r) => r.data),
};

export const coaApi = {
  list: (params?: any) => client.get('/coa', { params }).then((r) => r.data),
  get: (id: string) => client.get(`/coa/${id}`).then((r) => r.data),
};

export const productsApi = {
  list: (params?: any) => client.get('/products', { params }).then((r) => r.data),
};

export const testingApi = {
  methods: () => client.get('/testing/methods').then((r) => r.data),
};

export const billingApi = {
  invoices: (params?: any) => client.get('/billing/invoices', { params }).then((r) => r.data),
  dashboard: () => client.get('/billing/dashboard').then((r) => r.data),
};

export const messagesApi = {
  inbox: (params?: any) => client.get('/messages/inbox', { params }).then((r) => r.data),
  send: (data: any) => client.post('/messages', data).then((r) => r.data),
};

export const templatesApi = {
  list: () => client.get('/templates').then((r) => r.data),
  create: (data: any) => client.post('/templates', data).then((r) => r.data),
  delete: (id: string) => client.delete(`/templates/${id}`).then((r) => r.data),
};