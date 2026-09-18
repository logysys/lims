'use client';

import { useQuery } from '@tanstack/react-query';
import { manufacturerApi } from '@/lib/api';
import { FlaskConical, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function ManufacturerDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['mfg-stats'],
    queryFn: manufacturerApi.stats,
  });

  const { data: trends } = useQuery({
    queryKey: ['mfg-trends'],
    queryFn: () => manufacturerApi.trends({ days: 30 }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manufacturer Dashboard</h1>
        <p className="text-gray-600 mt-1">Production overview and quality metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Lots" value={stats?.totalLots || 0} icon={FlaskConical} />
        <StatCard title="Verified" value={stats?.verifiedLots || 0} icon={Award} color="green" />
        <StatCard
          title="Avg TAT (days)"
          value={stats?.avgTAT?.toFixed(1) || '0'}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Failed Lots"
          value={stats?.failedLots || 0}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Purity Trend (30 days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trends?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quality Metrics</h2>
          <div className="space-y-4">
            <ProgressBar label="Pass Rate" value={stats?.passRate || 0} />
            <ProgressBar label="On-Time Delivery" value={stats?.onTimeRate || 0} />
            <ProgressBar label="Verification Success" value={stats?.verificationRate || 0} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = 'sky' }: any) {
  const colors: any = {
    sky: 'text-sky-600 bg-sky-50',
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="bg-sky-600 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}