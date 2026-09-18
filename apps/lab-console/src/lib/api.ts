import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - add token
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !error.config?.url?.includes('/auth/refresh')) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          localStorage.setItem('access_token', res.data.accessToken);
          localStorage.setItem('refresh_token', res.data.refreshToken);
          if (error.config) {
            error.config.headers = error.config.headers || {};
            error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return apiClient(error.config);
          }
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

// ============ API Services ============

export const authApi = {
  login: (email: string, password: string, mfaCode?: string) =>
    apiClient.post('/auth/login', { email, password, mfaCode }).then((r) => r.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
  setupMfa: () => apiClient.post('/auth/mfa/setup').then((r) => r.data),
  enableMfa: (code: string) => apiClient.post('/auth/mfa/enable', { code }).then((r) => r.data),
  disableMfa: (code: string) => apiClient.post('/auth/mfa/disable', { code }).then((r) => r.data),
};

export const samplesApi = {
  list: (params?: any) => apiClient.get('/samples', { params }).then((r) => r.data),
  get: (id: string) => apiClient.get(`/samples/${id}`).then((r) => r.data),
  myQueue: () => apiClient.get('/samples/my-queue').then((r) => r.data),
  dashboardStats: () => apiClient.get('/samples/dashboard-stats').then((r) => r.data),
  createBatch: (data: any) => apiClient.post('/samples/batches', data).then((r) => r.data),
  updateStatus: (id: string, status: string, justification?: string) =>
    apiClient.post(`/samples/${id}/status`, { status, justification }).then((r) => r.data),
  chainOfCustody: (id: string, data: any) =>
    apiClient.post(`/samples/${id}/chain-of-custody`, data).then((r) => r.data),
  assignTests: (id: string, methodIds: string[]) =>
    apiClient.post(`/samples/${id}/assign-tests`, { methodIds }).then((r) => r.data),
  assignStorage: (id: string, location: string) =>
    apiClient.post(`/samples/${id}/assign-storage`, { location }).then((r) => r.data),
};

export const testingApi = {
  methods: () => apiClient.get('/testing/methods').then((r) => r.data),
  pending: () => apiClient.get('/testing/pending').then((r) => r.data),
  get: (id: string) => apiClient.get(`/testing/${id}`).then((r) => r.data),
  start: (id: string, instrumentId: string) =>
    apiClient.post(`/testing/${id}/start`, { instrumentId }).then((r) => r.data),
  enterResults: (id: string, results: any[]) =>
    apiClient.post(`/testing/${id}/results`, { results }).then((r) => r.data),
  verify: (id: string, decision: string, comment: string) =>
    apiClient.post(`/testing/${id}/verify`, { decision, comment }).then((r) => r.data),
};

export const qualityApi = {
  pendingReviews: () => apiClient.get('/quality/pending-reviews').then((r) => r.data),
  reviewHistory: (sampleId: string) =>
    apiClient.get(`/quality/reviews/${sampleId}`).then((r) => r.data),
  submitReview: (sampleId: string, data: any) =>
    apiClient.post(`/quality/reviews/${sampleId}`, data).then((r) => r.data),
  createRejection: (sampleId: string, data: any) =>
    apiClient.post(`/quality/rejections/${sampleId}`, data).then((r) => r.data),
};

export const coaApi = {
  templates: () => apiClient.get('/coa/templates').then((r) => r.data),
  generate: (sampleId: string, templateId: string, notes?: string) =>
    apiClient.post(`/coa/generate/${sampleId}`, { templateId, notes }).then((r) => r.data),
  batchGenerate: (sampleIds: string[], templateId: string) =>
    apiClient.post('/coa/batch-generate', { sampleIds, templateId }).then((r) => r.data),
  list: (params?: any) => apiClient.get('/coa', { params }).then((r) => r.data),
  get: (id: string) => apiClient.get(`/coa/${id}`).then((r) => r.data),
};

export const inventoryApi = {
  items: (params?: any) => apiClient.get('/inventory/items', { params }).then((r) => r.data),
  createItem: (data: any) => apiClient.post('/inventory/items', data).then((r) => r.data),
  updateItem: (id: string, data: any) =>
    apiClient.patch(`/inventory/items/${id}`, data).then((r) => r.data),
  recordMovement: (data: any) => apiClient.post('/inventory/movements', data).then((r) => r.data),
  movements: (itemId?: string) =>
    apiClient.get('/inventory/movements', { params: { itemId } }).then((r) => r.data),
  locations: () => apiClient.get('/inventory/locations').then((r) => r.data),
  locationTree: () => apiClient.get('/inventory/locations/tree').then((r) => r.data),
  lowStockAlerts: () => apiClient.get('/inventory/alerts/low-stock').then((r) => r.data),
};

export const instrumentsApi = {
  list: (params?: any) => apiClient.get('/instruments', { params }).then((r) => r.data),
  get: (id: string) => apiClient.get(`/instruments/${id}`).then((r) => r.data),
  dashboard: () => apiClient.get('/instruments/dashboard').then((r) => r.data),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/instruments/${id}/status`, { status }).then((r) => r.data),
  recordCalibration: (id: string, data: any) =>
    apiClient.post(`/instruments/${id}/calibration`, data).then((r) => r.data),
};

export const auditApi = {
  list: (params?: any) => apiClient.get('/audit', { params }).then((r) => r.data),
  verifyChain: () => apiClient.get('/audit/verify-chain').then((r) => r.data),
};

export const reportsApi = {
  dashboard: (params?: any) => apiClient.get('/reports/dashboard', { params }).then((r) => r.data),
  trends: (params: any) => apiClient.get('/reports/trends', { params }).then((r) => r.data),
  coaStats: (params?: any) => apiClient.get('/reports/coa-stats', { params }).then((r) => r.data),
  exportSamples: (params?: any) =>
    apiClient.get('/reports/samples/export', { params, responseType: 'blob' }).then((r) => r.data),
};

export const workflowApi = {
  states: (workflow = 'sample') =>
    apiClient.get('/workflow/states', { params: { workflow } }).then((r) => r.data),
  transitions: (currentState: string) =>
    apiClient.get(`/workflow/transitions/${currentState}`).then((r) => r.data),
  history: (recordId: string, type = 'sample') =>
    apiClient.get(`/workflow/history/${recordId}`, { params: { type } }).then((r) => r.data),
};

export const notificationsApi = {
  list: (limit?: number) =>
    apiClient.get('/notifications', { params: { limit } }).then((r) => r.data),
  markRead: (id: string) => apiClient.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.post('/notifications/read-all').then((r) => r.data),
};

export const messagesApi = {
  inbox: (params?: any) => apiClient.get('/messages/inbox', { params }).then((r) => r.data),
  sent: (params?: any) => apiClient.get('/messages/sent', { params }).then((r) => r.data),
  get: (id: string) => apiClient.get(`/messages/${id}`).then((r) => r.data),
  send: (data: any) => apiClient.post('/messages', data).then((r) => r.data),
  markRead: (id: string) => apiClient.post(`/messages/${id}/read`).then((r) => r.data),
  reply: (id: string, data: any) => apiClient.post(`/messages/${id}/reply`, data).then((r) => r.data),
};

export const bulkApi = {
  template: () =>
    apiClient.get('/bulk-submission/template', { responseType: 'blob' }).then((r) => r.data),
  parse: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post('/bulk-submission/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  validate: (data: any) => apiClient.post('/bulk-submission/validate', data).then((r) => r.data),
  submit: (rows: any[]) => apiClient.post('/bulk-submission/submit', { rows }).then((r) => r.data),
};