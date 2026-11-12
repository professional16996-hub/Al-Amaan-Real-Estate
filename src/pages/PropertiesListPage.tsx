import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw, Search } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { DynamicSEO } from '../components/DynamicSEO';
import { PropertyCard } from '../components/PropertyCard';

export const PropertiesListPage: React.FC = () => {
  const { data, loading } = useSite();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedScheme, setSelectedScheme] = useState(searchParams.get('scheme') || '');
  const [selectedSize, setSelectedSize] = useState(searchParams.get('size') || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [maxPriceCr, setMaxPriceCr] = useState<string>('');

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    (data?.properties || []).forEach((p) => {
      if (p.size) sizes.add(p.size);
    });
    return Array.from(sizes);
  }, [data]);

  const filtered = useMemo(() => {
    const list = data?.properties || [];
    return list.filter((prop) => {
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${prop.title} ${prop.location} ${prop.referenceCode} ${prop.schemeName || ''} ${prop.size}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedScheme && prop.schemeId !== selectedScheme) return false;
      if (selectedSize && prop.size !== selectedSize) return false;
      if (selectedCategory && prop.category !== selectedCategory) return false;
      if (selectedStatus !== 'All' && prop.status !== selectedStatus) return false;
      if (maxPriceCr && Number(maxPriceCr) > 0) {
        if (prop.price > Number(maxPriceCr)) return false;
      }
      return true;
    });
  }, [data, query, selectedScheme, selectedSize, selectedCategory, selectedStatus, maxPriceCr]);

  const resetFilters = () => {
    setQuery('');
    setSelectedScheme('');
    setSelectedSize('');
    setSelectedCategory('');
    setSelectedStatus('All');
    setMaxPriceCr('');
    setSearchParams({});
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <DynamicSEO pageKey="properties" />

      <section className="bg-[#0B192C] text-white py-14 lg:py-16 border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
            Lahore Property Registry · Verified Listings
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold">
            Available Properties, Villas &amp; Plots
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl">
            Filter verified residential plots, Main Boulevard commercial allocations, and turnkey homes by housing scheme, plot size, location, and PKR budget.
          </p>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 space-y-8">
          {/* Search & Multi-Facet Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 relative">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Location, Block or Reference
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Rose Block, Main Boulevard, AAR-AJG..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Housing Scheme
                </label>
                <select
                  value={selectedScheme}
                  onChange={(e) => setSelectedScheme(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0B192C]"
                >
                  <option value="">All Housing Schemes</option>
                  {(data?.schemes || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Plot / Property Size
                </label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0B192C]"
                >
                  <option value="">All Sizes</option>
                  {availableSizes.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Maximum Budget (PKR)
                </label>
                <select
                  value={maxPriceCr}
                  onChange={(e) => setMaxPriceCr(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0B192C]"
                >
                  <option value="">Any Budget</option>
                  <option value="4000000">Up to PKR 40 Lakh</option>
                  <option value="7000000">Up to PKR 70 Lakh</option>
                  <option value="15000000">Up to PKR 1.5 Crore</option>
                  <option value="35000000">Up to PKR 3.5 Crore</option>
                  <option value="80000000">Up to PKR 8.0 Crore</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded">
                  {['All', 'Available', 'Reserved', 'Sold'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                        selectedStatus === st
                          ? 'bg-[#0B192C] text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Filter by property category"
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded bg-white text-slate-700"
                >
                  <option value="">All Categories</option>
                  <option value="Residential Plot">Residential Plot</option>
                  <option value="Commercial Plot">Commercial Plot</option>
                  <option value="Luxury Residence">Luxury Residence</option>
                  <option value="Commercial Plaza">Commercial Plaza</option>
                </select>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span className="font-mono-num">
                  Showing <strong>{filtered.length}</strong> of {data?.properties.length || 0} listings
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 font-semibold text-[#0B192C] hover:text-[#9F7A31]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {loading && !data ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-80 bg-slate-200 rounded animate-pulse" />
              <div className="h-80 bg-slate-200 rounded animate-pulse" />
              <div className="h-80 bg-slate-200 rounded animate-pulse" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-md p-14 text-center space-y-3">
              <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
                No Matching Properties Found
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Adjust your price range, scheme filter, or plot size criteria to view available verified listings.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
              >
                Reset All Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
