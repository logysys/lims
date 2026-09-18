'use client';

import { useQuery } from '@tanstack/react-query';
import { samplesApi, instrumentsApi, inventoryApi } from '@/lib/api';
import {
  FlaskConical,
  TestTube,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Microscope,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: samplesApi.dashboardStats,
    refetchInterval: 30000,
  });

  const { data: queue = [] } = useQuery({
    queryKey: ['my-queue'],
    queryFn: samplesApi.myQueue,
    refetchInterval: 30000,
  });

  const { data: instrumentDash } = useQuery({
    queryKey: ['instrument-dashboard'],
    queryFn: instrumentsApi.dashboard,
    refetchInterval: 60000,
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ['low-stock'],
    queryFn: inventoryApi.lowStockAlerts,
  });

  const chartData = [
    { name: 'Pending', value: stats?.pending || 0, fill: '#3b82f6' },
    { name: 'Testing', value: stats?.inTesting || 0, fill: '#f59e0b' },
    { name: 'Approved', value: stats?.completed || 0, fill: '#10b981' },
    { name: 'Released', value: stats?.released || 0, fill: '#059669' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of laboratory operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Samples"
          value={stats?.total || 0}
          icon={FlaskConical}
          color="sky"
        />
        <KpiCard
          title="In Testing"
          value={stats?.inTesting || 0}
          icon={TestTube}
          color="yellow"
        />
        <KpiCard
          title="Completed"
          value={stats?.completed || 0}
          icon={CheckCircle2}
          color="green"
        />
        <KpiCard
          title="Today"
          value={stats?.todayCount || 0}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Sample Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Alerts & Notifications</h2>
          <div className="space-y-3">
            {lowStock.length > 0 && (
              <AlertRow
                icon={Package}
                color="yellow"
                title={`${lowStock.length} item(s) low on stock`}
                href="/inventory"
              />
            )}
            {instrumentDash?.calibrationDue?.length > 0 && (
              <AlertRow
                icon={Microscope}
                color="orange"
                title={`${instrumentDash.calibrationDue.length} instrument(s) calibration due`}
                href="/instruments"
              />
            )}
            {stats?.inTesting > 0 && (
              <AlertRow
                icon={TestTube}
                color="blue"
                title={`${stats.inTesting} sample(s) currently in testing`}
                href="/testing"
              />
            )}
            {lowStock.length === 0 && instrumentDash?.calibrationDue?.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No active alerts</p>
            )}
          </div>
        </div>
      </div>

      {/* My Queue */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Queue ({queue.length})</h2>
          <Link href="/queue" className="text-sm text-sky-600 hover:underline">
            View all
          </Link>
        </div>

        {queue.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No samples in your queue. Great job! 🎉
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Sample Code</th>
                  <th>Product</th>
                  <th>Lot</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {queue.slice(0, 10).map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.sampleCode}</td>
                    <td>{s.product?.name}</td>
                    <td className="font-mono text-xs">{s.lotNumber}</td>
                    <td>
                      <PriorityBadge priority={s.batch?.priority} />
                    </td>
                    <td className="text-sm">
                      {s.batch?.dueDate
                        ? new Date(s.batch.dueDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>
                      <Link
                        href={`/samples/${s.id}`}
                        className="text-sky-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: 'sky' | 'yellow' | 'green' | 'purple';
}) {
  const colorClasses = {
    sky: 'bg-sky-50 text-sky-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function AlertRow({ icon: Icon, color, title, href }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 border border-gray-100"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${color}-50 text-${color}-600`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm text-gray-700 flex-1">{title}</span>
    </Link>
  );
}

export function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null;
  const map: Record<string, string> = {
    low: 'badge-gray',
    medium: 'badge-blue',
    high: 'badge-yellow',
    critical: 'badge-red',
  };
  return <span className={map[priority] || 'badge-gray'}>{priority}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'badge-gray',
    submitted: 'badge-blue',
    received: 'badge-blue',
    accessioned: 'badge-purple',
    preparing: 'badge-purple',
    testing: 'badge-yellow',
    review: 'badge-yellow',
    qa_review: 'badge-pink',
    approved: 'badge-green',
    released: 'badge-green',
    archived: 'badge-gray',
    rejected: 'badge-red',
  };
  return (
    <span className={map[status] || 'badge-gray'}>
      {status.replace('_', ' ')}
    </span>
  );
}