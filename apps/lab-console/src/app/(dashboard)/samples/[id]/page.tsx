'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { samplesApi, workflowApi, qualityApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { StatusBadge, PriorityBadge } from '../../dashboard/page';
import { Clock, CheckCircle2, User, MapPin, AlertTriangle } from 'lucide-react';

export default function SampleDetailPage() {
  const params = useParams();
  const sampleId = params.id as string;
  const queryClient = useQueryClient();
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<any>(null);
  const [justification, setJustification] = useState('');

  const { data: sample, isLoading } = useQuery({
    queryKey: ['sample', sampleId],
    queryFn: () => samplesApi.get(sampleId),
  });

  const { data: transitions = [] } = useQuery({
    queryKey: ['transitions', sample?.status],
    queryFn: () => workflowApi.transitions(sample?.status),
    enabled: !!sample?.status,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['sample-history', sampleId],
    queryFn: () => workflowApi.history(sampleId),
  });

  const transitionMutation = useMutation({
    mutationFn: ({ status, justification }: { status: string; justification: string }) =>
      samplesApi.updateStatus(sampleId, status, justification),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['sample', sampleId] });
      queryClient.invalidateQueries({ queryKey: ['sample-history', sampleId] });
      setShowTransitionModal(false);
      setSelectedTransition(null);
      setJustification('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update');
    },
  });

  if (isLoading) return <div className="text-center py-12">Loading...</div>;
  if (!sample) return <div className="text-center py-12">Sample not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              {sample.sampleCode}
            </h1>
            <StatusBadge status={sample.status} />
            <PriorityBadge priority={sample.batch?.priority} />
          </div>
          <p className="text-gray-600 mt-2">
            {sample.product?.name} · Lot {sample.lotNumber}
          </p>
        </div>

        <div className="flex gap-2">
          {transitions.map((t: any) => (
            <button
              key={t.stateCode}
              onClick={() => {
                setSelectedTransition(t);
                setShowTransitionModal(true);
              }}
              className={t.requiresEsignature ? 'btn-primary' : 'btn-secondary'}
            >
              → {t.stateName}
            </button>
          ))}
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Sample Information</h2>
          <dl className="grid grid-cols-2 gap-4">
            <InfoRow label="Batch" value={sample.batch?.batchNumber} />
            <InfoRow label="Customer" value={sample.batch?.customer?.name} />
            <InfoRow
              label="Manufacturing Date"
              value={sample.manufacturingDate ? new Date(sample.manufacturingDate).toLocaleDateString() : '—'}
            />
            <InfoRow
              label="Expiration Date"
              value={sample.expirationDate ? new Date(sample.expirationDate).toLocaleDateString() : '—'}
            />
            <InfoRow label="Sample Weight" value={sample.sampleWeight ? `${sample.sampleWeight} ${sample.unit || 'g'}` : '—'} />
            <InfoRow label="Storage Condition" value={sample.storageCondition} />
            <InfoRow label="Current Location" value={sample.currentLocation} />
            <InfoRow label="Container ID" value={sample.containerId} />
          </dl>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="btn-secondary w-full text-left">
              <MapPin className="w-4 h-4 inline mr-2" /> Chain of Custody
            </button>
            <button className="btn-secondary w-full text-left">
              <Clock className="w-4 h-4 inline mr-2" /> Print Label
            </button>
            <button className="btn-secondary w-full text-left">
              <CheckCircle2 className="w-4 h-4 inline mr-2" /> Generate COA
            </button>
          </div>
        </div>
      </div>

      {/* Tests */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Test Results ({sample.tests?.length || 0})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Result</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Completed</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sample.tests?.map((t: any) => (
              <tr key={t.id}>
                <td>{t.method?.methodName}</td>
                <td className="font-medium">{t.resultValue ?? '—'}</td>
                <td>{t.resultUnit || '—'}</td>
                <td>
                  {t.resultStatus === 'pass' && <span className="badge-green">Pass</span>}
                  {t.resultStatus === 'fail' && <span className="badge-red">Fail</span>}
                  {!t.resultStatus && <span className="badge-gray">Pending</span>}
                </td>
                <td className="text-sm text-gray-500">
                  {t.completedAt ? new Date(t.completedAt).toLocaleString() : '—'}
                </td>
                <td>
                  <a href={`/testing/${t.id}`} className="text-sky-600 hover:underline text-sm">
                    {t.status === 'pending' ? 'Start' : 'View'}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Workflow History */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Workflow History</h2>
        <div className="space-y-3">
          {history.map((h: any) => (
            <div key={h.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm">
                  Transitioned from <span className="font-medium">{h.fromState}</span> to{' '}
                  <span className="font-medium">{h.toState}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(h.createdAt).toLocaleString()} · User {h.userId?.slice(0, 8)}
                </p>
                {h.justification && (
                  <p className="text-xs text-gray-600 mt-1 italic">"{h.justification}"</p>
                )}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No transitions yet</p>
          )}
        </div>
      </div>

      {/* Transition Modal */}
      {showTransitionModal && selectedTransition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Transition to {selectedTransition.stateName}
              </h3>

              {selectedTransition.requiresEsignature && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    This transition requires an electronic signature.
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label className="label">Justification</label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Reason for this transition..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowTransitionModal(false);
                    setSelectedTransition(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    transitionMutation.mutate({
                      status: selectedTransition.stateCode,
                      justification,
                    })
                  }
                  disabled={transitionMutation.isPending}
                  className="btn-primary"
                >
                  {transitionMutation.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-900 mt-1">{value || '—'}</dd>
    </div>
  );
}