import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, MapPin } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { DynamicSEO } from '../components/DynamicSEO';
import { ResilientImage } from '../components/ResilientImage';
import { formatPKRCompact } from '../utils/formatters';

export const SchemesListPage: React.FC = () => {
  const { data, loading } = useSite();

  if (loading && !data) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 space-y-6">
        <div className="h-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-80 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  const schemes = data?.schemes || [];
  const currency = data?.settings.currency || 'PKR';

  return (
    <div className="bg-white">
      <DynamicSEO pageKey="schemes" />

      {/* Page Header */}
      <section className="bg-[#0B192C] text-white py-16 lg:py-20 border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
            Approved Communities · Dynamic Portfolio
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold tracking-tight [text-wrap:balance]">
            Master-Planned Housing Schemes in Lahore
          </h1>
          <p className="mt-4 text-base text-slate-300 max-w-2xl leading-relaxed">
            Every housing society represented by {data?.settings.siteName} undergoes rigorous TMA/LDA NOC verification, infrastructure inspection, and transfer desk auditing.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 space-y-12">
          {schemes.length === 0 ? (
            <div className="p-12 text-center border border-slate-200 rounded-md">
              <p className="text-sm text-slate-600">No published housing schemes are currently listed.</p>
              <Link
                to="/contact"
                className="mt-4 inline-block px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
              >
                Contact Advisory Desk
              </Link>
            </div>
          ) : (
            schemes.map((scheme) => {
              const lowestPrice = scheme.plotCategories.length
                ? Math.min(...scheme.plotCategories.map((c) => c.startingPrice))
                : 0;

              return (
                <article
                  key={scheme.id}
                  className="grid grid-cols-1 lg:grid-cols-12 border border-slate-200 rounded-md overflow-hidden bg-white hover:border-[#B89146] transition-colors"
                >
                  <div className="lg:col-span-5 relative min-h-[280px] bg-slate-900">
                    <Link to={`/schemes/${scheme.slug}`} className="block w-full h-full">
                      <ResilientImage
                        src={scheme.heroImage}
                        alt={scheme.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  </div>

                  <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {scheme.featured && (
                          <>
                            <span className="font-semibold text-[#9F7A31]">Featured Flagship Scheme</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span>{scheme.approvalStatus}</span>
                        <span aria-hidden="true">·</span>
                        <span>{scheme.city}</span>
                      </div>

                      <Link to={`/schemes/${scheme.slug}`}>
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
                      <div>
                        {lowestPrice > 0 && (
                          <p className="text-xs text-slate-500">
                            Starting Valuation:{' '}
                            <span className="font-mono-num font-semibold text-[#0B192C]">
                              {formatPKRCompact(lowestPrice, currency)}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
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
                          to={`/schemes/${scheme.slug}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] transition-colors"
                        >
                          <span>View Master Plan &amp; Plots</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};
