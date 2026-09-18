'use client';

import { useQuery } from '@tanstack/react-query';
import { coaApi } from '@/lib/api';
import { FileCheck, Download, Eye, QrCode } from 'lucide-react';
import { useState } from 'react';

export default function ReportsPage() {
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['coas'],
    queryFn: () => coaApi.list({ limit: 50 }),
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const downloadBatch = () => {
    // In production, call batch download endpoint
    console.log('Download:', selected);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Certificates of Analysis</h1>
          <p className="text-gray-600 mt-1">Download and view COAs for your samples</p>
        </div>
        {selected.length > 0 && (
          <button onClick={downloadBatch} className="btn-primary">
            <Download className="w-4 h-4 inline mr-2" /> Download {selected.length}
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th className="w-12">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setSelected(e.target.checked ? data?.data?.map((c: any) => c.id) || [] : [])
                  }
                />
              </th>
              <th>COA #</th>
              <th>Product</th>
              <th>Lot</th>
              <th>Released</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8">Loading...</td>
              </tr>
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No COAs available yet
                </td>
              </tr>
            ) : (
              data?.data?.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                    />
                  </td>
                  <td className="font-mono text-sm">{c.coaNumber}</td>
                  <td>{c.content?.productName}</td>
                  <td className="font-mono text-xs">{c.content?.lotNumber}</td>
                  <td className="text-sm">
                    {c.releasedAt ? new Date(c.releasedAt).toLocaleDateString() : '—'}
                  </td>
                  <td><span className="badge-green">Released</span></td>
                  <td className="flex gap-2">
                    <a href={c.publicUrl} target="_blank" className="text-sky-600">
                      <Eye className="w-4 h-4" />
                    </a>
                    <button className="text-sky-600">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}