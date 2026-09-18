'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { bulkApi } from '@/lib/api';
import { Upload, FileSpreadsheet, Check, AlertTriangle, Download } from 'lucide-react';

export default function BulkUploadPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [report, setReport] = useState<any>(null);

  const parseMutation = useMutation({
    mutationFn: (f: File) => bulkApi.parse(f),
    onSuccess: (data) => {
      setRows(data.rows);
      // Auto-map matching headers
      const autoMap: Record<string, string> = {};
      Object.keys(data.rows[0] || {}).forEach((k) => {
        autoMap[k] = k; // Simple pass-through
      });
      setMapping(autoMap);
      setStep(2);
    },
    onError: () => toast.error('Failed to parse file'),
  });

  const validateMutation = useMutation({
    mutationFn: () => bulkApi.validate({ rows, columnMapping: mapping }),
    onSuccess: (data) => {
      setReport(data);
      setStep(3);
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => bulkApi.submit(rows),
    onSuccess: (res) => {
      toast.success(`Created batch ${res.batchNumber} with ${res.sampleCount} samples`);
      setStep(4);
    },
    onError: () => toast.error('Submission failed'),
  });

  const downloadTemplate = async () => {
    const blob = await bulkApi.template();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tru-source-bulk-template.csv';
    a.click();
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Bulk Submission</h1>
          <p className="text-gray-600 mt-1">Upload multiple samples at once via CSV/Excel</p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary">
          <Download className="w-4 h-4 inline mr-2" /> Template
        </button>
      </div>

      {/* Steps */}
      <div className="flex gap-2">
        {['Upload', 'Map Columns', 'Validate', 'Submit'].map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center py-2 rounded text-sm ${
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

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="card">
          <div
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) {
                setFile(f);
                parseMutation.mutate(f);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-sky-400 transition-colors cursor-pointer"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">
              Drop your CSV or Excel file here
            </p>
            <p className="text-sm text-gray-500 mt-2">or</p>
            <label className="btn-primary inline-block mt-4 cursor-pointer">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    parseMutation.mutate(f);
                  }
                }}
              />
              Browse Files
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Accepted: .csv, .xlsx, .xls · Max 50MB
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 2 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            <span className="font-medium">
              {file?.name} · {rows.length} rows detected
            </span>
          </div>

          <h3 className="font-semibold">Map Columns</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(rows[0] || {}).map((col) => (
              <div key={col}>
                <label className="label">{col}</label>
                <select
                  value={mapping[col] || ''}
                  onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
                  className="input"
                >
                  <option value="">Skip</option>
                  <option value="product_code">Product Code</option>
                  <option value="lot_number">Lot Number</option>
                  <option value="manufacturing_date">Manufacturing Date</option>
                  <option value="expiration_date">Expiration Date</option>
                  <option value="sample_weight">Sample Weight</option>
                  <option value="sample_volume">Sample Volume</option>
                  <option value="unit">Unit</option>
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
            <button
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
              className="btn-primary"
            >
              {validateMutation.isPending ? 'Validating...' : 'Start Validation →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Validation Report */}
      {step === 3 && report && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Validation Report</h3>
            <div
              className={`text-3xl font-bold ${
                report.dataQualityScore >= 95
                  ? 'text-green-600'
                  : report.dataQualityScore >= 75
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {report.dataQualityScore}%
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm text-gray-500">Total Rows</p>
              <p className="text-xl font-bold">{report.totalRows}</p>
            </div>
            <div className="bg-green-50 rounded p-3">
              <p className="text-sm text-green-700">Valid</p>
              <p className="text-xl font-bold text-green-700">{report.validRows}</p>
            </div>
            <div className="bg-red-50 rounded p-3">
              <p className="text-sm text-red-700">Errors</p>
              <p className="text-xl font-bold text-red-700">{report.errorRows}</p>
            </div>
          </div>

          {report.errors.length > 0 && (
            <div className="border rounded max-h-64 overflow-y-auto">
              {report.errors.map((e: any, i: number) => (
                <div key={i} className="p-3 border-b last:border-0 flex gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      Row {e.row}: {e.field}
                    </p>
                    <p className="text-xs text-gray-600">{e.message}</p>
                    {e.suggestion && (
                      <p className="text-xs text-sky-600 mt-1">💡 {e.suggestion}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || report.dataQualityScore < 75}
              className="btn-primary"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Batch'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Batch Submitted Successfully!</h2>
          <p className="text-gray-600">Your samples are now in the lab queue</p>
        </div>
      )}
    </div>
  );
}