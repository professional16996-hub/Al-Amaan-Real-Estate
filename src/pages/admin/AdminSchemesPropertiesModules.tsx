import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Plus, Star, Trash2, Upload, Edit3, X } from 'lucide-react';
import { apiRequest, uploadMediaRequest } from '../../services/api';
import { useSite } from '../../context/SiteContext';
import type {
  HousingScheme,
  MediaAsset,
  PlotCategory,
  PropertyCategory,
  PropertyItem,
  PropertyStatus,
} from '../../types/models';
import { ResilientImage } from '../../components/ResilientImage';
import { formatPKRCompact } from '../../utils/formatters';

// ============================================================================
// A. HOUSING SCHEMES MANAGEMENT MODULE
// ============================================================================

interface SchemesAdminModuleProps {
  onManageSocietyPlots?: (schemeId: string, openCreate?: boolean) => void;
}

export const SchemesAdminModule: React.FC<SchemesAdminModuleProps> = ({ onManageSocietyPlots }) => {
  const { refreshPublicData } = useSite();
  const [schemes, setSchemes] = useState<HousingScheme[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<HousingScheme> | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  // Text helpers for array fields
  const [highlightsText, setHighlightsText] = useState('');
  const [facilitiesText, setFacilitiesText] = useState('');
  const [galleryUrlInput, setGalleryUrlInput] = useState('');

  const loadSchemes = useCallback(async () => {
    setLoading(true);
    try {
      const [schRes, propRes] = await Promise.all([
        apiRequest<{ schemes: HousingScheme[] }>('/api/admin/schemes', { scope: 'admin' }),
        apiRequest<{ properties: PropertyItem[] }>('/api/admin/properties', { scope: 'admin' }),
      ]);
      setSchemes(schRes.schemes);
      setProperties(propRes.properties);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchemes();
  }, [loadSchemes]);

  const startCreate = () => {
    setEditing({
      name: '',
      slug: '',
      tagline: '',
      location: '',
      city: 'Lahore',
      approvalStatus: 'TMA / LDA Approved',
      description: '',
      heroImage: '',
      gallery: [],
      plotCategories: [
        {
          id: `pc_${Date.now()}`,
          size: '5 Marla',
          category: 'Residential',
          startingPrice: 4500000,
          installmentAvailable: true,
          description: '',
        },
      ],
      mapEmbedUrl: '',
      googleMapsUrl: '',
      contactPerson: 'Al Amaan Scheme Desk',
      contactPhone: '+92 300 8459920',
      contactEmail: 'info@alamaanestate.com',
      published: true,
      featured: false,
      displayOrder: schemes.length + 1,
    });
    setHighlightsText('');
    setFacilitiesText('24/7 Gated Security\nUnderground Electricity\nGrand Jamia Mosque\nLandscaped Parks');
    setFeedback(null);
  };

  const startEdit = (scheme: HousingScheme) => {
    setEditing({
      ...scheme,
      plotCategories: scheme.plotCategories.map((c) => ({ ...c })),
      gallery: [...scheme.gallery],
    });
    setHighlightsText(scheme.overviewHighlights.join('\n'));
    setFacilitiesText(scheme.facilities.join('\n'));
    setFeedback(null);
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingImg(true);
    try {
      const res = await uploadMediaRequest<{ asset: MediaAsset }>(
        '/api/admin/media/upload',
        file,
        `${editing.name || 'Scheme'} Hero`
      );
      setEditing((prev) =>
        prev
          ? {
              ...prev,
              heroImage: res.asset.url,
              gallery: Array.from(new Set([res.asset.url, ...(prev.gallery || [])])),
            }
          : prev
      );
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setUploadingImg(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingImg(true);
    try {
      const res = await uploadMediaRequest<{ asset: MediaAsset }>(
        '/api/admin/media/upload',
        file,
        `${editing.name || 'Scheme'} Gallery`
      );
      setEditing((prev) =>
        prev ? { ...prev, gallery: [...(prev.gallery || []), res.asset.url] } : prev
      );
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFeedback(null);

    const payload = {
      ...editing,
      overviewHighlights: highlightsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      facilities: facilitiesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editing.id) {
        await apiRequest(`/api/admin/schemes/${editing.id}`, {
          method: 'PUT',
          scope: 'admin',
          body: payload,
        });
      } else {
        await apiRequest('/api/admin/schemes', {
          method: 'POST',
          scope: 'admin',
          body: payload,
        });
      }
      await loadSchemes();
      await refreshPublicData();
      setEditing(null);
      setFeedback({ type: 'ok', text: 'Housing scheme saved and live website updated.' });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Failed to save scheme.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSchemeFlag = async (scheme: HousingScheme, field: 'published' | 'featured') => {
    try {
      await apiRequest(`/api/admin/schemes/${scheme.id}`, {
        method: 'PUT',
        scope: 'admin',
        body: { [field]: !scheme[field] },
      });
      await loadSchemes();
      await refreshPublicData();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Update failed.' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/api/admin/schemes/${id}`, { method: 'DELETE', scope: 'admin' });
      setConfirmDeleteId(null);
      await loadSchemes();
      await refreshPublicData();
      setFeedback({ type: 'ok', text: 'Housing scheme deleted.' });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Delete failed.' });
    }
  };

  const updatePlotCat = (idx: number, patch: Partial<PlotCategory>) => {
    if (!editing) return;
    const next = [...(editing.plotCategories || [])];
    next[idx] = { ...next[idx], ...patch };
    setEditing({ ...editing, plotCategories: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Housing Societies &amp; Schemes</h2>
          <p className="text-xs text-slate-600">
            Manage Al Jalil Garden and add unlimited future housing societies. Click into any society to add or manage its plots.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Society / Scheme</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded text-xs border ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSaveScheme} className="bg-white border border-slate-200 rounded-md p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="font-display text-2xl font-semibold text-[#0B192C]">
              {editing.id ? `Edit Scheme: ${editing.name}` : 'Create New Housing Scheme'}
            </h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="p-1.5 text-slate-500 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scheme Name *</label>
              <input
                type="text"
                required
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. Al Jalil Garden"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Slug (auto if blank)</label>
              <input
                type="text"
                value={editing.slug || ''}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder="al-jalil-garden"
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Standing</label>
              <input
                type="text"
                value={editing.approvalStatus || ''}
                onChange={(e) => setEditing({ ...editing, approvalStatus: e.target.value })}
                placeholder="TMA / LDA Approved"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Location *</label>
              <input
                type="text"
                required
                value={editing.location || ''}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                placeholder="Main Sharaqpur Road, Opposite Faizpur Interchange, Lahore"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={editing.city || ''}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Subtitle</label>
            <input
              type="text"
              value={editing.tagline || ''}
              onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description *</label>
            <textarea
              rows={4}
              required
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>

          {/* Hero & Gallery Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 border border-slate-200 rounded">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Primary Banner Image</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editing.heroImage || ''}
                  onChange={(e) => setEditing({ ...editing, heroImage: e.target.value })}
                  placeholder="/uploads/... or image URL"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                />
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImg ? '...' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                </label>
              </div>
              {editing.heroImage && (
                <div className="h-28 w-48 rounded overflow-hidden border border-slate-200">
                  <ResilientImage src={editing.heroImage} alt="Hero preview" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Scheme Gallery ({(editing.gallery || []).length} images)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={galleryUrlInput}
                  onChange={(e) => setGalleryUrlInput(e.target.value)}
                  placeholder="Paste image URL"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (galleryUrlInput.trim()) {
                      setEditing({
                        ...editing,
                        gallery: [...(editing.gallery || []), galleryUrlInput.trim()],
                      });
                      setGalleryUrlInput('');
                    }
                  }}
                  className="px-3 py-2 text-xs font-semibold border border-slate-300 bg-white rounded"
                >
                  Add URL
                </button>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(editing.gallery || []).map((g, idx) => (
                  <div key={idx} className="relative w-20 h-14 rounded overflow-hidden border border-slate-300 group">
                    <ResilientImage src={g} alt={`Gallery ${idx + 1}`} />
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          gallery: (editing.gallery || []).filter((_, i) => i !== idx),
                        })
                      }
                      className="absolute top-0.5 right-0.5 bg-black/75 text-white rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plot Categories Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">
                Available Plot Categories (3 Marla, 5 Marla, 10 Marla, 1 Kanal, Commercial)
              </label>
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    ...editing,
                    plotCategories: [
                      ...(editing.plotCategories || []),
                      {
                        id: `pc_${Date.now()}`,
                        size: '10 Marla',
                        category: 'Residential',
                        startingPrice: 8500000,
                        installmentAvailable: false,
                        description: '',
                      },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B192C] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Plot Category</span>
              </button>
            </div>

            <div className="space-y-2">
              {(editing.plotCategories || []).map((cat, idx) => (
                <div
                  key={cat.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 bg-slate-50 border border-slate-200 rounded"
                >
                  <input
                    type="text"
                    value={cat.size}
                    onChange={(e) => updatePlotCat(idx, { size: e.target.value })}
                    placeholder="e.g. 5 Marla"
                    className="sm:col-span-3 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                  <select
                    value={cat.category}
                    onChange={(e) =>
                      updatePlotCat(idx, {
                        category: e.target.value as 'Residential' | 'Commercial',
                      })
                    }
                    className="sm:col-span-2 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                  <input
                    type="number"
                    value={cat.startingPrice}
                    onChange={(e) => updatePlotCat(idx, { startingPrice: Number(e.target.value) })}
                    placeholder="Starting PKR"
                    className="sm:col-span-3 px-2.5 py-1.5 text-xs font-mono-num border border-slate-300 rounded bg-white"
                  />
                  <label className="sm:col-span-3 flex items-center gap-1.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={cat.installmentAvailable}
                      onChange={(e) => updatePlotCat(idx, { installmentAvailable: e.target.checked })}
                    />
                    <span>Installments Available</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        plotCategories: (editing.plotCategories || []).filter((_, i) => i !== idx),
                      })
                    }
                    className="sm:col-span-1 text-rose-600 hover:text-rose-800 justify-self-end"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Facilities & Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Key Highlights (one per line)
              </label>
              <textarea
                rows={4}
                value={highlightsText}
                onChange={(e) => setHighlightsText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Society Facilities (one per line)
              </label>
              <textarea
                rows={4}
                value={facilitiesText}
                onChange={(e) => setFacilitiesText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>

          {/* Maps & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Google Maps Direct Link</label>
              <input
                type="url"
                value={editing.googleMapsUrl || ''}
                onChange={(e) => setEditing({ ...editing, googleMapsUrl: e.target.value })}
                placeholder="https://www.google.com/maps/..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interactive Map Embed URL</label>
              <input
                type="url"
                value={editing.mapEmbedUrl || ''}
                onChange={(e) => setEditing({ ...editing, mapEmbedUrl: e.target.value })}
                placeholder="https://www.openstreetmap.org/export/embed.html?..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scheme Contact Advisor</label>
              <input
                type="text"
                value={editing.contactPerson || ''}
                onChange={(e) => setEditing({ ...editing, contactPerson: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={editing.contactPhone || ''}
                onChange={(e) => setEditing({ ...editing, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono-num border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={editing.contactEmail || ''}
                onChange={(e) => setEditing({ ...editing, contactEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(editing.published)}
                  onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                />
                <span>Published on Public Website</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(editing.featured)}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                />
                <span>Featured Flagship Scheme</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 text-xs font-medium border border-slate-300 rounded text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60"
              >
                {saving ? 'Saving Scheme...' : 'Save Housing Scheme'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-500">Loading housing schemes...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                    <th className="py-3 px-4 font-semibold">Society Name &amp; Location</th>
                    <th className="py-3 px-4 font-semibold">Plots Inside Society</th>
                    <th className="py-3 px-4 font-semibold">Visibility</th>
                    <th className="py-3 px-4 font-semibold">Featured</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {schemes.map((s) => {
                    const societyPlotsCount = properties.filter((p) => p.schemeId === s.id).length;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span>{s.name}</span>
                            {s.published && (
                              <a
                                href={`/schemes/${s.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-[#0B192C]"
                                title="Open dedicated society page"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{s.location}</p>
                        </td>
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-num font-semibold text-slate-800">
                              {societyPlotsCount} {societyPlotsCount === 1 ? 'listing' : 'listings'}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">{s.plotCategories.length} plot sizes</span>
                          </div>
                          {onManageSocietyPlots && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onManageSocietyPlots(s.id, false)}
                                className="text-[11px] font-semibold text-[#0B192C] hover:text-[#9F7A31] underline"
                              >
                                View Plots
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => onManageSocietyPlots(s.id, true)}
                                className="text-[11px] font-semibold text-[#9F7A31] hover:underline"
                              >
                                + Add Plot Here
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => toggleSchemeFlag(s, 'published')}
                            className={`text-xs font-semibold ${
                              s.published ? 'text-emerald-700' : 'text-slate-500'
                            } hover:underline`}
                          >
                            {s.published ? 'Published (Click to Unpublish)' : 'Draft (Click to Publish)'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => toggleSchemeFlag(s, 'featured')}
                            className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              s.featured ? 'text-[#9F7A31]' : 'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${s.featured ? 'fill-current' : ''}`} />
                            <span>{s.featured ? 'Featured' : 'Standard'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded hover:border-[#0B192C]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {confirmDeleteId === s.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(s.id)}
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1.5 text-xs text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(s.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600"
                                title="Delete scheme"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// B. PROPERTY & PLOT MANAGEMENT MODULE
// ============================================================================

interface PropertiesAdminModuleProps {
  initialSchemeFilter?: string;
  autoCreateForSchemeId?: string | null;
  onConsumeAutoCreate?: () => void;
}

export const PropertiesAdminModule: React.FC<PropertiesAdminModuleProps> = ({
  initialSchemeFilter = '',
  autoCreateForSchemeId = null,
  onConsumeAutoCreate,
}) => {
  const { refreshPublicData } = useSite();
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [schemes, setSchemes] = useState<HousingScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [schemeFilter, setSchemeFilter] = useState<string>(initialSchemeFilter);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Partial<PropertyItem> | null>(null);
  const [featuresText, setFeaturesText] = useState('');
  const [imgUrlInput, setImgUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [propRes, schRes] = await Promise.all([
        apiRequest<{ properties: PropertyItem[] }>('/api/admin/properties', { scope: 'admin' }),
        apiRequest<{ schemes: HousingScheme[] }>('/api/admin/schemes', { scope: 'admin' }),
      ]);
      setProperties(propRes.properties);
      setSchemes(schRes.schemes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    setSchemeFilter(initialSchemeFilter);
  }, [initialSchemeFilter]);

  const startCreate = useCallback(
    (preselectedSchemeId?: string) => {
      const targetSchemeId = preselectedSchemeId || schemeFilter || schemes[0]?.id || '';
      const matchedScheme = schemes.find((s) => s.id === targetSchemeId);
      setEditing({
        title: '',
        referenceCode: `AAR-${matchedScheme?.slug === 'al-jalil-garden' ? 'AJG' : 'LHR'}-${properties.length + 108}`,
        description: '',
        price: 5500000,
        location: matchedScheme ? `${matchedScheme.name}, Lahore` : '',
        city: matchedScheme?.city || 'Lahore',
        schemeId: targetSchemeId,
        size: '5 Marla',
        areaSqFt: 1125,
        category: 'Residential Plot',
        status: 'Available',
        featured: false,
        images: [],
        possessionReady: true,
      });
      setFeaturesText('Direct Society Transfer\n40-Ft Carpeted Road\nUnderground Electricity');
      setFeedback(null);
    },
    [properties.length, schemeFilter, schemes]
  );

  useEffect(() => {
    if (autoCreateForSchemeId && !loading) {
      startCreate(autoCreateForSchemeId);
      onConsumeAutoCreate?.();
    }
  }, [autoCreateForSchemeId, loading, onConsumeAutoCreate, startCreate]);

  const startEdit = (prop: PropertyItem) => {
    setEditing({
      ...prop,
      images: [...prop.images],
    });
    setFeaturesText(prop.features.join('\n'));
    setFeedback(null);
  };

  const handleUploadPropertyImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const res = await uploadMediaRequest<{ asset: MediaAsset }>(
        '/api/admin/media/upload',
        file,
        editing.title || 'Property Photo'
      );
      setEditing((prev) =>
        prev ? { ...prev, images: [...(prev.images || []), res.asset.url] } : prev
      );
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFeedback(null);

    const payload = {
      ...editing,
      features: featuresText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editing.id) {
        await apiRequest(`/api/admin/properties/${editing.id}`, {
          method: 'PUT',
          scope: 'admin',
          body: payload,
        });
      } else {
        await apiRequest('/api/admin/properties', {
          method: 'POST',
          scope: 'admin',
          body: payload,
        });
      }
      await loadAll();
      await refreshPublicData();
      setEditing(null);
      setFeedback({ type: 'ok', text: 'Property saved and published to website.' });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const quickStatusChange = async (prop: PropertyItem, status: PropertyStatus) => {
    try {
      await apiRequest(`/api/admin/properties/${prop.id}`, {
        method: 'PUT',
        scope: 'admin',
        body: { status },
      });
      await loadAll();
      await refreshPublicData();
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Status update failed.' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/api/admin/properties/${id}`, { method: 'DELETE', scope: 'admin' });
      setConfirmDeleteId(null);
      await loadAll();
      await refreshPublicData();
      setFeedback({ type: 'ok', text: 'Property listing deleted.' });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Delete failed.' });
    }
  };

  const visibleProperties = properties.filter((p) => {
    if (schemeFilter && p.schemeId !== schemeFilter) return false;
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return `${p.title} ${p.referenceCode} ${p.location} ${p.schemeName || ''}`.toLowerCase().includes(q);
    }
    return true;
  });

  const activeSchemeObj = schemes.find((s) => s.id === schemeFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
            {activeSchemeObj ? `Plots & Properties in ${activeSchemeObj.name}` : 'Plots & Properties Management'}
          </h2>
          <p className="text-xs text-slate-600">
            Add plots, commercial files, and residences inside Al Jalil Garden or any other housing society.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => startCreate()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742]"
          >
            <Plus className="w-4 h-4" />
            <span>{activeSchemeObj ? `Add Plot in ${activeSchemeObj.name}` : 'Add Property / Plot'}</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded text-xs border ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-md p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="font-display text-2xl font-semibold text-[#0B192C]">
              {editing.id ? `Edit Listing: ${editing.referenceCode}` : 'Add New Property / Plot'}
            </h3>
            <button type="button" onClick={() => setEditing(null)} className="text-slate-500 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property Title *</label>
              <input
                type="text"
                required
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="e.g. Prime 5 Marla Possession Plot — Rose Block"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Code</label>
              <input
                type="text"
                value={editing.referenceCode || ''}
                onChange={(e) => setEditing({ ...editing, referenceCode: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (PKR) *</label>
              <input
                type="number"
                required
                min={1}
                value={editing.price || ''}
                onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Housing Society / Project *</label>
              <select
                value={editing.schemeId || ''}
                onChange={(e) => setEditing({ ...editing, schemeId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
              >
                <option value="">Independent Lahore Location</option>
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Size (e.g. 5 Marla)</label>
              <input
                type="text"
                required
                value={editing.size || ''}
                onChange={(e) => setEditing({ ...editing, size: e.target.value })}
                placeholder="3 Marla / 5 Marla / 10 Marla / 1 Kanal"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Area (Sq. Ft.)</label>
              <input
                type="number"
                value={editing.areaSqFt || ''}
                onChange={(e) => setEditing({ ...editing, areaSqFt: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={editing.category || 'Residential Plot'}
                onChange={(e) => setEditing({ ...editing, category: e.target.value as PropertyCategory })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
              >
                <option value="Residential Plot">Residential Plot</option>
                <option value="Commercial Plot">Commercial Plot</option>
                <option value="Luxury Residence">Luxury Residence</option>
                <option value="Commercial Plaza">Commercial Plaza</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editing.status || 'Available'}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as PropertyStatus })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms (if House)</label>
              <input
                type="number"
                value={editing.bedrooms ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    bedrooms: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms (if House)</label>
              <input
                type="number"
                value={editing.bathrooms ?? ''}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    bathrooms: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="Optional"
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exact Block / Street Location *</label>
              <input
                type="text"
                required
                value={editing.location || ''}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                placeholder="e.g. Rose Block, Street 4, Al Jalil Garden"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={editing.city || 'Lahore'}
                onChange={(e) => setEditing({ ...editing, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>

          {/* Multi-Image Uploader */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3">
            <label className="block text-xs font-semibold text-slate-800">
              Property Photographs ({(editing.images || []).length})
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={imgUrlInput}
                onChange={(e) => setImgUrlInput(e.target.value)}
                placeholder="Paste image URL or upload file"
                className="flex-1 min-w-[200px] px-3 py-2 text-xs border border-slate-300 rounded bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (imgUrlInput.trim()) {
                    setEditing({ ...editing, images: [...(editing.images || []), imgUrlInput.trim()] });
                    setImgUrlInput('');
                  }
                }}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 bg-white rounded"
              >
                Add URL
              </button>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                <input type="file" accept="image/*" onChange={handleUploadPropertyImg} className="hidden" />
              </label>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {(editing.images || []).map((img, i) => (
                <div key={i} className="relative w-24 h-16 rounded overflow-hidden border border-slate-300">
                  <ResilientImage src={img} alt={`Property ${i + 1}`} />
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        images: (editing.images || []).filter((_, idx) => idx !== i),
                      })
                    }
                    className="absolute top-0.5 right-0.5 bg-black/75 text-white rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Key Property Features (one per line)
            </label>
            <textarea
              rows={3}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(editing.featured)}
                  onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                />
                <span>Featured Property</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(editing.possessionReady)}
                  onChange={(e) => setEditing({ ...editing, possessionReady: e.target.checked })}
                />
                <span>Immediate Possession Ready</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2.5 text-xs font-medium border border-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Property Listing'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-md p-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, ref code, or block..."
                className="w-full sm:w-64 px-3 py-1.5 text-xs border border-slate-300 rounded"
              />
              <select
                value={schemeFilter}
                onChange={(e) => setSchemeFilter(e.target.value)}
                aria-label="Filter by housing society"
                className="px-3 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-700 font-medium"
              >
                <option value="">All Housing Societies</option>
                {schemes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded">
              {['All', 'Available', 'Reserved', 'Sold'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    statusFilter === st ? 'bg-[#0B192C] text-white' : 'text-slate-600'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-xs text-slate-500">Loading property registry...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                      <th className="py-3 px-4 font-semibold">Ref &amp; Property</th>
                      <th className="py-3 px-4 font-semibold">Scheme &amp; Size</th>
                      <th className="py-3 px-4 font-semibold text-right">Price (PKR)</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {visibleProperties.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num text-[11px] text-slate-500">{p.referenceCode}</span>
                            {p.featured && <span className="text-[11px] font-semibold text-[#9F7A31]">· Featured</span>}
                          </div>
                          <p className="font-semibold text-slate-900 line-clamp-1">{p.title}</p>
                          <p className="text-xs text-slate-500">{p.location}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                          <p className="font-medium">{p.schemeName}</p>
                          <p className="text-slate-500">
                            {p.size} · {p.category}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono-num text-xs font-semibold text-[#0B192C] whitespace-nowrap">
                          {formatPKRCompact(p.price)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={p.status}
                            onChange={(e) => quickStatusChange(p, e.target.value as PropertyStatus)}
                            aria-label={`Change status for ${p.title}`}
                            className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded bg-white"
                          >
                            <option value="Available">Available</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Sold">Sold</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded hover:border-[#0B192C]"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {confirmDeleteId === p.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p.id)}
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1.5 text-xs text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(p.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
