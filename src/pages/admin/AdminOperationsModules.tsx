import React, { useCallback, useEffect, useState } from 'react';
import { Check, Copy, Edit3, Plus, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { apiRequest, uploadMediaRequest } from '../../services/api';
import { useSite } from '../../context/SiteContext';
import type {
  ActivityLogItem,
  InquiryItem,
  InquiryStatus,
  MediaAsset,
  TestimonialItem,
  UserAccount,
} from '../../types/models';
import { ResilientImage } from '../../components/ResilientImage';
import { WhatsAppLogo } from '../../components/WhatsAppIcon';
import { buildWhatsAppUrl, formatDisplayDate, formatDisplayDateTime } from '../../utils/formatters';

// ============================================================================
// C. CUSTOMER MANAGEMENT MODULE
// ============================================================================

export const CustomersAdminModule: React.FC = () => {
  const [customers, setCustomers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ customers: UserAccount[] }>('/api/admin/customers', { scope: 'admin' });
      setCustomers(res.customers);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const toggleActive = async (cust: UserAccount) => {
    await apiRequest(`/api/admin/customers/${cust.id}`, {
      method: 'PUT',
      scope: 'admin',
      body: { active: !cust.active },
    });
    await loadCustomers();
    setFeedback(`Customer "${cust.name}" is now ${!cust.active ? 'Active' : 'Deactivated'}.`);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await apiRequest(`/api/admin/customers/${editing.id}`, {
      method: 'PUT',
      scope: 'admin',
      body: {
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        active: editing.active,
      },
    });
    setEditing(null);
    await loadCustomers();
    setFeedback('Customer profile updated.');
  };

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Customer Accounts Management</h2>
        <p className="text-xs text-slate-600">
          Review registered client accounts, update contact details, or activate and deactivate portal access.
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
          {feedback}
        </div>
      )}

      {editing && (
        <form onSubmit={saveEdit} className="bg-white border border-slate-200 rounded-md p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-[#0B192C]">Edit Customer Details</h3>
            <button type="button" onClick={() => setEditing(null)} className="text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                required
                value={editing.phone}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm font-mono-num border border-slate-300 rounded"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 text-xs border border-slate-300 rounded"
            >
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded">
              Save Customer
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, email, or phone..."
            className="w-full sm:w-80 px-3 py-1.5 text-xs border border-slate-300 rounded"
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading customer accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                  <th className="py-3 px-4 font-semibold">Client Name</th>
                  <th className="py-3 px-4 font-semibold">Email &amp; Phone</th>
                  <th className="py-3 px-4 font-semibold">Saved Plots</th>
                  <th className="py-3 px-4 font-semibold">Registered</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <p>{c.email}</p>
                      <p className="font-mono-num text-slate-500">{c.phone}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-xs text-slate-700">
                      {c.favoritePropertyIds.length}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-xs text-slate-500 whitespace-nowrap">
                      {formatDisplayDate(c.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          c.active ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {c.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded hover:border-[#0B192C]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(c)}
                        className="px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded hover:bg-slate-100"
                      >
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// D. INQUIRY MANAGEMENT MODULE (WITH INTERNAL NOTES & DIRECT CONTACT)
// ============================================================================

export const InquiriesAdminModule: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selected, setSelected] = useState<InquiryItem | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest<{ inquiries: InquiryItem[] }>('/api/admin/inquiries', { scope: 'admin' });
      setInquiries(res.inquiries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  const updateStatus = async (inq: InquiryItem, status: InquiryStatus) => {
    const res = await apiRequest<{ inquiry: InquiryItem }>(`/api/admin/inquiries/${inq.id}`, {
      method: 'PUT',
      scope: 'admin',
      body: { status },
    });
    setInquiries((prev) => prev.map((item) => (item.id === inq.id ? res.inquiry : item)));
    if (selected?.id === inq.id) {
      setSelected(res.inquiry);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !noteInput.trim()) return;
    setSavingNote(true);
    try {
      const res = await apiRequest<{ inquiry: InquiryItem }>(`/api/admin/inquiries/${selected.id}`, {
        method: 'PUT',
        scope: 'admin',
        body: { note: noteInput },
      });
      setNoteInput('');
      setSelected(res.inquiry);
      setInquiries((prev) => prev.map((item) => (item.id === selected.id ? res.inquiry : item)));
    } finally {
      setSavingNote(false);
    }
  };

  const filtered = inquiries.filter((i) => statusFilter === 'All' || i.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Client Inquiries &amp; Lead Desk</h2>
          <p className="text-xs text-slate-600">
            Respond via WhatsApp or phone, update inquiry status, and record internal advisor notes.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded">
          {['All', 'New', 'In Progress', 'Contacted', 'Closed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
                statusFilter === st ? 'bg-[#0B192C] text-white' : 'text-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading inquiries...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No inquiries in this status view.</div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filtered.map((inq) => (
                <button
                  key={inq.id}
                  type="button"
                  onClick={() => setSelected(inq)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                    selected?.id === inq.id ? 'bg-amber-50/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900">{inq.name}</span>
                    <span
                      className={`text-xs font-semibold ${
                        inq.status === 'New'
                          ? 'text-amber-700'
                          : inq.status === 'Closed'
                            ? 'text-slate-500'
                            : 'text-emerald-700'
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#0B192C] mt-0.5">{inq.subject}</p>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{inq.message}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
                    <span>{inq.phone}</span>
                    <span>{formatDisplayDateTime(inq.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-5 space-y-5">
          {!selected ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              Select an inquiry on the left to view full details, contact the customer, or add internal notes.
            </p>
          ) : (
            <>
              <div className="space-y-1 border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold text-[#0B192C]">{selected.name}</h3>
                  <select
                    value={selected.status}
                    onChange={(e) => updateStatus(selected, e.target.value as InquiryStatus)}
                    className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded bg-white"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <p className="text-xs text-slate-600">
                  {selected.email} · <span className="font-mono-num">{selected.phone}</span>
                </p>
                {(selected.propertyTitle || selected.schemeName) && (
                  <p className="text-xs font-semibold text-[#9F7A31] pt-1">
                    {selected.propertyTitle || selected.schemeName}
                    {selected.preferredPlotSize ? ` (${selected.preferredPlotSize})` : ''}
                  </p>
                )}
              </div>

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded border border-slate-200">
                {selected.message}
              </div>

              {/* Direct Customer Contact Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={buildWhatsAppUrl(
                    selected.phone,
                    `Assalam-o-Alaikum ${selected.name}, this is Al Amaan Real Estate & Developers regarding your inquiry "${selected.subject}".`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#25D366] text-white rounded"
                >
                  <WhatsAppLogo className="w-3.5 h-3.5" />
                  <span>Reply on WhatsApp</span>
                </a>
                <a
                  href={`tel:${selected.phone}`}
                  className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded text-slate-800"
                >
                  Call Client
                </a>
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded text-slate-800"
                >
                  Send Email
                </a>
              </div>

              {/* Internal Notes */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <h4 className="text-xs font-semibold text-slate-800">
                  Internal Advisor Notes ({selected.internalNotes.length})
                </h4>

                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Add internal follow-up note (not visible to public)..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded"
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !noteInput.trim()}
                    className="px-4 py-1.5 text-xs font-semibold bg-[#0B192C] text-white rounded disabled:opacity-50"
                  >
                    {savingNote ? 'Saving...' : 'Add Internal Note'}
                  </button>
                </form>

                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {selected.internalNotes.map((n) => (
                    <div key={n.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                      <p className="text-slate-800">{n.note}</p>
                      <p className="mt-1 text-[11px] text-slate-400 font-mono-num">
                        {n.authorName} · {formatDisplayDateTime(n.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// I. TESTIMONIALS MANAGEMENT MODULE
// ============================================================================

export const TestimonialsAdminModule: React.FC = () => {
  const { refreshPublicData } = useSite();
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [editing, setEditing] = useState<Partial<TestimonialItem> | null>(null);
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    const res = await apiRequest<{ testimonials: TestimonialItem[] }>('/api/admin/testimonials', {
      scope: 'admin',
    });
    setItems(res.testimonials);
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        await apiRequest(`/api/admin/testimonials/${editing.id}`, {
          method: 'PUT',
          scope: 'admin',
          body: editing,
        });
      } else {
        await apiRequest('/api/admin/testimonials', {
          method: 'POST',
          scope: 'admin',
          body: editing,
        });
      }
      setEditing(null);
      await loadItems();
      await refreshPublicData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiRequest(`/api/admin/testimonials/${id}`, { method: 'DELETE', scope: 'admin' });
    await loadItems();
    await refreshPublicData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Client Testimonials Management</h2>
          <p className="text-xs text-slate-600">Add, edit, publish, or remove attributable customer reviews.</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() =>
              setEditing({
                name: '',
                role: 'Homeowner & Investor',
                location: 'Lahore',
                investmentContext: 'Al Jalil Garden',
                quote: '',
                published: true,
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded"
          >
            <Plus className="w-4 h-4" />
            <span>Add Review</span>
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-md p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Profession</label>
              <input
                type="text"
                value={editing.role || ''}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City / Country</label>
              <input
                type="text"
                value={editing.location || ''}
                onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property / Scheme Context</label>
              <input
                type="text"
                value={editing.investmentContext || ''}
                onChange={(e) => setEditing({ ...editing, investmentContext: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Client Review Quote *</label>
            <textarea
              rows={3}
              required
              value={editing.quote || ''}
              onChange={(e) => setEditing({ ...editing, quote: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(editing.published)}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              />
              <span>Visible on Homepage</span>
            </label>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-xs border border-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded"
              >
                Save Review
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs text-slate-600 leading-relaxed">“{t.quote}”</p>
              <p className="mt-3 text-sm font-semibold text-[#0B192C]">{t.name}</p>
              <p className="text-xs text-slate-500">
                {t.role} · {t.location} · {t.investmentContext}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className={t.published ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                {t.published ? 'Published' : 'Hidden'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// J. MEDIA LIBRARY MANAGEMENT MODULE (UPLOAD, REPLACE, DELETE)
// ============================================================================

export const MediaAdminModule: React.FC = () => {
  const { refreshPublicData } = useSite();
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadMedia = useCallback(async () => {
    const res = await apiRequest<{ media: MediaAsset[] }>('/api/admin/media', { scope: 'admin' });
    setMedia(res.media);
  }, []);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  const handleUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      await uploadMediaRequest('/api/admin/media/upload', file, titleInput || file.name);
      setTitleInput('');
      await loadMedia();
      setNotice({ type: 'ok', text: 'Image uploaded to media library.' });
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setNotice(null);
    try {
      await uploadMediaRequest(`/api/admin/media/${id}/replace`, file, undefined, 'PUT');
      await loadMedia();
      await refreshPublicData();
      setNotice({ type: 'ok', text: 'Media image replaced and automatically updated across pages.' });
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Replace failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setNotice(null);
    try {
      await apiRequest(`/api/admin/media/${id}`, { method: 'DELETE', scope: 'admin' });
      await loadMedia();
      setNotice({ type: 'ok', text: 'Uploaded image deleted.' });
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Cannot delete asset.' });
    }
  };

  const copyUrl = (asset: MediaAsset) => {
    void navigator.clipboard?.writeText(asset.url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Website Media Library</h2>
        <p className="text-xs text-slate-600">
          Upload high-resolution property photography, replace existing website banners, or copy URLs for schemes and SEO.
        </p>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded text-xs border ${
            notice.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          placeholder="Optional image label (e.g. Tulip Block Park)"
          className="flex-1 min-w-[220px] px-3.5 py-2 text-xs border border-slate-300 rounded"
        />
        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742]">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload New Image'}</span>
          <input type="file" accept="image/*" onChange={handleUploadNew} className="hidden" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {media.map((m) => (
          <div key={m.id} className="bg-white border border-slate-200 rounded-md overflow-hidden flex flex-col">
            <div className="aspect-[16/10] bg-slate-900">
              <ResilientImage src={m.url} alt={m.title} />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-900 truncate">{m.title}</p>
                <p className="font-mono-num text-[11px] text-slate-400 truncate mt-0.5">{m.url}</p>
              </div>
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => copyUrl(m)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-[#0B192C]"
                >
                  {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === m.id ? 'Copied' : 'Copy Path'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-slate-200 rounded hover:border-[#0B192C]">
                    <RefreshCw className="w-3 h-3" />
                    <span>Replace</span>
                    <input type="file" accept="image/*" onChange={(e) => handleReplace(m.id, e)} className="hidden" />
                  </label>

                  {!m.isSystemAsset && (
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Delete uploaded image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// N. ACTIVITY LOGS MODULE
// ============================================================================

export const ActivityLogsAdminModule: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [filterModule, setFilterModule] = useState('All');

  useEffect(() => {
    apiRequest<{ logs: ActivityLogItem[] }>('/api/admin/activity-logs', { scope: 'admin' }).then((res) =>
      setLogs(res.logs)
    );
  }, []);

  const modules = Array.from(new Set(logs.map((l) => l.module)));
  const visible = logs.filter((l) => filterModule === 'All' || l.module === filterModule);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">Administrative Activity Audit Logs</h2>
          <p className="text-xs text-slate-600">
            Chronological audit trail of administrative changes across schemes, properties, settings, and accounts.
          </p>
        </div>

        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded bg-white"
        >
          <option value="All">All Modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Administrator</th>
                <th className="py-3 px-4 font-semibold">Module</th>
                <th className="py-3 px-4 font-semibold">Operation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {visible.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono-num text-slate-500 whitespace-nowrap">
                    {formatDisplayDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    {log.actorName}{' '}
                    <span className="text-slate-400 font-normal">({log.actorRole})</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#9F7A31] whitespace-nowrap">{log.module}</td>
                  <td className="py-3 px-4 text-slate-700">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
