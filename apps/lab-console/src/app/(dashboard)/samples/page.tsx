'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { samplesApi } from '@/lib/api';
import Link from 'next/link';
import { Search, Filter, Plus } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '../dashboard/page';

export default function SamplesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['samples', page, search, status],
    queryFn: () =>
      samplesApi.list({
        page,
        limit: 20,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Samples</h1>
          <p className="text-gray-600 mt-1">
            {data?.meta?.total || 0} total samples
          </p>
        </div>
        <Link href="/samples/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Sample
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by sample code, lot, product..."
              className="input pl-10"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="input max-w-[200px]"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="testing">Testing</option>
            <option value="qa_review">QA Review</option>
            <option value="approved">Approved</option>
            <option value="released">Released</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Sample Code</th>
                <th>Batch</th>
                <th>Product</th>
                <th>Lot Number</th>
                <th>Tests</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    No samples found
                  </td>
                </tr>
              ) : (
                data?.data?.map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-medium font-mono text-sm">{s.sampleCode}</td>
                    <td className="text-sm">{s.batch?.batchNumber}</td>
                    <td>{s.product?.name}</td>
                    <td className="font-mono text-xs">{s.lotNumber}</td>
                    <td>{s.tests?.length || 0}</td>
                    <td><PriorityBadge priority={s.batch?.priority} /></td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="text-sm text-gray-500">
                      {new Date(s.createdAt).toLocaleDateString()}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!data.meta.hasPreviousPage}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.meta.hasNextPage}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}