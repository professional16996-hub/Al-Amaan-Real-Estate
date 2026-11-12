import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ExternalLink, MapPin, Phone } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useSite } from '../context/SiteContext';
import type { HousingScheme, PropertyItem } from '../types/models';
import { DynamicSEO } from '../components/DynamicSEO';
import { ResilientImage } from '../components/ResilientImage';
import { PropertyCard } from '../components/PropertyCard';
import { InquiryFormCard } from '../components/InquiryFormCard';
import { WhatsAppLogo } from '../components/WhatsAppIcon';
import { buildWhatsAppUrl, formatPKR, formatPKRCompact } from '../utils/formatters';

export const SchemeDetailPage: React.FC<{ forcedSlug?: string }> = ({ forcedSlug }) => {
  const params = useParams<{ slug: string }>();
  const slug = forcedSlug || params.slug || 'al-jalil-garden';
  const { data } = useSite();

  const [scheme, setScheme] = useState<HousingScheme | null>(null);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    apiRequest<{ scheme: HousingScheme; properties: PropertyItem[] }>(`/api/public/schemes/${slug}`)
      .then((res) => {
        if (!active) return;
        setScheme(res.scheme);
        setProperties(res.properties);
        setActiveImage(res.scheme.heroImage || res.scheme.gallery[0] || '');
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Scheme not found.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, data]);

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 space-y-6">
        <div className="h-96 bg-slate-100 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold text-[#0B192C]">Housing Scheme Unavailable</h1>
        <p className="text-sm text-slate-600">{error || 'This housing scheme could not be found.'}</p>
        <Link
          to="/schemes"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Housing Schemes</span>
        </Link>
      </div>
    );
  }

  const currency = data?.settings.currency || 'PKR';
  const galleryImages = Array.from(new Set([scheme.heroImage, ...scheme.gallery].filter(Boolean)));
  const whatsappUrl = buildWhatsAppUrl(
    data?.contact.whatsappNumber || scheme.contactPhone,
    `Assalam-o-Alaikum ${data?.settings.siteName || 'Al Amaan Real Estate'}, I am interested in plot availability and pricing in ${scheme.name} (${scheme.location}).`
  );

  return (
    <div className="bg-white">
      <DynamicSEO
        customTitle={`${scheme.name} Lahore — Plot Prices, Map & Listings | ${data?.settings.siteName || 'Al Amaan'}`}
        customDescription={scheme.tagline}
        customImage={scheme.heroImage}
      />

      {/* Hero Banner */}
      <section className="relative min-h-[420px] flex items-end bg-[#07111E] text-white">
        <div className="absolute inset-0">
          <ResilientImage
            src={scheme.heroImage}
            alt={scheme.name}
            priority
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07111E] via-[#07111E]/70 to-[#07111E]/30" />
        </div>

        <div className="relative z-10 w-full max-w-[1240px] mx-auto px-5 sm:px-8 pt-20 pb-12">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-3">
            <Link to="/schemes" className="hover:text-[#D4AF37]">
              All Housing Schemes
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#D4AF37]">{scheme.name}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white [text-wrap:balance]">
            {scheme.name}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-slate-200 max-w-2xl">{scheme.tagline}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              {scheme.location}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#D4AF37] font-medium">{scheme.approvalStatus}</span>
          </div>
        </div>
      </section>

      {/* Scheme Body */}
      <section className="py-16">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-12">
            {/* Overview */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                Community Master Overview
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {scheme.description}
              </p>

              {scheme.overviewHighlights.length > 0 && (
                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scheme.overviewHighlights.map((hl, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded">
                      <Check className="w-4 h-4 text-[#9F7A31] shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-700 leading-relaxed">{hl}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plot Categories & Valuations Table */}
            {scheme.plotCategories.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                  Plot Categories &amp; Current Price Schedule ({currency})
                </h2>
                <div className="overflow-x-auto border border-slate-200 rounded-md">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#0B192C] text-white text-xs">
                        <th className="py-3.5 px-4 font-semibold">Plot Size</th>
                        <th className="py-3.5 px-4 font-semibold">Category</th>
                        <th className="py-3.5 px-4 font-semibold">Payment Mode</th>
                        <th className="py-3.5 px-4 font-semibold text-right">Price Range ({currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {scheme.plotCategories.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            {cat.size}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{cat.category}</td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                            {cat.installmentAvailable ? 'Installments & Cash Possession' : 'Outright Possession'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-[#0B192C] whitespace-nowrap">
                            {formatPKRCompact(cat.startingPrice, currency)}
                            {cat.maxPrice ? ` – ${formatPKRCompact(cat.maxPrice, currency)}` : '+'}
                            <div className="text-[11px] font-normal text-slate-500">
                              From {formatPKR(cat.startingPrice, currency)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Multi-Image Gallery */}
            {galleryImages.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                  Architectural &amp; On-Ground Gallery
                </h2>
                <div className="aspect-[16/9] rounded-md overflow-hidden border border-slate-200 bg-slate-900">
                  <ResilientImage
                    src={activeImage || galleryImages[0]}
                    alt={`${scheme.name} view`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImage(img)}
                        className={`aspect-[4/3] rounded overflow-hidden border-2 transition-colors ${
                          activeImage === img ? 'border-[#B89146]' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <ResilientImage src={img} alt={`${scheme.name} gallery ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Society Facilities & Infrastructure */}
            {scheme.facilities.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                  Amenities &amp; Civic Infrastructure
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scheme.facilities.map((fac, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 py-2.5 px-4 border border-slate-200 rounded text-xs sm:text-sm text-slate-800"
                    >
                      <Check className="w-4 h-4 text-[#9F7A31] shrink-0" />
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Map & Google Maps Link */}
            {(scheme.mapEmbedUrl || scheme.googleMapsUrl) && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                    Location Map &amp; Motorway Access
                  </h2>
                  {scheme.googleMapsUrl && (
                    <a
                      href={scheme.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B192C] hover:text-[#9F7A31]"
                    >
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-600">{scheme.location}</p>
                {scheme.mapEmbedUrl && (
                  <div className="aspect-[16/9] w-full rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                    <iframe
                      title={`${scheme.name} Location Map`}
                      src={scheme.mapEmbedUrl}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Scheme Advisor & Inquiry Form */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#0B192C] text-white rounded-md p-6 space-y-4">
              <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
                Dedicated Scheme Desk
              </p>
              <h3 className="font-display text-2xl font-semibold">{scheme.contactPerson}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct plot verification, latest block-wise market rates, and guided site visits in {scheme.name}.
              </p>

              <div className="pt-2 space-y-2 text-xs">
                <a
                  href={`tel:${scheme.contactPhone}`}
                  className="flex items-center gap-2 font-mono-num text-white hover:text-[#D4AF37]"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{scheme.contactPhone}</span>
                </a>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold bg-[#25D366] text-white rounded hover:bg-[#1ebe5d] transition-colors"
              >
                <WhatsAppLogo className="w-4 h-4" />
                <span>Inquire via WhatsApp</span>
              </a>
            </div>

            <InquiryFormCard
              heading={`Inquire About ${scheme.name}`}
              subtext="Request block-wise plot availability, installment schedules, or a weekend site inspection."
              defaultSubject={`Scheme Inquiry — ${scheme.name}`}
              schemeId={scheme.id}
              plotSizes={scheme.plotCategories.map((c) => c.size)}
            />
          </aside>
        </div>
      </section>

      {/* Available Properties inside this Scheme */}
      <section className="py-16 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#9F7A31]">On-Ground Inventory</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-[#0B192C]">
                Available Plots &amp; Properties in {scheme.name}
              </h2>
            </div>
            <Link
              to={`/properties?scheme=${scheme.id}`}
              className="text-xs font-semibold text-[#0B192C] hover:underline"
            >
              View All Listings in Registry
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
              <p className="text-sm text-slate-600">
                Contact our {scheme.name} desk directly for fresh off-market plot allocations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
