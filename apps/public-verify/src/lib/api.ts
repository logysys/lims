import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});

export const verifyApi = {
  search: (q: string, scope?: string) =>
    client.get('/verify/search', { params: { q, scope } }).then((r) => r.data),
  getById: (id: string) => client.get(`/verify/record/${id}`).then((r) => r.data),
  getByCoaId: (coaId: string) => client.get(`/verify/coa/${coaId}`).then((r) => r.data),
  getByLot: (lot: string) => client.get(`/verify/lot/${lot}`).then((r) => r.data),
  getByBadge: (code: string) => client.get(`/badges/code/${code}`).then((r) => r.data),
  recordScan: (id: string) => client.post(`/verify/${id}/scan`).then((r) => r.data),
  recordDownload: (id: string) => client.post(`/verify/${id}/download`).then((r) => r.data),
};