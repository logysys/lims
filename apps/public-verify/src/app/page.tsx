'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, QrCode, ShieldCheck, Award } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim().length >= 3) {
      router.push(`/results?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-sky-600" />
            <span className="font-bold text-xl">TruSource</span>
            <span className="text-xs text-gray-500 uppercase ml-2">Verify</span>
          </div>
          <nav className="flex gap-6 text-sm">
            <a href="/lookup/product" className="text-gray-600 hover:text-gray-900">
              Products
            </a>
            <a href="/lookup/manufacturer" className="text-gray-600 hover:text-gray-900">
              Manufacturers
            </a>
            <a href="/lookup/lot" className="text-gray-600 hover:text-gray-900">
              Lot Lookup
            </a>
            <a href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </a>
          </nav>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-sky-200 rounded-full px-4 py-1.5 text-sm text-sky-700 mb-6">
          <Award className="w-4 h-4" />
          ISO 17025 Certified Verification
        </div>

        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Verify Your Products
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          Instant verification of product purity, potency, and safety
        </p>

        <div className="relative max-w-2xl mx-auto">
          <div className="flex bg-white border-2 border-gray-200 rounded-2xl shadow-lg overflow-hidden focus-within:border-sky-500">
            <div className="flex items-center px-4 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by Product, Manufacturer, Lot #, or Compound"
              className="flex-1 py-5 outline-none text-lg"
            />
            <button onClick={handleSearch} className="btn-primary rounded-none px-8">
              Search
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {['CBD Oils', 'Terpenes', 'Heavy Metals', 'Pesticides'].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setQuery(chip);
                  handleSearch();
                }}
                className="text-sm px-3 py-1 bg-white border border-gray-200 rounded-full hover:border-sky-400 hover:text-sky-600"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-12">
          <button
            onClick={() => router.push('/scan')}
            className="btn-secondary flex items-center gap-2"
          >
            <QrCode className="w-4 h-4" /> Scan QR Code
          </button>
          <button onClick={() => router.push('/lookup/lot')} className="btn-secondary">
            Verify by Lot #
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={ShieldCheck}
            title="Independently Verified"
            description="Every certificate is issued by an ISO 17025 accredited laboratory"
          />
          <FeatureCard
            icon={Award}
            title="Tamper-Proof Records"
            description="Blockchain-backed hash chains ensure COAs cannot be altered"
          />
          <FeatureCard
            icon={QrCode}
            title="Instant Verification"
            description="Scan any TruSource badge for immediate authenticity confirmation"
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="w-12 h-12 bg-sky-50 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-sky-600" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}