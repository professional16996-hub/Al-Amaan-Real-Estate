import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, MapPin } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { DynamicSEO } from '../components/DynamicSEO';
import { ResilientImage } from '../components/ResilientImage';
import { PropertyCard } from '../components/PropertyCard';
import { WhatsAppLogo } from '../components/WhatsAppIcon';
import { buildWhatsAppUrl, formatPKRCompact } from '../utils/formatters';

export const HomePage: React.FC = () => {
  const { data, loading } = useSite();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeSchemeId, setActiveSchemeId] = useState<string>('All');

  const featuredScheme = useMemo(() => {
    if (!data?.schemes.length) return null;
    return data.schemes.find((s) => s.featured) || data.schemes[0];
  }, [data]);

  const filteredProperties = useMemo(() => {
    const all = data?.properties || [];
    const byScheme =
      activeSchemeId === 'All' ? all : all.filter((p) => p.schemeId === activeSchemeId);
    const list =
      activeCategory === 'All'
        ? byScheme
        : activeCategory === 'Available'
          ? byScheme.filter((p) => p.status === 'Available')
          : byScheme.filter((p) => p.category === activeCategory);
    return list.slice(0, 6);
  }, [data, activeCategory, activeSchemeId]);

  if (loading && !data) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 space-y-8">
        <div className="h-[460px] bg-slate-100 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-72 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-72 bg-slate-100 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { content, settings, contact, testimonials } = data;
  const currency = settings.currency || 'PKR';

  const whatsappConsultUrl = buildWhatsAppUrl(
    contact.whatsappNumber,
    `Assalam-o-Alaikum ${settings.siteName}, I visited your website and would like guidance on Al Jalil Garden and available plots in Lahore.`
  );

  return (
    <div>
      <DynamicSEO pageKey="home" />

      {/* 1. Full-Width Aerial Society Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[660px] flex items-end bg-[#07111E] text-white overflow-hidden">
        <div className="absolute inset-0">
          <ResilientImage
            src={content.heroImage}
            alt={`${settings.siteName} — Master-Planned Housing Society Lahore`}
            priority
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07111E]/95 via-[#07111E]/75 to-[#07111E]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07111E] via-transparent to-[#07111E]/30" />
        </div>

        <div className="relative z-10 w-full max-w-[1240px] mx-auto px-5 sm:px-8 pt-24 pb-16 lg:pb-20">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#D4AF37]">
              {settings.siteName} · Lahore, Pakistan
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.75rem] font-semibold leading-[1.08] tracking-tight text-white [text-wrap:balance]">
              {content.heroHeadline}
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              {content.heroIntroduction}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold bg-[#B89146] text-[#0B192C] rounded hover:bg-[#cfa95e] transition-colors duration-150 whitespace-nowrap"
              >
                <span>{content.heroExplorePropertiesLabel || 'Explore Properties'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/schemes"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold bg-white/10 text-white border border-white/25 rounded hover:bg-white/20 transition-colors duration-150 whitespace-nowrap"
              >
                <span>{content.heroExploreSchemesLabel || 'Explore Schemes'}</span>
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-slate-200 hover:text-[#D4AF37] transition-colors duration-150 whitespace-nowrap"
              >
                <span>{content.heroContactLabel || 'Contact Us'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Admin-Editable Quantitative Statistics Strip */}
      <section className="bg-[#0B192C] text-white border-t border-white/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:divide-x lg:divide-white/10">
            {content.statistics.map((stat, index) => (
              <div key={stat.id} className={index > 0 ? 'lg:pl-8' : ''}>
                <p className="font-mono-num text-3xl sm:text-4xl font-semibold text-[#D4AF37] tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-white">{stat.label}</p>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{stat.context}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Housing Scheme Spotlight (Al Jalil Garden) */}
      {featuredScheme && (
        <section className="py-20 lg:py-24 bg-[#F8FAFC] border-b border-slate-200">
          <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold tracking-wide text-[#9F7A31]">
                {content.featuredSchemeSectionKicker}
              </p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B192C] leading-tight [text-wrap:balance]">
                {content.featuredSchemeSectionHeading}
              </h2>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">
                {content.featuredSchemeSectionSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-7 relative min-h-[340px] rounded-md overflow-hidden border border-slate-200 bg-slate-900">
                <ResilientImage
                  src={featuredScheme.heroImage}
                  alt={featuredScheme.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111E]/90 via-[#07111E]/25 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white">
                  <p className="text-xs text-[#D4AF37] font-medium">{featuredScheme.approvalStatus}</p>
                  <h3 className="mt-1 font-display text-3xl font-semibold">{featuredScheme.name}</h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span>{featuredScheme.location}</span>
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-200 rounded-md p-6 sm:p-8">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-[#0B192C]">
                    Available Plot Categories &amp; Entry Valuations
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Verified transfer &amp; installment categories managed by Al Amaan scheme advisors.
                  </p>

                  <div className="mt-5 divide-y divide-slate-100">
                    {featuredScheme.plotCategories.slice(0, 5).map((cat) => (
                      <div key={cat.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{cat.size}</p>
                          <p className="text-xs text-slate-500">
                            {cat.category}
                            {cat.installmentAvailable ? ' · Installment & Cash' : ' · Ready Possession'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono-num text-sm font-semibold text-[#0B192C]">
                            From {formatPKRCompact(cat.startingPrice, currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/schemes/${featuredScheme.slug}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] transition-colors whitespace-nowrap"
                  >
                    <span>Explore {featuredScheme.name} &amp; Plots</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/schemes"
                    className="px-4 py-3 text-xs font-semibold text-[#0B192C] border border-slate-300 rounded hover:border-[#0B192C] transition-colors whitespace-nowrap"
                  >
                    All Societies ({data.schemes.length})
                  </Link>
                </div>
              </div>
            </div>

            {/* Dynamic Portfolio of All Published Housing Societies & Projects */}
            <div className="mt-14 pt-12 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[#9F7A31]">
                    Agency Project Portfolio · {data.schemes.length} Published {data.schemes.length === 1 ? 'Society' : 'Societies'}
                  </p>
                  <h3 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                    Housing Societies &amp; Development Projects
                  </h3>
                </div>
                <Link
                  to="/schemes"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B192C] hover:text-[#9F7A31] whitespace-nowrap"
                >
                  <span>View Complete Societies Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.schemes.map((scheme) => {
                  const societyPlots = data.properties.filter((p) => p.schemeId === scheme.id);
                  const availableSocietyPlots = societyPlots.filter((p) => p.status === 'Available').length;
                  const lowestPlotPrice = scheme.plotCategories.length
                    ? Math.min(...scheme.plotCategories.map((c) => c.startingPrice))
                    : 0;

                  return (
                    <article
                      key={scheme.id}
                      className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col justify-between hover:border-[#B89146] transition-colors"
                    >
                      <div>
                        <Link to={`/schemes/${scheme.slug}`} className="block relative aspect-[16/10] bg-slate-900 overflow-hidden">
                          <ResilientImage
                            src={scheme.heroImage}
                            alt={scheme.name}
                            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                          />
                        </Link>
                        <div className="p-5 space-y-2.5">
                          <p className="text-[11px] text-slate-500">
                            {scheme.featured ? (
                              <span className="font-semibold text-[#9F7A31]">Featured Flagship · </span>
                            ) : null}
                            {scheme.approvalStatus} · {scheme.city}
                          </p>
                          <Link to={`/schemes/${scheme.slug}`}>
                            <h4 className="font-display text-2xl font-semibold text-[#0B192C] hover:text-[#9F7A31] transition-colors">
                              {scheme.name}
                            </h4>
                          </Link>
                          <p className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-[#9F7A31] shrink-0" />
                            <span className="line-clamp-1">{scheme.location}</span>
                          </p>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 pt-1">
                            {scheme.tagline || scheme.description}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 text-xs">
                        <div className="font-mono-num text-slate-600">
                          <span className="font-semibold text-[#0B192C]">{societyPlots.length}</span>{' '}
                          {societyPlots.length === 1 ? 'Listing' : 'Listings'} ({availableSocietyPlots} Avail.)
                          {lowestPlotPrice > 0 && (
                            <span className="block text-[11px] text-slate-500">
                              From {formatPKRCompact(lowestPlotPrice, currency)}
                            </span>
                          )}
                        </div>
                        <Link
                          to={`/schemes/${scheme.slug}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] transition-colors whitespace-nowrap"
                        >
                          <span>View Plots</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Latest Verified Properties & Available Plots */}
      <section id="homepage-properties" className="py-20 lg:py-24 bg-white">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col gap-6 mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-xl">
                <p className="text-xs font-semibold tracking-wide text-[#9F7A31]">
                  Direct Inventory · Society-Wise Plots &amp; Homes
                </p>
                <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B192C] [text-wrap:balance]">
                  Plots &amp; Properties Inside Our Societies
                </h2>
              </div>

              {/* Interactive Category Segmented Filter Controls */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-md self-start">
                {['All', 'Available', 'Residential Plot', 'Commercial Plot', 'Luxury Residence'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveCategory(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                      activeCategory === tab
                        ? 'bg-[#0B192C] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Housing Society Filter Bar */}
            {data.schemes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500 mr-1">Filter by Society:</span>
                <button
                  type="button"
                  onClick={() => setActiveSchemeId('All')}
                  className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                    activeSchemeId === 'All'
                      ? 'bg-[#B89146] border-[#B89146] text-[#0B192C] font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  All Societies ({data.properties.length})
                </button>
                {data.schemes.map((scheme) => {
                  const count = data.properties.filter((p) => p.schemeId === scheme.id).length;
                  return (
                    <button
                      key={scheme.id}
                      type="button"
                      onClick={() => setActiveSchemeId(scheme.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                        activeSchemeId === scheme.id
                          ? 'bg-[#B89146] border-[#B89146] text-[#0B192C] font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {scheme.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {filteredProperties.length === 0 ? (
            <div className="py-16 text-center border border-slate-200 rounded-md">
              <p className="text-sm text-slate-600">No properties match the selected society or category filter right now.</p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('All');
                  setActiveSchemeId('All');
                }}
                className="mt-3 px-4 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded"
              >
                Show All Listings
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold border border-[#0B192C] text-[#0B192C] rounded hover:bg-[#0B192C] hover:text-white transition-colors"
            >
              <span>Browse Complete Property Registry ({data.properties.length} Listings)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Why Choose Al Amaan Section */}
      <section className="py-20 lg:py-24 bg-[#0B192C] text-white">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
                Institutional Due Diligence
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight [text-wrap:balance]">
                {content.whyChooseHeading}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {content.whyChooseSummary}
              </p>
              <div className="pt-3">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37] hover:underline"
                >
                  <span>Read Our Corporate Profile &amp; Governance Standards</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {content.whyChooseItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-6 rounded-md bg-white/[0.04] border border-white/10 space-y-2.5"
                >
                  <span className="font-mono-num text-xs text-[#D4AF37]">
                    0{idx + 1}.
                  </span>
                  <h3 className="font-display text-xl font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Our Services Section (Editorial Numbered Structure) */}
      <section className="py-20 lg:py-24 bg-white border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-[#9F7A31]">Advisory &amp; Turnkey Execution</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B192C] [text-wrap:balance]">
                {content.servicesHeading}
              </h2>
              <p className="mt-3 text-base text-slate-600 leading-relaxed">{content.servicesSummary}</p>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B192C] hover:text-[#9F7A31] whitespace-nowrap"
            >
              <span>View Detailed Service Scope</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
            {content.servicesItems.map((service) => (
              <div
                key={service.id}
                className="py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
              >
                <div className="lg:col-span-5 flex items-baseline gap-4">
                  <span className="font-mono-num text-sm font-semibold text-[#9F7A31] shrink-0">
                    {service.indexLabel}.
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-[#0B192C]">
                    {service.title}
                  </h3>
                </div>
                <div className="lg:col-span-4 text-sm text-slate-600 leading-relaxed">
                  {service.summary}
                </div>
                <div className="lg:col-span-3 space-y-1.5 text-xs text-slate-700">
                  {service.deliverables.map((del, i) => (
                    <p key={i} className="leading-relaxed">
                      — {del}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Attributable Client Testimonials & Conversion Callout */}
      <section className="py-20 lg:py-24 bg-[#F8FAFC]">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold tracking-wide text-[#9F7A31]">Client Outcomes</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B192C] [text-wrap:balance]">
              Trusted by Lahore Homeowners &amp; Overseas Investors
            </h2>
          </div>

          {testimonials.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {testimonials.map((item) => (
                <blockquote
                  key={item.id}
                  className="flex flex-col justify-between bg-white border border-slate-200 rounded-md p-6 sm:p-7"
                >
                  <p className="text-sm text-slate-700 leading-relaxed">“{item.quote}”</p>
                  <footer className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-sm font-semibold text-[#0B192C]">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.role} · {item.location}
                    </p>
                    <p className="text-[11px] text-[#9F7A31] font-medium mt-1">
                      {item.investmentContext}
                    </p>
                  </footer>
                </blockquote>
              ))}
            </div>
          )}

          {/* Direct Consultation Conversion Band */}
          <div className="bg-[#0B192C] text-white rounded-md p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl space-y-2.5">
              <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
                Main Boulevard Head Office · Al Jalil Garden
              </p>
              <h3 className="font-display text-2xl sm:text-3xl font-semibold [text-wrap:balance]">
                Ready to Inspect On-Ground Plots or Verify a Housing File?
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Speak directly with our senior transfer and investment advisors in Lahore for live block rates, NDC checks, and guided society tours.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3.5 shrink-0">
              <a
                href={whatsappConsultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3.5 text-xs font-semibold bg-[#25D366] text-white rounded hover:bg-[#1ebe5d] transition-colors whitespace-nowrap"
              >
                <WhatsAppLogo className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-3.5 text-xs font-semibold bg-[#B89146] text-[#0B192C] rounded hover:bg-[#cfa95e] transition-colors whitespace-nowrap"
              >
                <span>Schedule Office Visit</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
