'use client';

import { useQuery } from '@tanstack/react-query';
import { verifyApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { Check, ShieldCheck, Download, Share2, QrCode, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: record, isLoading } = useQuery({
    queryKey: ['verify', id],
    queryFn: () => verifyApi.getById(id),
  });

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TruSource Verification',
          text: `Verified: ${record?.productName}`,
          url,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  if (isLoading) return <div className="p-12 text-center">Loading...</div>;
  if (!record) return <div className="p-12 text-center">Not found</div>;

  const isValid = record.verificationStatus === 'verified';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Verification banner */}
      <div className={`${isValid ? 'bg-green-600' : 'bg-yellow-600'} text-white`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold">
              {isValid ? 'Verified – Authentic Certificate' : 'Superseded'}
            </p>
            <p className="text-xs opacity-90">
              COA #{record.coaId?.slice(0, 8)} · Verified{' '}
              {new Date(record.lastVerifiedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h1 className="text-2xl font-bold">{record.productName}</h1>
          <p className="text-gray-600 mt-1">{record.manufacturerName}</p>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-xs text-gray-500 uppercase">Lot Number</p>
              <p className="font-mono font-medium mt-1">{record.lotNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Status</p>
              <p className="font-medium mt-1 capitalize">{record.verificationStatus}</p>
            </div>
          </div>
        </div>

        {/* Test results */}
        {record.testResults && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Test Results</h2>
            <table className="w-full">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-2 text-sm">Test</th>
                  <th className="pb-2 text-sm">Result</th>
                  <th className="pb-2 text-sm">Unit</th>
                  <th className="pb-2 text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {record.testResults.map?.((t: any, i: number) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 text-sm">{t.method}</td>
                    <td className="py-2 text-sm font-medium">{t.result}</td>
                    <td className="py-2 text-sm">{t.unit || '—'}</td>
                    <td className="py-2 text-sm">
                      {t.status === 'pass' ? (
                        <span className="text-green-600">✓ Pass</span>
                      ) : (
                        <span className="text-red-600">✗ Fail</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Hash integrity */}
        {record.qrCodeData && (
          <details className="bg-white rounded-lg border p-4">
            <summary className="cursor-pointer flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4" /> Verify File Integrity (Advanced)
            </summary>
            <p className="mt-3 text-xs font-mono break-all text-gray-600 bg-gray-50 p-3 rounded">
              SHA-256: {record.qrCodeData}
            </p>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <a href={record.publicUrl} target="_blank" className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Download COA PDF
          </a>
          <button onClick={handleShare} className="btn-secondary flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={() => window.print()} className="btn-secondary">
            Print
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center pt-6 border-t">
          This verification was generated by TruSource LIMS. Data is cryptographically
          signed and immutable.
        </p>
      </div>
    </div>
  );
}