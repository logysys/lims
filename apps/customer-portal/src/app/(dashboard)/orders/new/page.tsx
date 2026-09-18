'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productsApi, samplesApi, testingApi } from '@/lib/api';
import { Plus, Trash2, Save, Send } from 'lucide-react';

const sampleSchema = z.object({
  productId: z.string().min(1, 'Product required'),
  lotNumber: z.string().min(1, 'Lot required'),
  manufacturingDate: z.string().optional(),
  expirationDate: z.string().optional(),
  sampleWeight: z.number().optional(),
  sampleVolume: z.number().optional(),
  unit: z.string().optional(),
  testMethodIds: z.array(z.string()).min(1, 'Select at least one test'),
});

const orderSchema = z.object({
  purchaseOrder: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  notes: z.string().optional(),
  samples: z.array(sampleSchema).min(1, 'Add at least one sample'),
});

type OrderForm = z.infer<typeof orderSchema>;

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list({ limit: 200 }),
  });

  const { data: methods } = useQuery({
    queryKey: ['methods'],
    queryFn: testingApi.methods,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      priority: 'medium',
      samples: [
        {
          productId: '',
          lotNumber: '',
          testMethodIds: [],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'samples' });

  const submitMutation = useMutation({
    mutationFn: (data: OrderForm) => {
      const batchNumber = `ORD-${Date.now()}`;
      return samplesApi.createBatch({
        batchNumber,
        customerId: 'current-user-org',
        purchaseOrder: data.purchaseOrder,
        priority: data.priority,
        notes: data.notes,
        samples: data.samples,
      });
    },
    onSuccess: () => {
      toast.success('Order submitted successfully!');
      router.push('/orders');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Submission failed');
    },
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <p className="text-gray-600 mt-1">Submit samples for testing</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {['Details', 'Samples', 'Review'].map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center py-2 rounded text-sm font-medium ${
              step > i + 1
                ? 'bg-green-100 text-green-700'
                : step === i + 1
                ? 'bg-sky-100 text-sky-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit((d) => submitMutation.mutate(d))} className="space-y-6">
        {step === 1 && (
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">Order Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Purchase Order #</label>
                <input {...register('purchaseOrder')} className="input" />
              </div>
              <div>
                <label className="label">Priority</label>
                <select {...register('priority')} className="input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea {...register('notes')} rows={3} className="input" />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setStep(2)} className="btn-primary">
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {fields.map((field, idx) => (
              <div key={field.id} className="card">
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold">Sample #{idx + 1}</h3>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Product *</label>
                    <select {...register(`samples.${idx}.productId`)} className="input">
                      <option value="">Select product...</option>
                      {products?.data?.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Lot Number *</label>
                    <input {...register(`samples.${idx}.lotNumber`)} className="input" />
                  </div>
                  <div>
                    <label className="label">Manufacturing Date</label>
                    <input
                      type="date"
                      {...register(`samples.${idx}.manufacturingDate`)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Expiration Date</label>
                    <input
                      type="date"
                      {...register(`samples.${idx}.expirationDate`)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Weight</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`samples.${idx}.sampleWeight`, { valueAsNumber: true })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <input
                      {...register(`samples.${idx}.unit`)}
                      className="input"
                      placeholder="g, mL..."
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="label">Test Methods *</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                    {methods?.map((m: any) => (
                      <label key={m.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          value={m.id}
                          {...register(`samples.${idx}.testMethodIds`)}
                        />
                        <span>{m.methodName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                append({ productId: '', lotNumber: '', testMethodIds: [] })
              }
              className="btn-secondary w-full"
            >
              <Plus className="w-4 h-4 inline mr-2" /> Add Another Sample
            </button>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                ← Back
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary">
                Review →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">Review & Submit</h2>
            <p className="text-sm text-gray-600">
              You're about to submit {fields.length} sample(s) for testing.
            </p>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="btn-primary"
              >
                <Send className="w-4 h-4 inline mr-2" />
                {submitMutation.isPending ? 'Submitting...' : 'Submit Order'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}