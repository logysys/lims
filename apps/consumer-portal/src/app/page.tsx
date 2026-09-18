'use client';

import { useQuery } from '@tanstack/react-query';
import { consumerApi } from '@/lib/api';
import Link from 'next/link';
import { Search, QrCode, Heart, Award, Shield } from 'lucide-react';
import { useState } from 'react';

export default function ConsumerHome() {
  const [search, setSearch] = useState('');
  const { data: featured } = useQuery({
    queryKey: ['featured'],
    queryFn: consumerApi.featured,
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b sticky top-0 bg-white z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Award className="w-6 h-6 text-emerald-600" />
            TruSource Verified
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/browse">Browse</Link>
            <Link href="/lookup">Lookup</Link>
            <Link href="/badges">My Badges</Link>
            <Link href="/learn">Learn</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-emerald-50 to-sky-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Discover Verified Products
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Every product backed by laboratory-verified certificates
          </p>

          <div className="flex bg-white border rounded-2xl shadow overflow-hidden max-w-xl mx-auto">
            <div className="flex items-center px-4 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or brands..."
              className="flex-1 py-4 outline-none"
            />
            <Link
              href={`/browse?q=${search}`}
              className="bg-emerald-600 text-white px-6 py-4 font-medium hover:bg-emerald-700"
            >
              Search
            </Link>
          </div>

          <Link
            href="/scan"
            className="inline-flex items-center gap-2 mt-6 text-emerald-700 font-medium"
          >
            <QrCode className="w-4 h-4" /> Or scan a product QR code
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-6">Featured Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="Newly Verified"
            items={featured?.newestVerifications?.slice(0, 4) || []}
            href="/browse?sort=newest"
          />
          <FeatureCard
            title="Most Popular"
            items={featured?.mostViewed?.slice(0, 4) || []}
            href="/browse?sort=popular"
          />
          <FeatureCard
            title="Top Manufacturers"
            items={featured?.topManufacturers?.slice(0, 4) || []}
            href="/browse"
            isManufacturers
          />
        </div>
      </section>

      <section className="bg-emerald-50 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Shield className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Every product verified. Every time.</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our ISO 17025 accredited lab tests for purity, potency, heavy metals,
            pesticides, and microbials. Results are cryptographically signed and
            permanently recorded.
          </p>
          <Link
            href="/learn"
            className="inline-block mt-6 bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700"
          >
            Learn How It Works
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, items, href, isManufacturers }: any) {
  return (
    <div className="bg-white rounded-lg border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        <Link href={href} className="text-xs text-emerald-600 hover:underline">
          See all
        </Link>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">No items yet</p>
        ) : (
          items.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="truncate">
                {isManufacturers ? item.name : item.productName}
              </span>
              {item.verifiedBadge && (
                <span className="text-xs text-emerald-600">✓</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}