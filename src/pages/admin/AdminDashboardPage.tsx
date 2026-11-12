import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Activity,
  Building2,
  Compass,
  ExternalLink,
  FileText,
  Globe,
  Home,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Phone,
  Quote,
  Search,
  Settings,
  Share2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { apiRequest } from '../../services/api';
import type { AdminDashboardStats } from '../../types/models';
import { DynamicSEO } from '../../components/DynamicSEO';
import { formatDisplayDate, formatDisplayDateTime } from '../../utils/formatters';
import { PropertiesAdminModule, SchemesAdminModule } from './AdminSchemesPropertiesModules';
import {
  ActivityLogsAdminModule,
  CustomersAdminModule,
  InquiriesAdminModule,
  MediaAdminModule,
  TestimonialsAdminModule,
} from './AdminOperationsModules';
import {
  AdminProfileModule,
  ContactAdminModule,
  NavigationAdminModule,
  SeoAdminModule,
  SettingsAdminModule,
  SocialAdminModule,
  WebsiteContentAdminModule,
} from './AdminCmsSettingsModules';

type AdminModuleId =
  | 'overview'
  | 'schemes'
  | 'properties'
  | 'customers'
  | 'inquiries'
  | 'content'
  | 'contact'
  | 'social'
  | 'navigation'
  | 'testimonials'
  | 'media'
  | 'seo'
  | 'profile'
  | 'settings'
  | 'logs';

interface SidebarEntry {
  id: AdminModuleId;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const SIDEBAR_MODULES: SidebarEntry[] = [
  { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
  { id: 'schemes', label: 'Scheme Management', icon: Compass },
  { id: 'properties', label: 'Property Management', icon: Building2 },
  { id: 'inquiries', label: 'Inquiry Management', icon: MessageSquare },
  { id: 'customers', label: 'Customer Accounts', icon: Users },
  { id: 'content', label: 'Website Content & Stats', icon: FileText },
  { id: 'contact', label: 'Contact & WhatsApp', icon: Phone },
  { id: 'social', label: 'Social Media Links', icon: Share2 },
  { id: 'navigation', label: 'Navigation Menus', icon: Globe },
  { id: 'testimonials', label: 'Client Testimonials', icon: Quote },
  { id: 'media', label: 'Media Library', icon: ImageIcon },
  { id: 'seo', label: 'SEO Management', icon: Search },
  { id: 'profile', label: 'Admin Profile & Team', icon: UserCheck },
  { id: 'settings', label: 'General Settings', icon: Settings },
  { id: 'logs', label: 'Activity Logs', icon: Activity },
];

export const AdminDashboardPage: React.FC = () => {
  const { admin, adminLoading, logoutAdmin, data } = useSite();
  const navigate = useNavigate();

  const [activeModule, setActiveModule] = useState<AdminModuleId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await apiRequest<AdminDashboardStats>('/api/admin/overview', { scope: 'admin' });
      setStats(res);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (admin && activeModule === 'overview') {
      void loadOverview();
    }
  }, [admin, activeModule, loadOverview]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs text-slate-500">
        Verifying administrator session...
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const currentModuleMeta = SIDEBAR_MODULES.find((m) => m.id === activeModule) || SIDEBAR_MODULES[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <DynamicSEO customTitle={`Admin Console — ${currentModuleMeta.label} | ${data?.settings.siteName || 'Al Amaan'}`} />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* 264px Dark Navy Enterprise Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[264px] bg-[#07111E] text-slate-200 flex flex-col border-r border-white/10 transition-transform duration-150 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <Link to="/" className="font-display text-xl font-semibold text-white tracking-wide truncate">
            {data?.settings.shortName || 'Al Amaan'} Admin
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {SIDEBAR_MODULES.map((mod) => {
            const Icon = mod.icon;
            const active = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveModule(mod.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors ${
                  active
                    ? 'bg-[#B89146] text-[#07111E] font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{mod.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
          <div className="text-xs">
            <p className="font-semibold text-white truncate">{admin.name}</p>
            <p className="text-[11px] text-[#D4AF37] uppercase font-mono-num">{admin.role}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logoutAdmin();
              navigate('/admin/login');
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold border border-white/20 rounded text-slate-200 hover:bg-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Workspace Main Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-5 sm:px-8 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin sidebar"
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
              <span className="hidden sm:inline">Admin Console</span>
              <span className="hidden sm:inline" aria-hidden="true">/</span>
              <span className="font-semibold text-[#0B192C] truncate">{currentModuleMeta.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border border-slate-300 text-slate-800 rounded hover:border-[#0B192C] whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5" />
              <span>View Public Website</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Active Module Content */}
        <main className="flex-1 p-5 sm:p-8 max-w-[1240px] w-full mx-auto">
          {activeModule === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="font-display text-3xl font-semibold text-[#0B192C]">
                  Executive Operations Overview
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Live metrics across housing schemes, property inventory, client registrations, and advisory inquiries.
                </p>
              </div>

              {loadingStats || !stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-24 bg-white border border-slate-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* 9 Core Admin KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">Total Customers</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-[#0B192C]">
                        {stats.totalCustomers}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">Registered Accounts</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-[#0B192C]">
                        {stats.totalAccounts}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">Housing Schemes</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-[#0B192C]">
                        {stats.totalSchemes}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">Total Properties</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-[#0B192C]">
                        {stats.totalProperties}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">Available Plots / Homes</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-emerald-700">
                        {stats.availableProperties}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">Reserved Properties</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-amber-700">
                        {stats.reservedProperties}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">Sold Properties</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-rose-700">
                        {stats.soldProperties}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">Total Inquiries</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-[#0B192C]">
                        {stats.totalInquiries}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">New Unread Inquiries</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-[#9F7A31]">
                        {stats.newInquiries}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between">
                      <p className="text-[11px] text-slate-500">Quick Action</p>
                      <button
                        type="button"
                        onClick={() => setActiveModule('properties')}
                        className="text-left text-xs font-semibold text-[#0B192C] hover:text-[#9F7A31] underline"
                      >
                        + Add Property / Plot
                      </button>
                    </div>
                  </div>

                  {/* Recent Customer Registrations & Recent Admin Activities */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-display text-xl font-semibold text-[#0B192C]">
                          Recent Customer Registrations
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveModule('customers')}
                          className="text-xs font-semibold text-[#9F7A31] hover:underline"
                        >
                          Manage All
                        </button>
                      </div>
                      <div className="divide-y divide-slate-200 text-xs">
                        {stats.recentCustomers.map((c) => (
                          <div key={c.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                              <p className="text-slate-500 truncate">{c.email}</p>
                            </div>
                            <div className="text-right font-mono-num text-slate-500 shrink-0">
                              <p>{c.phone}</p>
                              <p className="text-[11px] text-slate-400">{formatDisplayDate(c.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-6 bg-white border border-slate-200 rounded-md overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-display text-xl font-semibold text-[#0B192C]">
                          Recent Administrative Activity
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveModule('logs')}
                          className="text-xs font-semibold text-[#9F7A31] hover:underline"
                        >
                          Full Audit Log
                        </button>
                      </div>
                      <div className="divide-y divide-slate-200 text-xs">
                        {stats.recentActivities.slice(0, 6).map((act) => (
                          <div key={act.id} className="px-5 py-3.5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#9F7A31]">{act.module}</span>
                              <span className="font-mono-num text-[11px] text-slate-400">
                                {formatDisplayDateTime(act.createdAt)}
                              </span>
                            </div>
                            <p className="text-slate-700">{act.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeModule === 'schemes' && <SchemesAdminModule />}
          {activeModule === 'properties' && <PropertiesAdminModule />}
          {activeModule === 'customers' && <CustomersAdminModule />}
          {activeModule === 'inquiries' && <InquiriesAdminModule />}
          {activeModule === 'content' && <WebsiteContentAdminModule />}
          {activeModule === 'contact' && <ContactAdminModule />}
          {activeModule === 'social' && <SocialAdminModule />}
          {activeModule === 'navigation' && <NavigationAdminModule />}
          {activeModule === 'testimonials' && <TestimonialsAdminModule />}
          {activeModule === 'media' && <MediaAdminModule />}
          {activeModule === 'seo' && <SeoAdminModule />}
          {activeModule === 'profile' && <AdminProfileModule />}
          {activeModule === 'settings' && <SettingsAdminModule />}
          {activeModule === 'logs' && <ActivityLogsAdminModule />}
        </main>
      </div>
    </div>
  );
};
