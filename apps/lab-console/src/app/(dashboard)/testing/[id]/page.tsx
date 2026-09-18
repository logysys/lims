'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { testingApi, instrumentsApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Play, Save, CheckCircle2 } from 'lucide-react';

export default function TestExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  const queryClient = useQueryClient();

  const [instrumentId, setInstrumentId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [decision, setDecision] = useState('accept');
  const [comment, setComment] = useState('');

  const { data: test, isLoading } = useQuery({
    queryKey: ['test', testId],
    queryFn: () => testingApi.get(testId),
  });

  const { data: instruments } = useQuery({
    queryKey: ['instruments'],
    queryFn: () => instrumentsApi.list({ limit: 100 }),
  });

  const startMutation = useMutation({
    mutationFn: () => testingApi.start(testId, instrumentId),
    onSuccess: () => {
      toast.success('Test started');
      queryClient.invalidateQueries({ queryKey: ['test', testId] });
    },
  });

  const resultsMutation = useMutation({
    mutationFn: () => testingApi.enterResults(testId, results),
    onSuccess: () => {
      toast.success('Results saved');
      queryClient.invalidateQueries({ queryKey: ['test', testId] });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => testingApi.verify(testId, decision, comment),
    onSuccess: () => {
      toast.success('Test verified');
      router.push('/queue');
    },
  });

  if (isLoading) return <div className="text-center py-12">Loading...</div>;
  if (!test) return <div className="text-center py-12">Test not found</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{test.method?.methodName}</h1>
        <p className="text-gray-600 mt-1">
          Sample {test.sample?.sampleCode} · Lot {test.sample?.lotNumber}
        </p>
      </div>

      {/* Status card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="text-lg font-semibold capitalize">{test.status}</p>
          </div>
          {test.status === 'pending' && (
            <div className="flex gap-2">
              <select
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                className="input max-w-[240px]"
              >
                <option value="">Select instrument...</option>
                {instruments?.data?.map((i: any) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.instrumentCode})
                  </option>
                ))}
              </select>
              <button
                onClick={() => startMutation.mutate()}
                disabled={!instrumentId}
                className="btn-primary"
              >
                <Play className="w-4 h-4 inline mr-2" /> Start Test
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results Entry */}
      {test.status !== 'pending' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Results Entry</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Analyte</label>
                <input
                  type="text"
                  className="input"
                  defaultValue={test.method?.methodName}
                  readOnly
                />
              </div>
              <div>
                <label className="label">Result Value</label>
                <input
                  type="number"
                  step="any"
                  className="input"
                  value={results[0]?.resultValue || ''}
                  onChange={(e) =>
                    setResults([{ ...results[0], resultValue: parseFloat(e.target.value), analyte: test.method?.methodName }])
                  }
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <input
                  type="text"
                  className="input"
                  placeholder="%, mg/kg, ppm"
                  value={results[0]?.unit || ''}
                  onChange={(e) =>
                    setResults([{ ...results[0], unit: e.target.value, analyte: test.method?.methodName }])
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={3}
                value={results[0]?.notes || ''}
                onChange={(e) =>
                  setResults([{ ...results[0], notes: e.target.value, analyte: test.method?.methodName }])
                }
              />
            </div>

            <button
              onClick={() => resultsMutation.mutate()}
              disabled={!results[0]?.resultValue}
              className="btn-primary"
            >
              <Save className="w-4 h-4 inline mr-2" /> Save Results
            </button>
          </div>
        </div>
      )}

      {/* Verification */}
      {test.status === 'completed' && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Verification</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Decision</label>
              <div className="flex gap-4">
                {['accept', 'flag', 'reject'].map((d) => (
                  <label key={d} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="decision"
                      value={d}
                      checked={decision === d}
                      onChange={(e) => setDecision(e.target.value)}
                    />
                    <span className="capitalize">{d}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="input"
                rows={3}
              />
            </div>

            <button
              onClick={() => verifyMutation.mutate()}
              className="btn-primary"
            >
              <CheckCircle2 className="w-4 h-4 inline mr-2" /> Submit Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}