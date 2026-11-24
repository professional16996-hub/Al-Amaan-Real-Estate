import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Mail, MapPin, Phone, Clock } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { DynamicSEO } from '../components/DynamicSEO';
import { ResilientImage } from '../components/ResilientImage';
import { InquiryFormCard } from '../components/InquiryFormCard';
import { WhatsAppLogo } from '../components/WhatsAppIcon';
import { buildWhatsAppUrl } from '../utils/formatters';

const PageFallbackState: React.FC = () => {
  const { loading, error, refreshPublicData } = useSite();
  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-20 space-y-6">
        <div className="h-40 bg-slate-100 rounded animate-pulse" />
        <div className="h-72 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }
  return (
    <div className="max-w-[720px] mx-auto px-5 py-20 text-center space-y-4">
      <h1 className="font-display text-3xl font-semibold text-[#0B192C]">Al Amaan Real Estate &amp; Developers</h1>
      <p className="text-sm text-slate-600">{error || 'Unable to load page information right now.'}</p>
      <button
        type="button"
        onClick={() => void refreshPublicData()}
        className="px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
      >
        Retry
      </button>
    </div>
  );
};

export const AboutPage: React.FC = () => {
  const { data } = useSite();
  if (!data) return <PageFallbackState />;
  const { content, settings } = data;

  return (
    <div className="bg-white">
      <DynamicSEO pageKey="about" />

      <section className="bg-[#0B192C] text-white py-16 lg:py-20 border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
            Corporate Profile · {settings.siteName}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold max-w-3xl leading-tight [text-wrap:balance]">
            {content.aboutHeadline}
          </h1>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-display text-3xl font-semibold text-[#0B192C]">Our Heritage &amp; Mandate</h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {content.aboutStory}
            </p>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-md space-y-2">
                <p className="text-xs font-semibold text-[#9F7A31]">Our Mission</p>
                <p className="text-sm text-slate-700 leading-relaxed">{content.aboutMission}</p>
              </div>
              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-md space-y-2">
                <p className="text-xs font-semibold text-[#9F7A31]">Our Vision</p>
                <p className="text-sm text-slate-700 leading-relaxed">{content.aboutVision}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 min-h-[340px] rounded-md overflow-hidden border border-slate-200 bg-slate-900">
            <ResilientImage
              src={content.aboutImage}
              alt={`${settings.siteName} Executive Lounge`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Track Record Metrics */}
      <section className="py-14 bg-[#0B192C] text-white">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {content.statistics.map((st) => (
            <div key={st.id}>
              <p className="font-mono-num text-3xl font-semibold text-[#D4AF37]">{st.value}</p>
              <p className="mt-1 text-sm font-semibold text-white">{st.label}</p>
              <p className="mt-1 text-xs text-slate-400">{st.context}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Governance & Standards */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC]">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-3xl font-semibold text-[#0B192C]">
              {content.whyChooseHeading}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">{content.whyChooseSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.whyChooseItems.map((item, idx) => (
              <div key={item.id} className="p-7 bg-white border border-slate-200 rounded-md space-y-2">
                <span className="font-mono-num text-xs font-semibold text-[#9F7A31]">0{idx + 1}.</span>
                <h3 className="font-display text-2xl font-semibold text-[#0B192C]">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/schemes"
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742]"
            >
              <span>Explore Approved Housing Schemes</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold border border-slate-300 text-slate-800 rounded hover:border-[#0B192C]"
            >
              <span>Meet Our Advisory Team</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export const ServicesPage: React.FC = () => {
  const { data } = useSite();
  if (!data) return <PageFallbackState />;
  const { content, settings } = data;

  return (
    <div className="bg-white">
      <DynamicSEO pageKey="services" />

      <section className="bg-[#0B192C] text-white py-16 lg:py-20 border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
            Real Estate &amp; Construction Capabilities
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold max-w-3xl [text-wrap:balance]">
            {content.servicesHeading}
          </h1>
          <p className="mt-3 text-base text-slate-300 max-w-2xl leading-relaxed">
            {content.servicesSummary}
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 divide-y divide-slate-200 border-t border-b border-slate-200">
            {content.servicesItems.map((srv) => (
              <div key={srv.id} className="py-9 space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono-num text-sm font-semibold text-[#9F7A31]">{srv.indexLabel}.</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#0B192C]">
                    {srv.title}
                  </h2>
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{srv.summary}</p>
                <div className="pt-2 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-800">Key Client Deliverables:</p>
                  {srv.deliverables.map((del, idx) => (
                    <p key={idx} className="text-xs sm:text-sm text-slate-600">
                      — {del}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <InquiryFormCard
              heading="Request Advisory Consultation"
              subtext={`Connect with ${settings.siteName} for plot transfers, file verification, or turnkey construction quotes in PKR.`}
              defaultSubject="Advisory & Construction Service Inquiry"
              plotSizes={[
                'Plot Acquisition / Sale',
                'NDC & File Verification',
                'Turnkey House Construction',
                'Commercial Investment',
                'Overseas Client Representation',
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { data } = useSite();
  if (!data) return <PageFallbackState />;
  const { contact, settings, social } = data;

  const whatsappUrl = buildWhatsAppUrl(
    contact.whatsappNumber,
    `Assalam-o-Alaikum ${settings.siteName}, I would like to connect with your Lahore head office.`
  );

  return (
    <div className="bg-white">
      <DynamicSEO pageKey="contact" />

      <section className="bg-[#0B192C] text-white py-16 lg:py-20 border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <p className="text-xs font-semibold tracking-wide text-[#D4AF37]">
            Direct Advisory · Lahore Head Office
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold">
            Contact {settings.siteName}
          </h1>
          <p className="mt-3 text-base text-slate-300 max-w-2xl leading-relaxed">
            Visit our Main Boulevard commercial office in Al Jalil Garden or message our transfer and property specialists directly.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-6">
              <div className="p-6 bg-[#F8FAFC] border border-slate-200 rounded-md space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#9F7A31] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-semibold text-[#0B192C]">Head Office Address</h2>
                    <p className="mt-1 text-sm text-slate-700 leading-relaxed">{contact.officeAddress}</p>
                    {contact.googleMapsUrl && (
                      <a
                        href={contact.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#9F7A31] hover:underline"
                      >
                        <span>Get Directions on Google Maps</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#9F7A31] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-semibold text-[#0B192C]">Direct Telephone Lines</h2>
                    <p className="mt-1 font-mono-num text-sm text-slate-800">
                      <a href={`tel:${contact.primaryPhone}`} className="hover:underline">
                        {contact.primaryPhone}
                      </a>
                    </p>
                    {contact.secondaryPhone && (
                      <p className="font-mono-num text-sm text-slate-600 mt-0.5">
                        <a href={`tel:${contact.secondaryPhone}`} className="hover:underline">
                          {contact.secondaryPhone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#9F7A31] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-semibold text-[#0B192C]">Official Email Correspondence</h2>
                    <p className="mt-1 text-sm text-slate-700">
                      <a href={`mailto:${contact.email}`} className="hover:underline">
                        {contact.email}
                      </a>
                    </p>
                    {contact.supportEmail && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Transfers &amp; Records: {contact.supportEmail}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#9F7A31] shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-semibold text-[#0B192C]">Visiting Hours</h2>
                    <p className="mt-1 text-sm text-slate-700">{contact.officeHours}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold bg-[#25D366] text-white rounded hover:bg-[#1ebe5d] transition-colors"
                >
                  <WhatsAppLogo className="w-4 h-4" />
                  <span>Start Instant WhatsApp Chat</span>
                </a>

                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
                  {social.facebook && (
                    <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#0B192C] underline">
                      Facebook
                    </a>
                  )}
                  {social.instagram && (
                    <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#0B192C] underline">
                      Instagram
                    </a>
                  )}
                  {social.youtube && (
                    <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-[#0B192C] underline">
                      YouTube
                    </a>
                  )}
                  {social.tiktok && (
                    <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-[#0B192C] underline">
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            </div>

            {contact.mapEmbedUrl && (
              <div className="aspect-[16/10] rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                <iframe
                  title="Al Amaan Head Office Location"
                  src={contact.mapEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>

          <div className="lg:col-span-6">
            <InquiryFormCard
              heading="Send a Direct Message"
              subtext="Every inquiry is logged in our client registry and assigned to a dedicated Lahore scheme specialist."
              defaultSubject="Head Office Contact Inquiry"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export const LegalPage: React.FC<{ mode: 'privacy' | 'terms' }> = ({ mode }) => {
  const { data } = useSite();
  if (!data) return <PageFallbackState />;

  const isPrivacy = mode === 'privacy';
  const title = isPrivacy ? 'Privacy Policy' : 'Terms & Conditions';
  const body = isPrivacy ? data.content.privacyPolicyContent : data.content.termsConditionsContent;

  return (
    <div className="bg-white">
      <DynamicSEO
        customTitle={`${title} | ${data.settings.siteName}`}
        customDescription={`${title} for ${data.settings.siteName}, Lahore, Pakistan.`}
      />

      <section className="bg-[#0B192C] text-white py-14 border-b border-white/10">
        <div className="max-w-[920px] mx-auto px-5 sm:px-8">
          <p className="text-xs font-semibold text-[#D4AF37]">{data.settings.siteName}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{title}</h1>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[920px] mx-auto px-5 sm:px-8">
          <div className="prose max-w-none text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
            {body}
          </div>
        </div>
      </section>
    </div>
  );
};
