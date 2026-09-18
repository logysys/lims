'use client';

import { useQuery } from '@tanstack/react-query';
import { samplesApi } from '@/lib/api';
import Link from 'next/link';
import { PriorityBadge, StatusBadge } from '../dashboard/page';
import { FlaskConical, AlertCircle } from 'lucide-react';

export default function QueuePage() {
  const { data: queue = [], isLoading } = useQuery({
    queryKey: ['my-queue-full'],
    queryFn: samplesApi.myQueue,
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="text-center py-12">Loading queue...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Queue</h1>
        <p className="text-gray-600 mt-1">
          {queue.length} sample(s) assigned to you
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="card text-center py-12">
          <FlaskConical className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No samples in your queue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queue.map((s: any) => (
            <Link
              key={s.id}
              href={`/samples/${s.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-xs text-gray-500">{s.sampleCode}</p>
                  <h3 className="font-semibold text-gray-900 mt-1">{s.product?.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">Lot: {s.lotNumber}</p>
                </div>
                <PriorityBadge priority={s.batch?.priority} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tests:</span>
                  <span className="font-medium">{s.tests?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due:</span>
                  <span className="font-medium">
                    {s.batch?.dueDate
                      ? new Date(s.batch.dueDate).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status:</span>
                  <StatusBadge status={s.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}