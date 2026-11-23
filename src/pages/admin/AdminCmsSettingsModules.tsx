import React, { useEffect, useState } from 'react';
import { Edit3, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useSite } from '../../context/SiteContext';
import { SingleImageField } from '../../components/MobileImagePicker';
import type {
  ContactConfig,
  NavItem,
  PageSEOConfig,
  SiteSettings,
  SocialConfig,
  UserAccount,
  UserRole,
  WebsiteContent,
} from '../../types/models';

// ============================================================================
// E. WEBSITE CONTENT & STATISTICS MANAGEMENT
// ============================================================================

export const WebsiteContentAdminModule: React.FC<{ focusMode?: 'homepage' | 'all' }> = ({
  focusMode = 'all',
}) => {
  const { data, refreshPublicData } = useSite();
  const [form, setForm] = useState<WebsiteContent | null>(data?.content || null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data?.content) setForm(data.content);
  }, [data?.content]);

  if (!form) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    try {
      await apiRequest('/api/admin/content', {
        method: 'PUT',
        scope: 'admin',
        body: form,
      });
      await refreshPublicData();
      setSavedMsg('Website content, homepage banners, and statistics updated live.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
            {focusMode === 'homepage'
              ? 'Manage Homepage Sections & Statistics'
              : 'Website Content, About & Legal CMS'}
          </h2>
          <p className="text-xs text-slate-600">
            {focusMode === 'homepage'
              ? 'Edit homepage hero banner, CTA labels, Featured & More Projects headings, and statistics numbers.'
              : 'Edit homepage copy, About Us story, Services, statistics, and Privacy / Terms pages.'}
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742]"
        >
          {saving ? 'Publishing...' : 'Save & Publish Content'}
        </button>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          {savedMsg}
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
        <h3 className="font-display text-xl font-semibold text-[#0B192C]">Homepage Hero Banner</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Headline</label>
            <input
              type="text"
              value={form.heroHeadline}
              onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>
          <SingleImageField
            label="Hero Aerial Banner Photo"
            value={form.heroImage}
            titleHint="Homepage Hero Banner"
            onChange={(nextUrl) => setForm({ ...form, heroImage: nextUrl })}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Introduction Paragraph</label>
          <textarea
            rows={2}
            value={form.heroIntroduction}
            onChange={(e) => setForm({ ...form, heroIntroduction: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Button Label</label>
            <input
              type="text"
              value={form.heroExplorePropertiesLabel}
              onChange={(e) => setForm({ ...form, heroExplorePropertiesLabel: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Button Label</label>
            <input
              type="text"
              value={form.heroExploreSchemesLabel}
              onChange={(e) => setForm({ ...form, heroExploreSchemesLabel: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Button Label</label>
            <input
              type="text"
              value={form.heroContactLabel}
              onChange={(e) => setForm({ ...form, heroContactLabel: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Editable Statistics Section */}
      <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-[#0B192C]">
            Agency Statistics Numbers (Admin-Editable)
          </h3>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                statistics: [
                  ...form.statistics,
                  { id: `stat_${Date.now()}`, value: '100%', label: 'Verified Transfers', context: 'Lahore' },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B192C]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Metric</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {form.statistics.map((st, idx) => (
            <div key={st.id} className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={st.value}
                  onChange={(e) => {
                    const next = [...form.statistics];
                    next[idx] = { ...next[idx], value: e.target.value };
                    setForm({ ...form, statistics: next });
                  }}
                  placeholder="Value (e.g. 2,650+)"
                  className="w-36 px-2.5 py-1.5 text-sm font-mono-num font-semibold border border-slate-300 rounded bg-white"
                />
                <input
                  type="text"
                  value={st.label}
                  onChange={(e) => {
                    const next = [...form.statistics];
                    next[idx] = { ...next[idx], label: e.target.value };
                    setForm({ ...form, statistics: next });
                  }}
                  placeholder="Label"
                  className="flex-1 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded bg-white"
                />
                {form.statistics.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, statistics: form.statistics.filter((_, i) => i !== idx) })
                    }
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={st.context}
                onChange={(e) => {
                  const next = [...form.statistics];
                  next[idx] = { ...next[idx], context: e.target.value };
                  setForm({ ...form, statistics: next });
                }}
                placeholder="Supporting context"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Featured Project & More Projects Homepage Sections */}
      <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
        <h3 className="font-display text-xl font-semibold text-[#0B192C]">
          Homepage Projects &amp; More Projects Section Headings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Featured Spotlight Kicker
            </label>
            <input
              type="text"
              value={form.featuredSchemeSectionKicker}
              onChange={(e) => setForm({ ...form, featuredSchemeSectionKicker: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Featured Spotlight Heading
            </label>
            <input
              type="text"
              value={form.featuredSchemeSectionHeading}
              onChange={(e) => setForm({ ...form, featuredSchemeSectionHeading: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Featured Spotlight Summary
          </label>
          <textarea
            rows={2}
            value={form.featuredSchemeSectionSummary}
            onChange={(e) => setForm({ ...form, featuredSchemeSectionSummary: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              More Projects Section Heading
            </label>
            <input
              type="text"
              value={form.moreProjectsHeading || ''}
              onChange={(e) => setForm({ ...form, moreProjectsHeading: e.target.value })}
              placeholder="More Projects & Development Portfolio"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              More Projects Section Summary
            </label>
            <input
              type="text"
              value={form.moreProjectsSummary || ''}
              onChange={(e) => setForm({ ...form, moreProjectsSummary: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* About Us & Legal Pages (shown in full CMS mode) */}
      {focusMode !== 'homepage' && (
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
          <h3 className="font-display text-xl font-semibold text-[#0B192C]">About Us &amp; Legal Pages</h3>
          <SingleImageField
            label="About Us Office / Team Photo"
            value={form.aboutImage}
            titleHint="About Us Photo"
            onChange={(nextUrl) => setForm({ ...form, aboutImage: nextUrl })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">About Us Corporate Story</label>
            <textarea
              rows={4}
              value={form.aboutStory}
              onChange={(e) => setForm({ ...form, aboutStory: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Privacy Policy Text</label>
              <textarea
                rows={5}
                value={form.privacyPolicyContent}
                onChange={(e) => setForm({ ...form, privacyPolicyContent: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Terms &amp; Conditions Text</label>
              <textarea
                rows={5}
                value={form.termsConditionsContent}
                onChange={(e) => setForm({ ...form, termsConditionsContent: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

// ============================================================================
// F. CONTACT MANAGEMENT MODULE
// ============================================================================

export const ContactAdminModule: React.FC = () => {
  const { data, refreshPublicData } = useSite();
  const [form, setForm] = useState<ContactConfig | null>(data?.contact || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.contact) setForm(data.contact);
  }, [data?.contact]);

  if (!form) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await apiRequest('/api/admin/contact', { method: 'PUT', scope: 'admin', body: form });
      await refreshPublicData();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-md p-6 space-y-5 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Contact &amp; WhatsApp Configuration</h2>
        <p className="text-xs text-slate-600">
          Changes here immediately update all phone numbers, floating WhatsApp buttons, property WhatsApp links, and maps.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          Contact numbers, WhatsApp configuration, and office map updated across the website.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Phone</label>
          <input
            type="text"
            required
            value={form.primaryPhone}
            onChange={(e) => setForm({ ...form, primaryPhone: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary / Landline</label>
          <input
            type="text"
            value={form.secondaryPhone}
            onChange={(e) => setForm({ ...form, secondaryPhone: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number (Intl Digits)</label>
          <input
            type="text"
            required
            value={form.whatsappNumber}
            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
            placeholder="923008459920"
            className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Support / Transfers Email</label>
          <input
            type="email"
            value={form.supportEmail}
            onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Head Office Address</label>
        <input
          type="text"
          required
          value={form.officeAddress}
          onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Office Visiting Hours</label>
        <input
          type="text"
          value={form.officeHours}
          onChange={(e) => setForm({ ...form, officeHours: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Google Maps Location URL</label>
          <input
            type="url"
            value={form.googleMapsUrl}
            onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Embedded Map iframe URL</label>
          <input
            type="url"
            value={form.mapEmbedUrl}
            onChange={(e) => setForm({ ...form, mapEmbedUrl: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742]"
      >
        {saving ? 'Saving...' : 'Save Contact Information'}
      </button>
    </form>
  );
};

// ============================================================================
// G. SOCIAL MEDIA MANAGEMENT MODULE
// ============================================================================

export const SocialAdminModule: React.FC = () => {
  const { data, refreshPublicData } = useSite();
  const [form, setForm] = useState<SocialConfig | null>(data?.social || null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.social) setForm(data.social);
  }, [data?.social]);

  if (!form) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    await apiRequest('/api/admin/social', { method: 'PUT', scope: 'admin', body: form });
    await refreshPublicData();
    setSaved(true);
  };

  return (
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-md p-6 space-y-4 max-w-2xl">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Social Media Links</h2>
        <p className="text-xs text-slate-600">
          Configure official Facebook, Instagram, TikTok, YouTube, and LinkedIn profiles (leave blank to hide).
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          Social media links updated on footer and contact page.
        </div>
      )}

      {(['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin'] as const).map((platform) => (
        <div key={platform}>
          <label className="block text-xs font-semibold text-slate-700 capitalize mb-1">
            {platform} URL
          </label>
          <input
            type="url"
            value={form[platform]}
            onChange={(e) => setForm({ ...form, [platform]: e.target.value })}
            placeholder={`https://www.${platform}.com/...`}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          />
        </div>
      ))}

      <button type="submit" className="px-6 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded">
        Save Social Links
      </button>
    </form>
  );
};

// ============================================================================
// H. NAVIGATION MANAGEMENT MODULE
// ============================================================================

export const NavigationAdminModule: React.FC = () => {
  const { data, refreshPublicData } = useSite();
  const [items, setItems] = useState<NavItem[]>(data?.navigation || []);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.navigation) setItems(data.navigation);
  }, [data?.navigation]);

  const updateItem = (idx: number, patch: Partial<NavItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    await apiRequest('/api/admin/navigation', {
      method: 'PUT',
      scope: 'admin',
      body: { navigation: items },
    });
    await refreshPublicData();
    setSaved(true);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Navigation &amp; Footer Links</h2>
          <p className="text-xs text-slate-600">
            Manage top navigation bar links, footer portfolio links, and external URLs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setItems([
                ...items,
                {
                  id: `nav_${Date.now()}`,
                  label: 'New Link',
                  path: '/properties',
                  isExternal: false,
                  visible: true,
                  order: items.length + 1,
                  placement: 'header',
                },
              ])
            }
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold border border-slate-300 bg-white rounded"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Menu Item</span>
          </button>
          <button type="submit" className="px-5 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded">
            Save Navigation
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          Navigation menus updated.
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-md divide-y divide-slate-200">
        {items.map((item, idx) => (
          <div key={item.id} className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <input
              type="text"
              value={item.label}
              onChange={(e) => updateItem(idx, { label: e.target.value })}
              placeholder="Label"
              className="sm:col-span-3 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded"
            />
            <input
              type="text"
              value={item.path}
              onChange={(e) => updateItem(idx, { path: e.target.value })}
              placeholder="/path or https://..."
              className="sm:col-span-3 px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded"
            />
            <select
              value={item.placement}
              onChange={(e) => updateItem(idx, { placement: e.target.value as NavItem['placement'] })}
              className="sm:col-span-2 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
            >
              <option value="header">Header Bar</option>
              <option value="footer_explore">Footer Explore</option>
              <option value="footer_legal">Footer Legal</option>
            </select>
            <input
              type="number"
              value={item.order}
              onChange={(e) => updateItem(idx, { order: Number(e.target.value) })}
              className="sm:col-span-1 px-2 py-1.5 text-xs font-mono-num border border-slate-300 rounded"
              title="Display Order"
            />
            <label className="sm:col-span-1 flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={item.visible}
                onChange={(e) => updateItem(idx, { visible: e.target.checked })}
              />
              <span>Show</span>
            </label>
            <label className="sm:col-span-1 flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={item.isExternal}
                onChange={(e) => updateItem(idx, { isExternal: e.target.checked })}
              />
              <span>Ext</span>
            </label>
            <button
              type="button"
              onClick={() => setItems(items.filter((_, i) => i !== idx))}
              className="sm:col-span-1 text-slate-400 hover:text-rose-600 justify-self-end"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </form>
  );
};

// ============================================================================
// K. SEO MANAGEMENT MODULE
// ============================================================================

export const SeoAdminModule: React.FC = () => {
  const { data, refreshPublicData } = useSite();
  const [seoList, setSeoList] = useState<PageSEOConfig[]>(data?.seo || []);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.seo) setSeoList(data.seo);
  }, [data?.seo]);

  const updateRow = (idx: number, patch: Partial<PageSEOConfig>) => {
    const next = [...seoList];
    next[idx] = { ...next[idx], ...patch };
    setSeoList(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    await apiRequest('/api/admin/seo', {
      method: 'PUT',
      scope: 'admin',
      body: { seo: seoList },
    });
    await refreshPublicData();
    setSaved(true);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Search Engine &amp; Social Card SEO</h2>
          <p className="text-xs text-slate-600">
            Configure page titles, meta descriptions, keywords, and OpenGraph social sharing images.
          </p>
        </div>
        <button type="submit" className="px-6 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded">
          Save SEO Metadata
        </button>
      </div>

      {saved && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          SEO metadata saved and applied dynamically across pages.
        </div>
      )}

      <div className="space-y-4">
        {seoList.map((row, idx) => (
          <div key={row.pageKey} className="bg-white border border-slate-200 rounded-md p-5 space-y-3">
            <p className="text-xs font-semibold text-[#9F7A31] uppercase tracking-wide">{row.pageLabel}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={row.title}
                  onChange={(e) => updateRow(idx, { title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                />
              </div>
              <SingleImageField
                label="Social Share Card Photo"
                value={row.ogImage}
                titleHint={`${row.pageLabel} Share Photo`}
                allowClear
                onChange={(nextUrl) => updateRow(idx, { ogImage: nextUrl })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meta Description</label>
              <textarea
                rows={2}
                value={row.description}
                onChange={(e) => updateRow(idx, { description: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Keywords (comma-separated)</label>
              <input
                type="text"
                value={row.keywords}
                onChange={(e) => updateRow(idx, { keywords: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>
        ))}
      </div>
    </form>
  );
};

// ============================================================================
// L. ADMIN PROFILE & ROLE-BASED TEAM PERMISSIONS
// ============================================================================

export const AdminProfileModule: React.FC = () => {
  const { admin, refreshAdmin } = useSite();
  const [name, setName] = useState(admin?.name || '');
  const [email, setEmail] = useState(admin?.email || '');
  const [phone, setPhone] = useState(admin?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Team management (super_admin only)
  const [team, setTeam] = useState<UserAccount[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberRole, setMemberRole] = useState<UserRole>('editor');
  const [memberPassword, setMemberPassword] = useState('');
  const [editingMember, setEditingMember] = useState<(UserAccount & { newPassword?: string }) | null>(null);

  useEffect(() => {
    if (admin) {
      setName(admin.name);
      setEmail(admin.email);
      setPhone(admin.phone);
    }
  }, [admin]);

  useEffect(() => {
    if (admin?.role === 'super_admin') {
      apiRequest<{ team: UserAccount[] }>('/api/admin/team', { scope: 'admin' })
        .then((res) => setTeam(res.team))
        .catch(() => {});
    }
  }, [admin?.role]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/admin/profile', {
        method: 'PUT',
        scope: 'admin',
        body: {
          name,
          email: email.trim().toLowerCase(),
          phone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        },
      });
      setCurrentPassword('');
      setNewPassword('');
      await refreshAdmin();
      if (admin?.role === 'super_admin') {
        apiRequest<{ team: UserAccount[] }>('/api/admin/team', { scope: 'admin' })
          .then((t) => setTeam(t.team))
          .catch(() => {});
      }
      setMsg({ type: 'ok', text: res.message });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Update failed.' });
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await apiRequest<{ member: UserAccount }>('/api/admin/team', {
        method: 'POST',
        scope: 'admin',
        body: {
          name: memberName,
          email: memberEmail.trim().toLowerCase(),
          phone: memberPhone,
          role: memberRole,
          password: memberPassword,
        },
      });
      setTeam([...team, res.member]);
      setMemberName('');
      setMemberEmail('');
      setMemberPhone('');
      setMemberPassword('');
      setMsg({ type: 'ok', text: `Added ${res.member.role} account for ${res.member.name}.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Unable to add team member.' });
    }
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setMsg(null);
    try {
      const res = await apiRequest<{ member: UserAccount }>(`/api/admin/team/${editingMember.id}`, {
        method: 'PUT',
        scope: 'admin',
        body: {
          name: editingMember.name,
          email: editingMember.email.trim().toLowerCase(),
          phone: editingMember.phone,
          role: editingMember.role,
          active: editingMember.active,
          newPassword: editingMember.newPassword || undefined,
        },
      });
      setTeam((prev) => prev.map((m) => (m.id === res.member.id ? res.member : m)));
      setEditingMember(null);
      await refreshAdmin();
      setMsg({ type: 'ok', text: `Updated credentials for ${res.member.name} (${res.member.email}).` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Unable to update staff account.' });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {msg && (
        <div
          className={`p-3.5 rounded text-xs border ${
            msg.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleProfileSave} className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Administrator Email &amp; Password</h2>
            <p className="text-xs text-slate-600">
              Change your login email or password anytime — updates take effect immediately everywhere.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswords((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded text-slate-700 hover:border-[#0B192C]"
          >
            {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Login Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password (optional)
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Leave blank while signed in"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password (min 6 chars)
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>

        <button type="submit" className="px-6 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742]">
          Save Admin Email &amp; Password
        </button>
      </form>

      {admin?.role === 'super_admin' && (
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#0B192C]">
              Role-Based Administrative Team
            </h3>
            <p className="text-xs text-slate-600">
              Edit any administrator’s email or password, or assign Editor (Schemes, Properties, CMS) and Support roles.
            </p>
          </div>

          {editingMember && (
            <form onSubmit={handleSaveTeamMember} className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#0B192C]">
                  Edit Credentials: {editingMember.name}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  placeholder="Staff Name"
                  className="px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                />
                <input
                  type="email"
                  required
                  value={editingMember.email}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  placeholder="Login Email"
                  className="px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                />
                <input
                  type="text"
                  value={editingMember.phone}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  placeholder="Phone"
                  className="px-3 py-2 text-xs font-mono-num border border-slate-300 rounded bg-white"
                />
                <select
                  value={editingMember.role}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value as UserRole })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="editor">Editor</option>
                  <option value="support">Support</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={editingMember.newPassword || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, newPassword: e.target.value })}
                  placeholder="New Password (optional, min 6 chars)"
                  className="px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 px-1">
                  <input
                    type="checkbox"
                    checked={editingMember.active}
                    onChange={(e) => setEditingMember({ ...editingMember, active: e.target.checked })}
                  />
                  <span>Account Active</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-[#0B192C] text-white rounded">
                  Save Staff Credentials
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-200 border border-slate-200 rounded">
            {team.map((m) => (
              <div key={m.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-slate-900">
                    {m.name}{' '}
                    {!m.active && <span className="text-rose-600 font-normal">· Inactive</span>}
                  </p>
                  <p className="text-slate-500">{m.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-num font-semibold text-[#9F7A31] uppercase">{m.role}</span>
                  <button
                    type="button"
                    onClick={() => setEditingMember({ ...m, newPassword: '' })}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-200 rounded hover:border-[#0B192C]"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit / Password</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <input
              type="text"
              required
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="Staff Name"
              className="px-3 py-2 text-xs border border-slate-300 rounded"
            />
            <input
              type="email"
              required
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Staff Email"
              className="px-3 py-2 text-xs border border-slate-300 rounded"
            />
            <input
              type="text"
              value={memberPhone}
              onChange={(e) => setMemberPhone(e.target.value)}
              placeholder="Phone"
              className="px-3 py-2 text-xs border border-slate-300 rounded"
            />
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as UserRole)}
              className="px-3 py-2 text-xs border border-slate-300 rounded bg-white"
            >
              <option value="editor">Editor (Schemes, Properties, Content)</option>
              <option value="support">Support (Inquiries &amp; Customers)</option>
              <option value="super_admin">Super Admin (Full Control)</option>
            </select>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              minLength={6}
              value={memberPassword}
              onChange={(e) => setMemberPassword(e.target.value)}
              placeholder="Initial Password (min 6 chars)"
              className="px-3 py-2 text-xs border border-slate-300 rounded"
            />
            <button type="submit" className="px-4 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded">
              Create Staff Account
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// M. GENERAL WEBSITE SETTINGS MODULE
// ============================================================================

export const SettingsAdminModule: React.FC = () => {
  const { data, refreshPublicData } = useSite();
  const [form, setForm] = useState<SiteSettings | null>(data?.settings || null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data?.settings]);

  if (!form) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    await apiRequest('/api/admin/settings', { method: 'PUT', scope: 'admin', body: form });
    await refreshPublicData();
    setSaved(true);
  };

  return (
    <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-md p-6 space-y-5 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#0B192C]">General Brand &amp; Website Settings</h2>
        <p className="text-xs text-slate-600">
          Configure agency branding, logo, favicon, PKR currency code, and floating WhatsApp button behavior.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          Website settings saved and live.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Website / Agency Name</label>
          <input
            type="text"
            required
            value={form.siteName}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Short Name</label>
          <input
            type="text"
            required
            value={form.shortName}
            onChange={(e) => setForm({ ...form, shortName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Tagline</label>
        <input
          type="text"
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SingleImageField
          label="Agency Brand Logo (optional)"
          helperText="Leave cleared to display the crisp editorial text wordmark."
          value={form.logoUrl}
          titleHint="Agency Brand Logo"
          allowClear
          onChange={(nextUrl) => setForm({ ...form, logoUrl: nextUrl })}
        />
        <SingleImageField
          label="Browser Favicon (optional)"
          value={form.faviconUrl}
          titleHint="Site Favicon"
          allowClear
          onChange={(nextUrl) => setForm({ ...form, faviconUrl: nextUrl })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
          <input
            type="text"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Navy Hex</label>
          <input
            type="text"
            value={form.primaryColor}
            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Accent Gold Hex</label>
          <input
            type="text"
            value={form.accentColor}
            onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
          />
        </div>
      </div>

      <div className="pt-2 space-y-3 border-t border-slate-100">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={form.whatsappFloatingEnabled}
            onChange={(e) => setForm({ ...form, whatsappFloatingEnabled: e.target.checked })}
          />
          <span>Display Floating WhatsApp Button on All Public Pages</span>
        </label>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Default Floating WhatsApp Greeting Message
          </label>
          <textarea
            rows={2}
            value={form.whatsappDefaultMessage}
            onChange={(e) => setForm({ ...form, whatsappDefaultMessage: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
          />
        </div>
      </div>

      <button type="submit" className="px-6 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded">
        Save General Settings
      </button>
    </form>
  );
};
