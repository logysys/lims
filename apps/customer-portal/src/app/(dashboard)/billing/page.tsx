'use client';

import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/lib/api';
import { CreditCard, Download, DollarSign } from 'lucide-react';

export default function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => billingApi.invoices(),
  });

  const { data: stats } = useQuery({
    queryKey: ['billing-stats'],
    queryFn: () => billingApi.dashboard(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-gray-600 mt-1">Manage invoices and payment methods</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Outstanding</p>
          <p className="text-2xl font-bold text-yellow-600">
            ${stats?.outstandingAmount?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">{stats?.counts?.paid || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.counts?.pending || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{stats?.counts?.overdue || 0}</p>
        </div>
      </div>

      <div className="card p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
            ) : data?.data?.map((inv: any) => (
              <tr key={inv.id}>
                <td className="font-mono text-sm">{inv.invoiceNumber}</td>
                <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="font-medium">
                  ${Number(inv.totalAmount).toFixed(2)}
                </td>
                <td>
                  {inv.status === 'paid' && <span className="badge-green">Paid</span>}
                  {inv.status === 'sent' && <span className="badge-blue">Pending</span>}
                  {inv.status === 'overdue' && <span className="badge-red">Overdue</span>}
                </td>
                <td>
                  {inv.status !== 'paid' && (
                    <button className="text-sky-600 text-sm hover:underline">
                      Pay Now
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}