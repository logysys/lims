'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { verifyApi } from '@/lib/api';
import { Check, ShieldCheck, ExternalLink, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function ResultsPage() {
  const search = useSearchParams();
  const query = search.get('q') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['verify-search', query],
    queryFn: () => verifyApi.search(query),
    enabled: query.length >= 3,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-600" />
            <span className="font-bold text-lg">TruSource Verify</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Search Results</h1>
        <p className="text-gray-600 mb-6">
          {data?.data?.length || 0} result(s) for "{query}"
        </p>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : data?.data?.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <p className="text-gray-500">No verified products found matching your query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data?.map((r: any) => (
              <div key={r.id} className="bg-white rounded-lg border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs text-green-700 font-medium uppercase tracking-wide">
                      Verified
                    </span>
                  </div>
                  <QrCode className="w-4 h-4 text-gray-400" />
                </div>

                <h3 className="font-semibold text-lg mb-1">{r.productName}</h3>
                <p className="text-sm text-gray-600">{r.manufacturerName}</p>
                <p className="text-xs font-mono text-gray-500 mt-2">
                  Lot: {r.lotNumber}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  Verified {new Date(r.lastVerifiedAt).toLocaleDateString()}
                </p>

                <Link
                  href={`/verify/${r.id}`}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  View COA <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}