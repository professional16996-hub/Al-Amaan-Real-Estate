import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, ExternalLink, Layers, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useSite } from '../../context/SiteContext';
import type {
  HousingScheme,
  PlotCategory,
  ProjectDevelopmentUpdate,
  ProjectPaymentPlan,
  ProjectStatus,
} from '../../types/models';
import { MultiImageGalleryField, SingleImageField } from '../../components/MobileImagePicker';
import { ResilientImage } from '../../components/ResilientImage';
import { formatPKRCompact } from '../../utils/formatters';

interface WorkspaceModuleProps {
  initialProjectId?: string;
  onProjectCreated?: (projectId: string) => void;
  onNavigateModule?: (module: 'schemes' | 'project-gallery' | 'project-info' | 'project-payment-plans' | 'project-updates', projectId?: string) => void;
}

const useAdminProjects = (initialProjectId?: string) => {
  const [projects, setProjects] = useState<HousingScheme[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialProjectId || '');
  const [loading, setLoading] = useState(true);

  const reloadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ schemes: HousingScheme[] }>('/api/admin/schemes', {
        scope: 'admin',
      });
      setProjects(res.schemes);
      setSelectedId((prev) => {
        if (initialProjectId && res.schemes.some((s) => s.id === initialProjectId)) {
          return initialProjectId;
        }
        if (prev && res.schemes.some((s) => s.id === prev)) {
          return prev;
        }
        return res.schemes[0]?.id || '';
      });
    } finally {
      setLoading(false);
    }
  }, [initialProjectId]);

  useEffect(() => {
    void reloadProjects();
  }, [reloadProjects]);

  useEffect(() => {
    if (initialProjectId) setSelectedId(initialProjectId);
  }, [initialProjectId]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedId) || projects[0] || null,
    [projects, selectedId]
  );

  return { projects, selectedId, setSelectedId, activeProject, loading, reloadProjects };
};

const ProjectSelectorBar: React.FC<{
  projects: HousingScheme[];
  selectedId: string;
  onSelect: (id: string) => void;
}> = ({ projects, selectedId, onSelect }) => {
  if (projects.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-md p-3.5 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">Select Project to Edit</p>
        <span className="text-[11px] font-mono-num text-slate-500">{projects.length} total</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {projects.map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded border transition-colors min-h-[40px] ${
                active
                  ? 'bg-[#0B192C] border-[#0B192C] text-white font-semibold'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-[#0B192C]'
              }`}
            >
              <span className="truncate max-w-[180px]">{p.name}</span>
              <span className={`text-[10px] ${active ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
                {p.status || 'Ongoing'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 1. ADD NEW PROJECT MODULE
// ============================================================================

export const AddProjectAdminModule: React.FC<WorkspaceModuleProps> = ({
  onProjectCreated,
  onNavigateModule,
}) => {
  const { data, refreshPublicData } = useSite();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Ongoing');
  const [approvalStatus, setApprovalStatus] = useState('TMA / LDA Approved');
  const [tagline, setTagline] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Lahore');
  const [description, setDescription] = useState('');
  const [projectLogo, setProjectLogo] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [featuresText, setFeaturesText] = useState(
    'Direct Motorway & Main Road Access\nUnderground Electricity & Clean Water\nClear Allotment & Transparent Transfer'
  );
  const [facilitiesText, setFacilitiesText] = useState(
    '24/7 Gated Security & CCTV\nGrand Jamia Mosque\nLandscaped Parks\nDedicated Commercial Sector'
  );
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');
  const [contactPerson, setContactPerson] = useState('Al Amaan Project Advisory Desk');
  const [contactPhone, setContactPhone] = useState(data?.contact.primaryPhone || '+92 300 8459920');
  const [whatsappNumber, setWhatsappNumber] = useState(data?.contact.whatsappNumber || '923008459920');
  const [contactEmail, setContactEmail] = useState(data?.contact.email || 'info@alamaanestate.com');
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<HousingScheme | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await apiRequest<{ scheme: HousingScheme }>('/api/admin/schemes', {
        method: 'POST',
        scope: 'admin',
        body: {
          name,
          slug,
          status,
          approvalStatus,
          tagline: tagline || `${name} — Master-Planned Real Estate Development`,
          location,
          city,
          description,
          projectLogo,
          heroImage: heroImage || gallery[0] || '',
          gallery: gallery.length ? gallery : heroImage ? [heroImage] : [],
          overviewHighlights: featuresText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          facilities: facilitiesText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          googleMapsUrl,
          mapEmbedUrl,
          contactPerson,
          contactPhone,
          whatsappNumber,
          contactEmail,
          published,
          featured,
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
          paymentPlans: [],
          developmentUpdates: [],
        },
      });
      await refreshPublicData();
      setCreatedProject(res.scheme);
      onProjectCreated?.(res.scheme.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create new project.');
    } finally {
      setSaving(false);
    }
  };

  if (createdProject) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8 space-y-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
              Project Created &amp; Live on Website
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              <strong>{createdProject.name}</strong> has been created with its own dedicated page at{' '}
              <span className="font-mono-num">/projects/{createdProject.slug}</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={`/projects/${createdProject.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded min-h-[42px]"
          >
            <span>Open Live Project Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {onNavigateModule && (
            <>
              <button
                type="button"
                onClick={() => onNavigateModule('project-payment-plans', createdProject.id)}
                className="px-4 py-2.5 text-xs font-semibold border border-slate-300 rounded hover:border-[#0B192C] min-h-[42px]"
              >
                + Add Payment Plans
              </button>
              <button
                type="button"
                onClick={() => onNavigateModule('project-updates', createdProject.id)}
                className="px-4 py-2.5 text-xs font-semibold border border-slate-300 rounded hover:border-[#0B192C] min-h-[42px]"
              >
                + Add Development Update
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setCreatedProject(null);
              setName('');
              setSlug('');
              setTagline('');
              setLocation('');
              setDescription('');
              setProjectLogo('');
              setHeroImage('');
              setGallery([]);
            }}
            className="px-4 py-2.5 text-xs font-medium text-[#9F7A31] hover:underline min-h-[42px]"
          >
            Add Another Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreate} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Add New Real Estate Project</h2>
          <p className="text-xs text-slate-600">
            Create an independent project with its own URL, logo, cover banner, gallery, features, facilities, and contact details.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-5">
        <h3 className="font-display text-xl font-semibold text-[#0B192C] border-b border-slate-200 pb-3">
          1. Project Identity &amp; Status
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Al Amaan Residencia Phase II"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded bg-white"
            >
              <option value="Ongoing">Ongoing</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Standing</label>
            <input
              type="text"
              value={approvalStatus}
              onChange={(e) => setApprovalStatus(e.target.value)}
              placeholder="TMA / LDA Approved"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Location *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Canal Road, Lahore"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Short Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Modern Gated Living with Easy Installments"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Custom URL Slug (optional)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated from name if blank"
              className="w-full px-3 py-2.5 text-sm font-mono-num border border-slate-300 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description *</label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe project location advantages, block planning, plot options, and investment highlights..."
            className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded"
          />
        </div>
      </div>

      {/* Photos Section */}
      <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-5">
        <h3 className="font-display text-xl font-semibold text-[#0B192C] border-b border-slate-200 pb-3">
          2. Project Logo, Cover Image &amp; Gallery (Mobile Phone Upload)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SingleImageField
            label="Project Logo (Optional)"
            value={projectLogo}
            allowClear
            titleHint={`${name || 'Project'} Logo`}
            helperText="Displayed on project cards and the top of this project's dedicated page."
            onChange={setProjectLogo}
          />
          <SingleImageField
            label="Project Cover Image / Banner"
            value={heroImage}
            titleHint={`${name || 'Project'} Cover`}
            helperText="Main widescreen banner shown on homepage cards and project hero."
            onChange={setHeroImage}
          />
        </div>

        <MultiImageGalleryField
          label="Project Gallery Images"
          images={gallery}
          titlePrefix={`${name || 'Project'} Gallery`}
          onChange={setGallery}
        />
      </div>

      {/* Features, Facilities, Maps & Contact */}
      <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-5">
        <h3 className="font-display text-xl font-semibold text-[#0B192C] border-b border-slate-200 pb-3">
          3. Features, Facilities, Location &amp; Contact Info
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Features (one per line)
            </label>
            <textarea
              rows={4}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Available Facilities (one per line)
            </label>
            <textarea
              rows={4}
              value={facilitiesText}
              onChange={(e) => setFacilitiesText(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Google Maps Link</label>
            <input
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://www.google.com/maps/..."
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Interactive Map Embed URL (optional)</label>
            <input
              type="url"
              value={mapEmbedUrl}
              onChange={(e) => setMapEmbedUrl(e.target.value)}
              placeholder="https://www.openstreetmap.org/export/embed.html?..."
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person / Desk</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono-num border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Number</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="923008459920"
              className="w-full px-3 py-2 text-xs font-mono-num border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
              <span>Publish Immediately on Live Website</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
              <span>Mark as Featured Spotlight Project</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-7 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 min-h-[44px]"
          >
            {saving ? 'Creating Project...' : 'Create & Save Project'}
          </button>
        </div>
      </div>
    </form>
  );
};

// ============================================================================
// 2. PROJECT GALLERY MANAGER (Mobile Upload + Preview + Easy Reordering)
// ============================================================================

export const ProjectGalleryAdminModule: React.FC<WorkspaceModuleProps> = ({ initialProjectId }) => {
  const { refreshPublicData } = useSite();
  const { projects, selectedId, setSelectedId, activeProject, loading, reloadProjects } =
    useAdminProjects(initialProjectId);

  const [projectLogo, setProjectLogo] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (activeProject) {
      setProjectLogo(activeProject.projectLogo || '');
      setHeroImage(activeProject.heroImage || '');
      setGallery([...(activeProject.gallery || [])]);
      setFeedback(null);
    }
  }, [activeProject]);

  const handleSave = async () => {
    if (!activeProject) return;
    setSaving(true);
    setFeedback(null);
    try {
      await apiRequest(`/api/admin/schemes/${activeProject.id}`, {
        method: 'PUT',
        scope: 'admin',
        body: {
          projectLogo,
          heroImage: heroImage || gallery[0] || activeProject.heroImage,
          gallery,
        },
      });
      await reloadProjects();
      await refreshPublicData();
      setFeedback({ type: 'ok', text: `Saved gallery & visuals for "${activeProject.name}". Live site updated.` });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Unable to save project gallery.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Project Gallery &amp; Media</h2>
          <p className="text-xs text-slate-600">
            Upload multiple photos from your phone, preview before uploading, and rearrange photo order per project.
          </p>
        </div>
        {activeProject && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 min-h-[44px]"
          >
            {saving ? 'Saving Gallery...' : 'Save Gallery Changes'}
          </button>
        )}
      </div>

      <ProjectSelectorBar projects={projects} selectedId={selectedId} onSelect={setSelectedId} />

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

      {loading || !activeProject ? (
        <div className="p-10 text-center bg-white border border-slate-200 rounded text-xs text-slate-500">
          {loading ? 'Loading projects...' : 'Create a project first to manage its gallery.'}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SingleImageField
              label="Project Logo (Optional)"
              value={projectLogo}
              allowClear
              titleHint={`${activeProject.name} Logo`}
              onChange={setProjectLogo}
            />
            <SingleImageField
              label="Project Cover Banner"
              value={heroImage}
              titleHint={`${activeProject.name} Cover`}
              onChange={setHeroImage}
            />
          </div>

          <MultiImageGalleryField
            label={`${activeProject.name} Gallery Photos`}
            images={gallery}
            titlePrefix={`${activeProject.name} Gallery`}
            showCoverBadge
            onChange={(next) => {
              setGallery(next);
              if (next[0] && !heroImage) setHeroImage(next[0]);
            }}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. PROJECT INFORMATION MODULE
// ============================================================================

export const ProjectInfoAdminModule: React.FC<WorkspaceModuleProps> = ({ initialProjectId }) => {
  const { refreshPublicData } = useSite();
  const { projects, selectedId, setSelectedId, activeProject, loading, reloadProjects } =
    useAdminProjects(initialProjectId);

  const [form, setForm] = useState<Partial<HousingScheme> | null>(null);
  const [featuresText, setFeaturesText] = useState('');
  const [facilitiesText, setFacilitiesText] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (activeProject) {
      setForm({ ...activeProject });
      setFeaturesText((activeProject.overviewHighlights || []).join('\n'));
      setFacilitiesText((activeProject.facilities || []).join('\n'));
      setFeedback(null);
    }
  }, [activeProject]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !form) return;
    setSaving(true);
    setFeedback(null);
    try {
      await apiRequest(`/api/admin/schemes/${activeProject.id}`, {
        method: 'PUT',
        scope: 'admin',
        body: {
          name: form.name,
          slug: form.slug,
          status: form.status,
          approvalStatus: form.approvalStatus,
          tagline: form.tagline,
          location: form.location,
          city: form.city,
          description: form.description,
          overviewHighlights: featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
          facilities: facilitiesText.split('\n').map((s) => s.trim()).filter(Boolean),
          googleMapsUrl: form.googleMapsUrl,
          mapEmbedUrl: form.mapEmbedUrl,
          contactPerson: form.contactPerson,
          contactPhone: form.contactPhone,
          whatsappNumber: form.whatsappNumber,
          contactEmail: form.contactEmail,
          published: form.published,
          featured: form.featured,
        },
      });
      await reloadProjects();
      await refreshPublicData();
      setFeedback({ type: 'ok', text: `Updated project information for "${form.name}".` });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Unable to save project info.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Project Information &amp; Features</h2>
          <p className="text-xs text-slate-600">
            Edit project status (Upcoming, Ongoing, Completed), description, features, facilities, maps, and advisor contact info.
          </p>
        </div>
      </div>

      <ProjectSelectorBar projects={projects} selectedId={selectedId} onSelect={setSelectedId} />

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

      {loading || !form ? (
        <div className="p-10 text-center bg-white border border-slate-200 rounded text-xs text-slate-500">
          Loading project information...
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Status</label>
              <select
                value={form.status || 'Ongoing'}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded bg-white"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">URL Slug</label>
              <input
                type="text"
                value={form.slug || ''}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location *</label>
              <input
                type="text"
                required
                value={form.location || ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Standing</label>
              <input
                type="text"
                value={form.approvalStatus || ''}
                onChange={(e) => setForm({ ...form, approvalStatus: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={form.tagline || ''}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description *</label>
            <textarea
              rows={4}
              required
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Features (one per line)
              </label>
              <textarea
                rows={4}
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Facilities (one per line)
              </label>
              <textarea
                rows={4}
                value={facilitiesText}
                onChange={(e) => setFacilitiesText(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Google Maps Link</label>
              <input
                type="url"
                value={form.googleMapsUrl || ''}
                onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Map Embed URL</label>
              <input
                type="url"
                value={form.mapEmbedUrl || ''}
                onChange={(e) => setForm({ ...form, mapEmbedUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={form.contactPerson || ''}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.contactPhone || ''}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono-num border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={form.whatsappNumber || ''}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono-num border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.contactEmail || ''}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(form.published)}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                <span>Published on Public Website</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={Boolean(form.featured)}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                <span>Featured Spotlight Project</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-6 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 min-h-[44px]"
            >
              {saving ? 'Saving Info...' : 'Save Project Information'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ============================================================================
// 4. PAYMENT PLANS & PLOT CATEGORIES MODULE
// ============================================================================

export const ProjectPaymentPlansAdminModule: React.FC<WorkspaceModuleProps> = ({ initialProjectId }) => {
  const { data, refreshPublicData } = useSite();
  const currency = data?.settings.currency || 'PKR';
  const { projects, selectedId, setSelectedId, activeProject, loading, reloadProjects } =
    useAdminProjects(initialProjectId);

  const [paymentPlans, setPaymentPlans] = useState<ProjectPaymentPlan[]>([]);
  const [plotCategories, setPlotCategories] = useState<PlotCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (activeProject) {
      setPaymentPlans((activeProject.paymentPlans || []).map((p) => ({ ...p })));
      setPlotCategories((activeProject.plotCategories || []).map((c) => ({ ...c })));
      setFeedback(null);
    }
  }, [activeProject]);

  const handleSave = async () => {
    if (!activeProject) return;
    setSaving(true);
    setFeedback(null);
    try {
      await apiRequest(`/api/admin/schemes/${activeProject.id}`, {
        method: 'PUT',
        scope: 'admin',
        body: { paymentPlans, plotCategories },
      });
      await reloadProjects();
      await refreshPublicData();
      setFeedback({ type: 'ok', text: `Saved payment plans for "${activeProject.name}".` });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Unable to save payment plans.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Project Payment Plans &amp; Pricing</h2>
          <p className="text-xs text-slate-600">
            Configure installment schedules, down payments, monthly installments, and plot category valuations per project.
          </p>
        </div>
        {activeProject && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 min-h-[44px]"
          >
            {saving ? 'Saving Plans...' : 'Save Payment Plans'}
          </button>
        )}
      </div>

      <ProjectSelectorBar projects={projects} selectedId={selectedId} onSelect={setSelectedId} />

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

      {loading || !activeProject ? (
        <div className="p-10 text-center bg-white border border-slate-200 rounded text-xs text-slate-500">
          Loading payment plans...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Structured Payment Plans */}
          <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#9F7A31]" />
                <h3 className="font-display text-xl font-semibold text-[#0B192C]">
                  Installment &amp; Cash Payment Plans ({paymentPlans.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPaymentPlans([
                    ...paymentPlans,
                    {
                      id: `pp_${Date.now()}`,
                      planName: '3-Year Easy Installment Plan',
                      plotSize: '5 Marla Residential',
                      totalPrice: 5000000,
                      downPayment: 1000000,
                      installmentDuration: '36 Months',
                      monthlyInstallment: 75000,
                      possessionCharges: 'PKR 400,000 at Possession',
                      notes: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#B89146] text-[#0B192C] rounded min-h-[38px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Payment Plan</span>
              </button>
            </div>

            {paymentPlans.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No payment plans added yet for {activeProject.name}. Tap “+ Add Payment Plan” above.
              </p>
            ) : (
              <div className="space-y-4">
                {paymentPlans.map((plan, idx) => (
                  <div key={plan.id} className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#9F7A31]">
                        Plan #{idx + 1} · {formatPKRCompact(plan.totalPrice, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaymentPlans(paymentPlans.filter((_, i) => i !== idx))}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plan Name *</label>
                        <input
                          type="text"
                          value={plan.planName}
                          onChange={(e) => {
                            const next = [...paymentPlans];
                            next[idx] = { ...next[idx], planName: e.target.value };
                            setPaymentPlans(next);
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plot / Unit Size *</label>
                        <input
                          type="text"
                          value={plan.plotSize}
                          onChange={(e) => {
                            const next = [...paymentPlans];
                            next[idx] = { ...next[idx], plotSize: e.target.value };
                            setPaymentPlans(next);
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Price ({currency})</label>
                        <input
                          type="number"
                          value={plan.totalPrice}
                          onChange={(e) => {
                            const next = [...paymentPlans];
                            next[idx] = { ...next[idx], totalPrice: Number(e.target.value) };
                            setPaymentPlans(next);
                          }}
                          className="w-full px-3 py-2 text-xs font-mono-num border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Down Payment ({currency})</label>
                        <input
                          type="number"
                          value={plan.downPayment}
                          onChange={(e) => {
                            const next = [...paymentPlans];
                            next[idx] = { ...next[idx], downPayment: Number(e.target.value) };
                            setPaymentPlans(next);
                          }}
                          className="w-full px-3 py-2 text-xs font-mono-num border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Monthly Installment ({currency})</label>
                        <input
                          type="number"
                          value={plan.monthlyInstallment}
                          onChange={(e) => {
                            const next = [...paymentPlans];
                            next[idx] = { ...next[idx], monthlyInstallment: Number(e.target.value) };
                            setPaymentPlans(next);
                          }}
                          className="w-full px-3 py-2 text-xs font-mono-num border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration (e.g. 36 Months)</label>
                        <input
                          type="text"
                          value={plan.installmentDuration}
                          onChange={(e) => {
                            const next = [...paymentPlans];
                            next[idx] = { ...next[idx], installmentDuration: e.target.value };
                            setPaymentPlans(next);
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Possession Terms</label>
                        <input
                          type="text"
                          value={plan.possessionCharges || ''}
                          onChange={(e) => {
                            const next = [...paymentPlans];
                            next[idx] = { ...next[idx], possessionCharges: e.target.value };
                            setPaymentPlans(next);
                          }}
                          placeholder="e.g. Possession at 50%"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Plan Notes</label>
                        <input
                          type="text"
                          value={plan.notes || ''}
                          onChange={(e) => {
                            const next = [...paymentPlans];
                            next[idx] = { ...next[idx], notes: e.target.value };
                            setPaymentPlans(next);
                          }}
                          placeholder="Balloon payments, corner charges, etc."
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plot Categories Quick Schedule */}
          <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <h3 className="font-display text-xl font-semibold text-[#0B192C]">
                Plot Size Categories ({plotCategories.length})
              </h3>
              <button
                type="button"
                onClick={() =>
                  setPlotCategories([
                    ...plotCategories,
                    {
                      id: `pc_${Date.now()}`,
                      size: '10 Marla',
                      category: 'Residential',
                      startingPrice: 8500000,
                      installmentAvailable: true,
                      description: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B192C] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Plot Category</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {plotCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 bg-slate-50 border border-slate-200 rounded"
                >
                  <input
                    type="text"
                    value={cat.size}
                    onChange={(e) => {
                      const next = [...plotCategories];
                      next[idx] = { ...next[idx], size: e.target.value };
                      setPlotCategories(next);
                    }}
                    placeholder="Plot Size"
                    className="sm:col-span-3 px-2.5 py-2 text-xs border border-slate-300 rounded bg-white"
                  />
                  <select
                    value={cat.category}
                    onChange={(e) => {
                      const next = [...plotCategories];
                      next[idx] = { ...next[idx], category: e.target.value as 'Residential' | 'Commercial' };
                      setPlotCategories(next);
                    }}
                    className="sm:col-span-2 px-2.5 py-2 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                  <input
                    type="number"
                    value={cat.startingPrice}
                    onChange={(e) => {
                      const next = [...plotCategories];
                      next[idx] = { ...next[idx], startingPrice: Number(e.target.value) };
                      setPlotCategories(next);
                    }}
                    placeholder="Starting PKR"
                    className="sm:col-span-3 px-2.5 py-2 text-xs font-mono-num border border-slate-300 rounded bg-white"
                  />
                  <label className="sm:col-span-3 flex items-center gap-1.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={cat.installmentAvailable}
                      onChange={(e) => {
                        const next = [...plotCategories];
                        next[idx] = { ...next[idx], installmentAvailable: e.target.checked };
                        setPlotCategories(next);
                      }}
                    />
                    <span>Installments Available</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPlotCategories(plotCategories.filter((_, i) => i !== idx))}
                    className="sm:col-span-1 text-rose-600 hover:text-rose-800 justify-self-end"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 5. DEVELOPMENT UPDATES MODULE
// ============================================================================

export const ProjectUpdatesAdminModule: React.FC<WorkspaceModuleProps> = ({ initialProjectId }) => {
  const { refreshPublicData } = useSite();
  const { projects, selectedId, setSelectedId, activeProject, loading, reloadProjects } =
    useAdminProjects(initialProjectId);

  const [updates, setUpdates] = useState<ProjectDevelopmentUpdate[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (activeProject) {
      setUpdates((activeProject.developmentUpdates || []).map((u) => ({ ...u })));
      setFeedback(null);
    }
  }, [activeProject]);

  const handleSave = async () => {
    if (!activeProject) return;
    setSaving(true);
    setFeedback(null);
    try {
      await apiRequest(`/api/admin/schemes/${activeProject.id}`, {
        method: 'PUT',
        scope: 'admin',
        body: { developmentUpdates: updates },
      });
      await reloadProjects();
      await refreshPublicData();
      setFeedback({ type: 'ok', text: `Saved development updates for "${activeProject.name}".` });
    } catch (err) {
      setFeedback({ type: 'err', text: err instanceof Error ? err.message : 'Unable to save development updates.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Project Development Updates</h2>
          <p className="text-xs text-slate-600">
            Post site construction milestones, progress percentages, and mobile site photos for each project.
          </p>
        </div>
        {activeProject && (
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full sm:w-auto px-6 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 min-h-[44px]"
          >
            {saving ? 'Saving Updates...' : 'Save Development Updates'}
          </button>
        )}
      </div>

      <ProjectSelectorBar projects={projects} selectedId={selectedId} onSelect={setSelectedId} />

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

      {loading || !activeProject ? (
        <div className="p-10 text-center bg-white border border-slate-200 rounded text-xs text-slate-500">
          Loading development updates...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#9F7A31]" />
              <h3 className="font-display text-xl font-semibold text-[#0B192C]">
                {activeProject.name} Milestones ({updates.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                setUpdates([
                  {
                    id: `upd_${Date.now()}`,
                    title: 'New Site Infrastructure Milestone',
                    phase: 'Phase 1 / Main Boulevard',
                    date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    progressPercent: 80,
                    summary: '',
                    image: '',
                  },
                  ...updates,
                ])
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#B89146] text-[#0B192C] rounded min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Development Update</span>
            </button>
          </div>

          {updates.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No development updates posted yet for {activeProject.name}.
            </p>
          ) : (
            <div className="space-y-4">
              {updates.map((upd, idx) => (
                <div key={upd.id} className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#9F7A31]">Update #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setUpdates(updates.filter((_, i) => i !== idx))}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Update Headline *</label>
                      <input
                        type="text"
                        value={upd.title}
                        onChange={(e) => {
                          const next = [...updates];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setUpdates(next);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Phase / Sector</label>
                      <input
                        type="text"
                        value={upd.phase}
                        onChange={(e) => {
                          const next = [...updates];
                          next[idx] = { ...next[idx], phase: e.target.value };
                          setUpdates(next);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date</label>
                        <input
                          type="text"
                          value={upd.date}
                          onChange={(e) => {
                            const next = [...updates];
                            next[idx] = { ...next[idx], date: e.target.value };
                            setUpdates(next);
                          }}
                          className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Progress %</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={upd.progressPercent ?? ''}
                          onChange={(e) => {
                            const next = [...updates];
                            next[idx] = {
                              ...next[idx],
                              progressPercent: e.target.value === '' ? undefined : Number(e.target.value),
                            };
                            setUpdates(next);
                          }}
                          className="w-full px-2.5 py-2 text-xs font-mono-num border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Progress Summary</label>
                    <textarea
                      rows={2}
                      value={upd.summary}
                      onChange={(e) => {
                        const next = [...updates];
                        next[idx] = { ...next[idx], summary: e.target.value };
                        setUpdates(next);
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <SingleImageField
                    label="Site Progress Photo (Optional)"
                    value={upd.image || ''}
                    allowClear
                    titleHint={`${activeProject.name} Site Update`}
                    onChange={(url) => {
                      const next = [...updates];
                      next[idx] = { ...next[idx], image: url };
                      setUpdates(next);
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper thumbnail exported if needed elsewhere
export const ProjectMiniCardPreview: React.FC<{ project: HousingScheme }> = ({ project }) => (
  <div className="flex items-center gap-3">
    <div className="w-12 h-9 rounded overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
      <ResilientImage src={project.heroImage} alt={project.name} className="w-full h-full object-cover" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-900 truncate">{project.name}</p>
      <p className="text-[11px] text-slate-500 truncate">{project.status || 'Ongoing'}</p>
    </div>
  </div>
);
