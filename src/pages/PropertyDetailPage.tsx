import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Heart, MapPin, Phone } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useSite } from '../context/SiteContext';
import type { PropertyItem } from '../types/models';
import { DynamicSEO } from '../components/DynamicSEO';
import { ResilientImage } from '../components/ResilientImage';
import { InquiryFormCard } from '../components/InquiryFormCard';
import { WhatsAppLogo } from '../components/WhatsAppIcon';
import { buildWhatsAppUrl, formatDisplayDate, formatPKR, formatPKRCompact } from '../utils/formatters';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, customer, toggleFavoriteProperty } = useSite();

  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favBusy, setFavBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    apiRequest<{ property: PropertyItem }>(`/api/public/properties/${id}`)
      .then((res) => {
        if (!active) return;
        setProperty(res.property);
        setActiveImage(res.property.images[0] || '');
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Property not found.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, data]);

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 space-y-6">
        <div className="h-96 bg-slate-100 rounded animate-pulse" />
        <div className="h-64 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24 text-center space-y-4">
        <h1 className="font-display text-3xl font-semibold text-[#0B192C]">Property Listing Not Found</h1>
        <p className="text-sm text-slate-600">{error || 'This listing may have been removed.'}</p>
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Properties</span>
        </Link>
      </div>
    );
  }

  const currency = data?.settings.currency || 'PKR';
  const isSaved = Boolean(customer?.favoritePropertyIds.includes(property.id));

  const statusTone =
    property.status === 'Available'
      ? 'text-emerald-700 font-semibold'
      : property.status === 'Reserved'
        ? 'text-amber-700 font-semibold'
        : 'text-rose-700 font-semibold';

  const whatsappMessage = `Assalam-o-Alaikum ${
    data?.settings.siteName || 'Al Amaan Real Estate & Developers'
  }, I am inquiring about "${property.title}" (Reference: ${property.referenceCode}, Size: ${
    property.size
  }, Price: ${formatPKR(property.price, currency)}) located at ${property.location}. Please share verification and visit details.`;

  const whatsappUrl = buildWhatsAppUrl(data?.contact.whatsappNumber || '923008459920', whatsappMessage);

  const handleToggleFav = async () => {
    if (!customer) {
      navigate(`/login?redirect=/properties/${property.id}`);
      return;
    }
    if (favBusy) return;
    try {
      setFavBusy(true);
      await toggleFavoriteProperty(property.id);
    } finally {
      setFavBusy(false);
    }
  };

  return (
    <div className="bg-white">
      <DynamicSEO
        customTitle={`${property.title} (${formatPKRCompact(property.price, currency)}) | ${data?.settings.siteName || 'Al Amaan'}`}
        customDescription={property.description.slice(0, 155)}
        customImage={property.images[0]}
      />

      {/* Breadcrumb Bar */}
      <div className="bg-[#F8FAFC] border-b border-slate-200 py-4">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/properties" className="hover:text-[#0B192C] font-medium">
              All Properties
            </Link>
            {property.schemeSlug && property.schemeName && (
              <>
                <span aria-hidden="true">/</span>
                <Link to={`/schemes/${property.schemeSlug}`} className="hover:text-[#0B192C] font-medium">
                  {property.schemeName}
                </Link>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-mono-num">{property.referenceCode}</span>
          </div>

          <button
            type="button"
            onClick={handleToggleFav}
            disabled={favBusy}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B192C] hover:text-[#9F7A31]"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#B89146] text-[#B89146]' : ''}`} />
            <span>{isSaved ? 'Saved in Your Portfolio' : 'Save to Favorites'}</span>
          </button>
        </div>
      </div>

      <section className="py-10 lg:py-14">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Gallery & Details */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-3">
              {/* Unboxed Metadata Line */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-800">{property.category}</span>
                <span aria-hidden="true">·</span>
                <span>{property.size}</span>
                <span aria-hidden="true">·</span>
                <span className={statusTone}>{property.status}</span>
                <span aria-hidden="true">·</span>
                <span>{property.possessionReady ? 'Immediate Possession' : 'Allocation / File'}</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#0B192C] leading-tight">
                {property.title}
              </h1>

              <p className="flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-[#9F7A31] shrink-0" />
                <span>
                  {property.location}, {property.city}
                </span>
              </p>
            </div>

            {/* Gallery */}
            <div className="space-y-3">
              <div className="aspect-[16/10] rounded-md overflow-hidden border border-slate-200 bg-slate-900">
                <ResilientImage
                  src={activeImage || property.images[0]}
                  alt={property.title}
                  priority
                  className="w-full h-full object-cover"
                />
              </div>

              {property.images.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={`aspect-[4/3] rounded overflow-hidden border-2 ${
                        activeImage === img ? 'border-[#B89146]' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <ResilientImage src={img} alt={`${property.title} photo ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key Specifications Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-[#F8FAFC] border border-slate-200 rounded-md">
              <div>
                <p className="text-[11px] text-slate-500">Plot / Area Size</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{property.size}</p>
                <p className="font-mono-num text-[11px] text-slate-500">{property.areaSqFt.toLocaleString()} sq. ft.</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Housing Scheme</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {property.schemeSlug ? (
                    <Link to={`/schemes/${property.schemeSlug}`} className="hover:text-[#9F7A31] underline">
                      {property.schemeName}
                    </Link>
                  ) : (
                    property.schemeName || property.city
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Reference Code</p>
                <p className="mt-0.5 font-mono-num text-sm font-semibold text-slate-900">
                  {property.referenceCode}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Listing Updated</p>
                <p className="mt-0.5 font-mono-num text-sm font-semibold text-slate-900">
                  {formatDisplayDate(property.updatedAt)}
                </p>
              </div>
              {property.bedrooms !== undefined && (
                <div>
                  <p className="text-[11px] text-slate-500">Bedrooms</p>
                  <p className="mt-0.5 font-mono-num text-sm font-semibold text-slate-900">{property.bedrooms}</p>
                </div>
              )}
              {property.bathrooms !== undefined && (
                <div>
                  <p className="text-[11px] text-slate-500">Bathrooms</p>
                  <p className="mt-0.5 font-mono-num text-sm font-semibold text-slate-900">{property.bathrooms}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
                Property Description &amp; Verification Notes
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </div>

            {/* Features */}
            {property.features.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
                  Key Property Highlights
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.features.map((feat, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3.5 border border-slate-200 rounded text-xs sm:text-sm text-slate-800"
                    >
                      <Check className="w-4 h-4 text-[#9F7A31] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Price Summary, Pre-Filled WhatsApp & Direct Form */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-[#0B192C] text-white rounded-md p-6 sm:p-7 space-y-5">
              <div>
                <p className="text-xs text-slate-300">Asking Valuation ({currency})</p>
                <p className="mt-1 font-mono-num text-3xl font-semibold text-[#D4AF37]">
                  {formatPKRCompact(property.price, currency)}
                </p>
                <p className="font-mono-num text-xs text-slate-300 mt-0.5">
                  {formatPKR(property.price, currency)}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-semibold bg-[#25D366] text-white rounded hover:bg-[#1ebe5d] transition-colors"
                >
                  <WhatsAppLogo className="w-4 h-4" />
                  <span>Inquire on WhatsApp</span>
                </a>

                <a
                  href={`tel:${data?.contact.primaryPhone || ''}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold border border-white/25 text-white rounded hover:bg-white/10 transition-colors font-mono-num"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Call {data?.contact.primaryPhone}</span>
                </a>
              </div>
            </div>

            <InquiryFormCard
              heading="Schedule Inspection or Offer"
              subtext={`Reference ${property.referenceCode} will be attached automatically to your inquiry.`}
              defaultSubject={`Property Inquiry — ${property.title} (${property.referenceCode})`}
              propertyId={property.id}
              schemeId={property.schemeId}
              plotSizes={[property.size]}
            />
          </aside>
        </div>
      </section>
    </div>
  );
};
