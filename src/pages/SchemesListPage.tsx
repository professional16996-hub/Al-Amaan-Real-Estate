import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, ExternalLink, Layers, MapPin, Search } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { DynamicSEO } from '../components/DynamicSEO';
import { ResilientImage } from '../components/ResilientImage';
import { formatPKRCompact } from '../utils/formatters';

export const SchemesListPage: React.FC = () => {
  const { data, loading } = useSite();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [query, setQuery] = useState<string>('');

  const schemes = data?.schemes || [];
  const allProperties = data?.properties || [];
  const currency = data?.settings.currency || 'PKR';

  const filteredSchemes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schemes.filter((s) => {
      const currentStatus = s.status || 'Ongoing';
      if (statusFilter !== 'All' && currentStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q)
      );
    });
  }, [schemes, statusFilter, query]);

  if (loading && !data) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 space-y-6">
        <div className="h-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-80 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <DynamicSEO pageKey="schemes" />

      {/* Page Header */}
      <section className="bg-[#0B192C] text-white py-16 lg:py-20 border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
            {data?.settings.siteName} · Complete Development Portfolio
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold tracking-tight [text-wrap:balance]">
            Our Real Estate Projects &amp; Housing Societies
          </h1>
          <p className="mt-4 text-base text-slate-300 max-w-2xl leading-relaxed">
            Every project owned, developed, or marketed by {data?.settings.siteName} maintains independent documentation, transparent payment plans, verified site updates, and on-ground plots.
          </p>
        </div>
      </section>

      <section className="py-14 lg:py-18">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 space-y-10">
          {/* Status Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md self-start">
              {['All', 'Ongoing', 'Upcoming', 'Completed'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-[#0B192C] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search project name or location..."
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
              />
            </div>
          </div>

          {filteredSchemes.length === 0 ? (
            <div className="p-12 text-center border border-slate-200 rounded-md space-y-3">
              <p className="text-sm text-slate-600">
                No published projects match your filter right now.
              </p>
              {statusFilter !== 'All' || query ? (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setQuery('');
                  }}
                  className="px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
                >
                  Show All Projects
                </button>
              ) : (
                <Link
                  to="/contact"
                  className="inline-block px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
                >
                  Contact Advisory Desk
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {filteredSchemes.map((scheme) => {
                const lowestPrice = scheme.plotCategories.length
                  ? Math.min(...scheme.plotCategories.map((c) => c.startingPrice))
                  : 0;
                const societyPlots = allProperties.filter((p) => p.schemeId === scheme.id);
                const availablePlotsCount = societyPlots.filter((p) => p.status === 'Available').length;
                const plansCount = scheme.paymentPlans?.length || 0;
                const updatesCount = scheme.developmentUpdates?.length || 0;

                return (
                  <article
                    key={scheme.id}
                    className="grid grid-cols-1 lg:grid-cols-12 border border-slate-200 rounded-md overflow-hidden bg-white hover:border-[#B89146] transition-colors"
                  >
                    <div className="lg:col-span-5 relative min-h-[280px] bg-slate-900">
                      <Link to={`/projects/${scheme.slug}`} className="block w-full h-full">
                        <ResilientImage
                          src={scheme.heroImage}
                          alt={scheme.name}
                          className="w-full h-full object-cover"
                        />
                        {scheme.projectLogo ? (
                          <div className="absolute bottom-4 left-4 bg-white/95 p-2 rounded border border-slate-200 shadow-sm">
                            <img
                              src={scheme.projectLogo}
                              alt={`${scheme.name} logo`}
                              className="h-9 w-auto max-w-[130px] object-contain"
                            />
                          </div>
                        ) : null}
                      </Link>
                    </div>

                    <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-[#9F7A31]">{scheme.status || 'Ongoing'}</span>
                          <span aria-hidden="true">·</span>
                          {scheme.featured && (
                            <>
                              <span className="font-semibold text-[#0B192C]">Flagship Project</span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span>{scheme.approvalStatus}</span>
                          <span aria-hidden="true">·</span>
                          <span>{scheme.city}</span>
                        </div>

                        <Link to={`/projects/${scheme.slug}`}>
                          <h2 className="mt-2 font-display text-3xl font-semibold text-[#0B192C] hover:text-[#9F7A31] transition-colors">
                            {scheme.name}
                          </h2>
                        </Link>

                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-[#9F7A31] shrink-0" />
                          <span>{scheme.location}</span>
                        </p>

                        <p className="mt-4 text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {scheme.description}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600 font-mono-num">
                          <span className="inline-flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#9F7A31]" />
                            {plansCount} Payment {plansCount === 1 ? 'Plan' : 'Plans'}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#9F7A31]" />
                            {updatesCount} Development {updatesCount === 1 ? 'Update' : 'Updates'}
                          </span>
                        </div>

                        {scheme.plotCategories.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-slate-100">
                            <p className="text-xs font-semibold text-slate-700 mb-2">
                              Available Plot Categories:
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              {scheme.plotCategories.map((cat, idx) => (
                                <React.Fragment key={cat.id}>
                                  {idx > 0 && <span aria-hidden="true">·</span>}
                                  <span>
                                    <strong className="text-slate-900 font-medium">{cat.size}</strong> (
                                    <span className="font-mono-num">
                                      {formatPKRCompact(cat.startingPrice, currency)}
                                    </span>
                                    )
                                  </span>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          {lowestPrice > 0 && (
                            <p className="text-xs text-slate-500">
                              Starting Valuation:{' '}
                              <span className="font-mono-num font-semibold text-[#0B192C]">
                                {formatPKRCompact(lowestPrice, currency)}
                              </span>
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            Project Listings:{' '}
                            <span className="font-mono-num font-semibold text-[#0B192C]">
                              {societyPlots.length} {societyPlots.length === 1 ? 'Listing' : 'Listings'}
                            </span>{' '}
                            <span className="font-mono-num">({availablePlotsCount} Available)</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {scheme.googleMapsUrl && (
                            <a
                              href={scheme.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 border border-slate-200 rounded hover:border-slate-400"
                            >
                              <span>Google Maps</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <Link
                            to={`/projects/${scheme.slug}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] transition-colors"
                          >
                            <span>View Project Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
