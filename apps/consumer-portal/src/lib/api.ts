import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});

export const consumerApi = {
  browse: (params?: any) => client.get('/consumer/browse', { params }).then((r) => r.data),
  productDetail: (name: string) =>
    client.get(`/consumer/product/${encodeURIComponent(name)}`).then((r) => r.data),
  badgeDetail: (code: string) => client.get(`/consumer/badge/${code}`).then((r) => r.data),
  featured: () => client.get('/consumer/featured').then((r) => r.data),
  verifyBadge: (code: string) => client.get(`/badges/code/${code}`).then((r) => r.data),
};