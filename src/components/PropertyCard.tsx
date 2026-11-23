import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Heart } from 'lucide-react';
import type { PropertyItem } from '../types/models';
import { useSite } from '../context/SiteContext';
import { ResilientImage } from './ResilientImage';
import { WhatsAppLogo } from './WhatsAppIcon';
import { buildWhatsAppUrl, formatPKR, formatPKRCompact } from '../utils/formatters';

interface PropertyCardProps {
  property: PropertyItem;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const { data, customer, toggleFavoriteProperty } = useSite();
  const navigate = useNavigate();
  const [savingFav, setSavingFav] = useState(false);

  const isSaved = Boolean(customer?.favoritePropertyIds.includes(property.id));
  const currency = data?.settings.currency || 'PKR';

  const statusTone =
    property.status === 'Available'
      ? 'text-emerald-700 font-semibold'
      : property.status === 'Reserved'
        ? 'text-amber-700 font-semibold'
        : 'text-rose-700 font-semibold';

  const whatsappMessage = `Assalam-o-Alaikum ${
    data?.settings.siteName || 'Al Amaan Real Estate'
  }, I am interested in "${property.title}" (Ref: ${property.referenceCode}, Size: ${
    property.size
  }, Listed at ${formatPKR(property.price, currency)}) in ${
    property.schemeName || property.location
  }. Please share details.`;

  const whatsappUrl = buildWhatsAppUrl(data?.contact.whatsappNumber || '923008459920', whatsappMessage);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!customer) {
      navigate(`/login?redirect=/properties/${property.id}`);
      return;
    }
    if (savingFav) return;
    try {
      setSavingFav(true);
      await toggleFavoriteProperty(property.id);
    } finally {
      setSavingFav(false);
    }
  };

  return (
    <article className="group flex flex-col bg-white border border-slate-200 rounded-md overflow-hidden transition-colors duration-150 hover:border-[#B89146]">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <Link to={`/properties/${property.id}`} className="block w-full h-full">
          <ResilientImage
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </Link>
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={savingFav}
          aria-label={isSaved ? 'Remove property from saved favorites' : 'Save property to favorites'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 ${
            isSaved
              ? 'bg-[#0B192C] text-[#D4AF37]'
              : 'bg-white/90 text-slate-700 hover:bg-[#0B192C] hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex-1 flex flex-col p-4 sm:p-6 min-w-0">
        {/* Zero-Pill Unboxed Metadata Row */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-2">
          <span className="text-slate-700 font-medium">{property.schemeName || property.city}</span>
          <span aria-hidden="true">·</span>
          <span>{property.size}</span>
          <span aria-hidden="true">·</span>
          <span>{property.category}</span>
          <span aria-hidden="true">·</span>
          <span className={statusTone}>{property.status}</span>
        </div>

        <Link to={`/properties/${property.id}`} className="block group-hover:text-[#0B192C] min-w-0">
          <h3 className="font-display text-xl font-semibold text-slate-900 leading-snug line-clamp-2">
            {property.title}
          </h3>
        </Link>

        <p className="mt-1.5 text-xs text-slate-500 truncate">{property.location}</p>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <p className="font-mono-num text-base font-semibold text-[#0B192C] truncate">
              {formatPKRCompact(property.price, currency)}
            </p>
            <p className="font-mono-num text-[11px] text-slate-500 truncate">
              {formatPKR(property.price, currency)}
            </p>
          </div>
          <span className="font-mono-num text-[11px] text-slate-400 shrink-0">{property.referenceCode}</span>
        </div>

        <div className="mt-4 flex items-center gap-2 pt-1 min-w-0">
          <Link
            to={`/properties/${property.id}`}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] transition-colors whitespace-nowrap"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Inquire on WhatsApp about ${property.title}`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold border border-slate-200 text-slate-800 rounded hover:border-[#25D366] hover:text-[#15803d] transition-colors whitespace-nowrap shrink-0"
          >
            <WhatsAppLogo className="w-4 h-4 text-[#25D366]" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
};
