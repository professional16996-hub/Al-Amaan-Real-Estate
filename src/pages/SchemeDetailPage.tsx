import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Check, ExternalLink, Layers, Mail, MapPin, Phone } from 'lucide-react';
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
  const slug = forcedSlug || params.slug || '';
  const { data } = useSite();

  const [scheme, setScheme] = useState<HousingScheme | null>(null);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Project slug missing.');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    setScheme(null);
    setProperties([]);
    setActiveImage('');

    apiRequest<{ scheme: HousingScheme; properties: PropertyItem[] }>(`/api/public/schemes/${slug}`)
      .then((res) => {
        if (!active) return;
        setScheme(res.scheme);
        setProperties(res.properties);
        const firstGallery = (res.scheme.gallery || []).filter(Boolean);
        setActiveImage(res.scheme.heroImage || firstGallery[0] || '');
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Project not found.');
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
        <h1 className="font-display text-3xl font-semibold text-[#0B192C]">Project Unavailable</h1>
        <p className="text-sm text-slate-600">{error || 'This project could not be found.'}</p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Projects</span>
        </Link>
      </div>
    );
  }

  const currency = data?.settings.currency || 'PKR';
  // Strictly isolate images belonging only to this specific project
  const galleryImages = Array.from(
    new Set([...(scheme.gallery || []), scheme.heroImage].filter(Boolean))
  );
  const paymentPlans = scheme.paymentPlans || [];
  const developmentUpdates = scheme.developmentUpdates || [];
  const whatsappTarget = scheme.whatsappNumber || scheme.contactPhone || data?.contact.whatsappNumber || '';
  const whatsappUrl = buildWhatsAppUrl(
    whatsappTarget,
    `Assalam-o-Alaikum ${data?.settings.siteName || 'Al Amaan Real Estate'}, I am interested in payment plans, plot availability, and project details for ${scheme.name} (${scheme.location}).`
  );

  return (
    <div className="bg-white">
      <DynamicSEO
        customTitle={`${scheme.name} — Payment Plans, Updates & Plots | ${data?.settings.siteName || 'Al Amaan'}`}
        customDescription={scheme.tagline || scheme.description}
        customImage={scheme.heroImage}
      />

      {/* Project Hero Banner */}
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
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mb-4">
            <Link to="/projects" className="hover:text-[#D4AF37]">
              All Projects
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#D4AF37]">{scheme.name}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {scheme.projectLogo ? (
              <div className="inline-flex bg-white p-2.5 rounded-md border border-white/20 shadow-lg shrink-0 self-start">
                <img
                  src={scheme.projectLogo}
                  alt={`${scheme.name} official logo`}
                  className="h-14 sm:h-16 w-auto max-w-[180px] object-contain"
                />
              </div>
            ) : null}

            <div>
              <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white [text-wrap:balance]">
                {scheme.name}
              </h1>
              <p className="mt-2 text-base sm:text-lg text-slate-200 max-w-2xl">{scheme.tagline}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span className="text-[#D4AF37] font-semibold">{scheme.status || 'Ongoing'} Project</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {scheme.location}
                </span>
                <span aria-hidden="true">·</span>
                <span>{scheme.approvalStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Independent Project Body */}
      <section className="py-16">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-14">
            {/* Project Description & Key Features */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                Project Overview &amp; Features
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

            {/* Dedicated Payment Plans */}
            {paymentPlans.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#9F7A31]" />
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                    Official Payment Plans ({currency})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="p-5 bg-[#F8FAFC] border border-slate-200 rounded-md flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
                          <div>
                            <p className="text-[11px] font-semibold text-[#9F7A31]">{plan.plotSize}</p>
                            <h3 className="font-display text-xl font-semibold text-[#0B192C]">
                              {plan.planName}
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-slate-500">Total Price</p>
                            <p className="font-mono-num text-base font-semibold text-[#0B192C]">
                              {formatPKRCompact(plan.totalPrice, currency)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-slate-500">Booking / Down Payment</p>
                            <p className="font-mono-num font-semibold text-slate-900 mt-0.5">
                              {formatPKR(plan.downPayment, currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Monthly Installment</p>
                            <p className="font-mono-num font-semibold text-slate-900 mt-0.5">
                              {plan.monthlyInstallment > 0
                                ? formatPKR(plan.monthlyInstallment, currency)
                                : 'Outright Cash'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Installment Tenure</p>
                            <p className="font-medium text-slate-800 mt-0.5">{plan.installmentDuration}</p>
                          </div>
                          {plan.possessionCharges ? (
                            <div>
                              <p className="text-slate-500">Possession Terms</p>
                              <p className="font-medium text-slate-800 mt-0.5">{plan.possessionCharges}</p>
                            </div>
                          ) : null}
                        </div>

                        {plan.notes ? (
                          <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200/70">
                            {plan.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Multi-Image Project Gallery (Strictly Isolated to This Project) */}
            {galleryImages.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                  {scheme.name} Photo Gallery
                </h2>
                <div className="aspect-[16/9] rounded-md overflow-hidden border border-slate-200 bg-slate-900">
                  <ResilientImage
                    src={activeImage || galleryImages[0]}
                    alt={`${scheme.name} gallery highlight`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {galleryImages.map((img, i) => (
                      <button
                        key={`${img}-${i}`}
                        type="button"
                        onClick={() => setActiveImage(img)}
                        className={`aspect-[4/3] rounded overflow-hidden border-2 transition-colors ${
                          activeImage === img ? 'border-[#B89146]' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <ResilientImage src={img} alt={`${scheme.name} photo ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Development Updates */}
            {developmentUpdates.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#9F7A31]" />
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                    On-Site Development Updates
                  </h2>
                </div>
                <div className="space-y-4">
                  {developmentUpdates.map((upd) => (
                    <div
                      key={upd.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-5 p-5 bg-slate-50 border border-slate-200 rounded-md"
                    >
                      {upd.image ? (
                        <div className="sm:col-span-4 aspect-[4/3] rounded overflow-hidden border border-slate-200 bg-slate-900">
                          <ResilientImage
                            src={upd.image}
                            alt={upd.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                      <div className={`${upd.image ? 'sm:col-span-8' : 'sm:col-span-12'} space-y-2`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-[#9F7A31]">{upd.phase}</span>
                          <span className="font-mono-num">{upd.date}</span>
                        </div>
                        <h3 className="font-display text-xl font-semibold text-[#0B192C]">{upd.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{upd.summary}</p>
                        {upd.progressPercent !== undefined && (
                          <div className="pt-1 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-600">
                              <span>Completion Progress</span>
                              <span className="font-semibold text-[#0B192C]">{upd.progressPercent}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#B89146] rounded-full transition-all"
                                style={{ width: `${upd.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Facilities */}
            {scheme.facilities.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                  Available Facilities &amp; Infrastructure
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
                    Project Location &amp; Google Maps
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

          {/* Right Sidebar: Dedicated Project Contact Desk & Inquiry Form */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#0B192C] text-white rounded-md p-6 space-y-4">
              <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
                Project Contact Desk
              </p>
              <h3 className="font-display text-2xl font-semibold">{scheme.contactPerson}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct plot verification, official payment plans, and guided site visits for {scheme.name}.
              </p>

              <div className="pt-2 space-y-2 text-xs">
                <a
                  href={`tel:${scheme.contactPhone}`}
                  className="flex items-center gap-2 font-mono-num text-white hover:text-[#D4AF37]"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{scheme.contactPhone}</span>
                </a>
                {scheme.contactEmail && (
                  <a
                    href={`mailto:${scheme.contactEmail}`}
                    className="flex items-center gap-2 text-slate-200 hover:text-[#D4AF37] break-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                    <span>{scheme.contactEmail}</span>
                  </a>
                )}
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
              defaultSubject={`Project Inquiry — ${scheme.name}`}
              schemeId={scheme.id}
              plotSizes={scheme.plotCategories.map((c) => c.size)}
            />
          </aside>
        </div>
      </section>

      {/* Available Properties inside this Project */}
      <section className="py-16 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#9F7A31]">Project Inventory</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-[#0B192C]">
                Available Plots &amp; Properties in {scheme.name}
              </h2>
            </div>
            <Link
              to={`/properties?scheme=${scheme.id}`}
              className="text-xs font-semibold text-[#0B192C] hover:underline"
            >
              View All Project Listings
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
              <p className="text-sm text-slate-600">
                Contact our {scheme.name} desk directly for latest available plot allocations and files.
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
