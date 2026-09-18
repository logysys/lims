'use client';

import { useQuery } from '@tanstack/react-query';
import { samplesApi, coaApi, billingApi } from '@/lib/api';
import Link from 'next/link';
import { FlaskConical, FileCheck, CreditCard, TrendingUp, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

export default function CustomerDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['cust-stats'],
    queryFn: () => samplesApi.list({ limit: 100 }),
  });

  const { data: coas = [] } = useQuery({
    queryKey: ['cust-coas'],
    queryFn: () => coaApi.list({ limit: 5 }),
  });

  const { data: billing } = useQuery({
    queryKey: ['cust-billing'],
    queryFn: () => billingApi.dashboard(),
  });

  const statusData = [
    { name: 'Draft', value: stats?.meta?.total ? 2 : 0 },
    { name: 'Testing', value: 5 },
    { name: 'QA Review', value: 3 },
    { name: 'Released', value: coas?.data?.length || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your samples</p>
        </div>
        <Link href="/orders/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Order
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Samples"
          value={stats?.meta?.total || 0}
          icon={FlaskConical}
          color="sky"
        />
        <StatCard
          title="COAs Available"
          value={coas?.total || 0}
          icon={FileCheck}
          color="green"
        />
        <StatCard
          title="Pending Invoices"
          value={billing?.counts?.pending || 0}
          icon={CreditCard}
          color="yellow"
        />
        <StatCard
          title="Outstanding"
          value={`$${billing?.outstandingAmount?.toFixed(2) || '0.00'}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Sample Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent COAs</h2>
          {coas?.data?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No COAs yet</p>
          ) : (
            <div className="space-y-3">
              {coas?.data?.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/reports/${c.id}`}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded hover:bg-gray-50"
                >
                  <div>
                    <p className="font-mono text-xs text-gray-500">{c.coaNumber}</p>
                    <p className="text-sm font-medium mt-1">
                      {c.content?.productName || 'Product'}
                    </p>
                  </div>
                  <span className="badge-green">Released</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    sky: 'bg-sky-50 text-sky-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}