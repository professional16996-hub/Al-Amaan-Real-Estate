import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Heart, LogOut, MessageSquare, Send, User } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { apiRequest } from '../services/api';
import type { InquiryItem, PropertyItem } from '../types/models';
import { DynamicSEO } from '../components/DynamicSEO';
import { PropertyCard } from '../components/PropertyCard';
import { WhatsAppLogo } from '../components/WhatsAppIcon';
import { buildWhatsAppUrl, formatDisplayDateTime } from '../utils/formatters';

type DashboardTab = 'favorites' | 'inquiries' | 'contact' | 'profile';

export const CustomerDashboardPage: React.FC = () => {
  const { customer, customerLoading, logoutCustomer, refreshCustomer, data } = useSite();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DashboardTab>('favorites');
  const [favorites, setFavorites] = useState<PropertyItem[]>([]);
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loadingDash, setLoadingDash] = useState(true);

  // Profile form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Direct Agency Contact form
  const [subject, setSubject] = useState('Priority Client Advisory Request');
  const [message, setMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [contactNotice, setContactNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoadingDash(true);
      const res = await apiRequest<{
        inquiries: InquiryItem[];
        favorites: PropertyItem[];
      }>('/api/customer/dashboard', { scope: 'customer' });
      setInquiries(res.inquiries);
      setFavorites(res.favorites);
    } catch {
      // Handled by session check
    } finally {
      setLoadingDash(false);
    }
  }, []);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email);
      void loadDashboard();
    }
  }, [customer, customer?.favoritePropertyIds.length, loadDashboard]);

  if (customerLoading) {
    return (
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-24">
        <div className="h-64 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  if (!customer) {
    return <Navigate to="/login?redirect=/dashboard" replace />;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/customer/profile', {
        method: 'PUT',
        scope: 'customer',
        body: {
          name,
          phone,
          email,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        },
      });
      setCurrentPassword('');
      setNewPassword('');
      await refreshCustomer();
      setProfileMsg({ type: 'ok', text: res.message });
    } catch (err) {
      setProfileMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactNotice(null);
    setSendingMsg(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/public/inquiries', {
        method: 'POST',
        scope: 'customer',
        body: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          subject,
          message,
        },
      });
      setMessage('');
      setContactNotice({ type: 'ok', text: res.message });
      await loadDashboard();
    } catch (err) {
      setContactNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to send message.',
      });
    } finally {
      setSendingMsg(false);
    }
  };

  const whatsappDirect = buildWhatsAppUrl(
    data?.contact.whatsappNumber || '923008459920',
    `Assalam-o-Alaikum ${data?.settings.siteName || 'Al Amaan Real Estate'}, this is ${customer.name} (${customer.phone}). I am reaching out from my Client Portal.`
  );

  return (
    <div className="min-h-[80vh] bg-[#F8FAFC]">
      <DynamicSEO customTitle={`Client Dashboard — ${customer.name} | ${data?.settings.siteName || 'Al Amaan'}`} />

      {/* Header */}
      <section className="bg-[#0B192C] text-white py-12 border-b border-white/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-[#D4AF37]">Verified Client Account</p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold">
              Welcome, {customer.name}
            </h1>
            <p className="mt-1 text-xs text-slate-300 font-mono-num">
              {customer.email} · {customer.phone}
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logoutCustomer();
              navigate('/');
            }}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border border-white/25 rounded text-slate-200 hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 space-y-8">
          {/* KPI Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-md p-5">
              <p className="text-xs text-slate-500">Saved Favorite Properties</p>
              <p className="mt-1 font-mono-num text-2xl font-semibold text-[#0B192C]">
                {favorites.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-md p-5">
              <p className="text-xs text-slate-500">Submitted Inquiries</p>
              <p className="mt-1 font-mono-num text-2xl font-semibold text-[#0B192C]">
                {inquiries.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-md p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Priority WhatsApp Desk</p>
                <p className="mt-1 text-sm font-semibold text-[#0B192C]">Direct Advisor Line</p>
              </div>
              <a
                href={whatsappDirect}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#25D366] text-white rounded hover:bg-[#1ebe5d]"
              >
                <WhatsAppLogo className="w-4 h-4" />
                <span>Chat</span>
              </a>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-md w-fit">
            {[
              { id: 'favorites', label: `Saved Properties (${favorites.length})`, icon: Heart },
              { id: 'inquiries', label: `My Inquiries (${inquiries.length})`, icon: MessageSquare },
              { id: 'contact', label: 'Contact Agency Directly', icon: Send },
              { id: 'profile', label: 'Personal Profile', icon: User },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id as DashboardTab)}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                    activeTab === t.id
                      ? 'bg-[#0B192C] text-white'
                      : 'text-slate-700 hover:text-[#0B192C]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Views */}
          {activeTab === 'favorites' && (
            <div>
              {loadingDash ? (
                <div className="h-56 bg-white border border-slate-200 rounded animate-pulse" />
              ) : favorites.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-md p-12 text-center space-y-3">
                  <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
                    No Saved Properties Yet
                  </h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Click the heart icon on any plot or residence in Al Jalil Garden or Lahore to bookmark it in your private portfolio.
                  </p>
                  <Link
                    to="/properties"
                    className="inline-block px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
                  >
                    Explore Available Properties
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((prop) => (
                    <PropertyCard key={prop.id} property={prop} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
              {inquiries.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
                    No Inquiries Submitted Yet
                  </h2>
                  <p className="text-sm text-slate-600">
                    When you inquire about any housing scheme or property, live status updates appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('contact')}
                    className="px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
                  >
                    Submit Your First Inquiry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                        <th className="py-3.5 px-5 font-semibold">Subject &amp; Context</th>
                        <th className="py-3.5 px-5 font-semibold">Message</th>
                        <th className="py-3.5 px-5 font-semibold">Status</th>
                        <th className="py-3.5 px-5 font-semibold text-right">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {inquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-slate-50/60">
                          <td className="py-4 px-5 align-top">
                            <p className="font-semibold text-slate-900">{inq.subject}</p>
                            {(inq.propertyTitle || inq.schemeName) && (
                              <p className="text-xs text-[#9F7A31] mt-0.5">
                                {inq.propertyTitle || inq.schemeName}
                                {inq.preferredPlotSize ? ` · ${inq.preferredPlotSize}` : ''}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-5 align-top text-xs text-slate-600 max-w-md">
                            {inq.message}
                          </td>
                          <td className="py-4 px-5 align-top whitespace-nowrap">
                            <span
                              className={`text-xs font-semibold ${
                                inq.status === 'New'
                                  ? 'text-amber-700'
                                  : inq.status === 'Closed'
                                    ? 'text-slate-600'
                                    : 'text-emerald-700'
                              }`}
                            >
                              {inq.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 align-top text-right font-mono-num text-xs text-slate-500 whitespace-nowrap">
                            {formatDisplayDateTime(inq.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="max-w-2xl bg-white border border-slate-200 rounded-md p-6 sm:p-8 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
                  Message Your Dedicated Advisory Desk
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Your message is automatically linked to your verified client account ({customer.email}).
                </p>
              </div>

              {contactNotice && (
                <div
                  className={`p-3.5 rounded text-xs border ${
                    contactNotice.type === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {contactNotice.text}
                </div>
              )}

              <form onSubmit={handleSendDirectMessage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Message *</label>
                  <textarea
                    rows={5}
                    required
                    minLength={10}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about plot verification, installment plans, or schedule an on-site visit in Al Jalil Garden..."
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={sendingMsg}
                    className="px-6 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60"
                  >
                    {sendingMsg ? 'Sending...' : 'Submit Priority Inquiry'}
                  </button>
                  <a
                    href={whatsappDirect}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold border border-slate-300 text-slate-800 rounded hover:border-[#25D366]"
                  >
                    <WhatsAppLogo className="w-4 h-4 text-[#25D366]" />
                    <span>Open WhatsApp Instead</span>
                  </a>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl bg-white border border-slate-200 rounded-md p-6 sm:p-8 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
                  Personal Profile &amp; Password
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Keep your phone and email updated so our transfer desk can reach you promptly.
                </p>
              </div>

              {profileMsg && (
                <div
                  className={`p-3.5 rounded text-xs border ${
                    profileMsg.type === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowPasswords((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#0B192C]"
                    >
                      {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Current Password (only if changing)
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        New Password
                      </label>
                      <input
                        type={showPasswords ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
