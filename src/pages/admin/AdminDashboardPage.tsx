import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  Compass,
  ExternalLink,
  FileText,
  FolderPlus,
  Globe,
  Home,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
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
import { NotificationBell } from '../../components/NotificationBell';
import {
  AnalogDialGaugePanel,
  DonutRingChart,
  LineTrendChart,
  PortfolioBarChart,
} from '../../components/AnalyticsCharts';
import { formatDisplayDate, formatDisplayDateTime } from '../../utils/formatters';
import { PropertiesAdminModule, SchemesAdminModule } from './AdminSchemesPropertiesModules';
import {
  AddProjectAdminModule,
  ProjectGalleryAdminModule,
  ProjectInfoAdminModule,
  ProjectPaymentPlansAdminModule,
  ProjectUpdatesAdminModule,
} from './AdminProjectWorkspaceModules';
import {
  ActivityLogsAdminModule,
  CustomersAdminModule,
  InquiriesAdminModule,
  MediaAdminModule,
  NotificationsAdminModule,
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
  | 'analytics'
  | 'schemes'
  | 'add-project'
  | 'project-gallery'
  | 'project-info'
  | 'project-payment-plans'
  | 'project-updates'
  | 'properties'
  | 'inquiries'
  | 'notifications'
  | 'customers'
  | 'homepage'
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
  group: 'Projects Workspace' | 'Inventory & CRM' | 'Website & CMS' | 'System & Settings';
  icon: React.FC<{ className?: string }>;
}

const SIDEBAR_MODULES: SidebarEntry[] = [
  { id: 'overview', label: 'Dashboard', group: 'Projects Workspace', icon: LayoutDashboard },
  { id: 'analytics', label: 'Analytics & Analog', group: 'Projects Workspace', icon: BarChart3 },
  { id: 'schemes', label: 'Manage Projects', group: 'Projects Workspace', icon: Compass },
  { id: 'add-project', label: 'Add New Project', group: 'Projects Workspace', icon: FolderPlus },
  { id: 'project-gallery', label: 'Project Gallery', group: 'Projects Workspace', icon: ImageIcon },
  { id: 'project-info', label: 'Project Information', group: 'Projects Workspace', icon: FileText },
  { id: 'project-payment-plans', label: 'Payment Plans', group: 'Projects Workspace', icon: Layers },
  { id: 'project-updates', label: 'Development Updates', group: 'Projects Workspace', icon: Calendar },

  { id: 'properties', label: 'Plots & Properties', group: 'Inventory & CRM', icon: Building2 },
  { id: 'inquiries', label: 'Customer Inquiries', group: 'Inventory & CRM', icon: MessageSquare },
  { id: 'notifications', label: 'Notifications & Alerts', group: 'Inventory & CRM', icon: Bell },
  { id: 'customers', label: 'Customer Accounts', group: 'Inventory & CRM', icon: Users },
  { id: 'testimonials', label: 'Client Testimonials', group: 'Inventory & CRM', icon: Quote },

  { id: 'homepage', label: 'Manage Homepage', group: 'Website & CMS', icon: LayoutTemplate },
  { id: 'content', label: 'Manage Website Content', group: 'Website & CMS', icon: FileText },
  { id: 'contact', label: 'Contact Details', group: 'Website & CMS', icon: Phone },
  { id: 'social', label: 'Social Media Links', group: 'Website & CMS', icon: Share2 },
  { id: 'media', label: 'Media Library', group: 'Website & CMS', icon: ImageIcon },
  { id: 'navigation', label: 'Navigation Menus', group: 'Website & CMS', icon: Globe },

  { id: 'seo', label: 'SEO Management', group: 'System & Settings', icon: Search },
  { id: 'settings', label: 'Website Settings', group: 'System & Settings', icon: Settings },
  { id: 'profile', label: 'Admin Profile & Team', group: 'System & Settings', icon: UserCheck },
  { id: 'logs', label: 'Activity Logs', group: 'System & Settings', icon: Activity },
];

const GROUPS: SidebarEntry['group'][] = [
  'Projects Workspace',
  'Inventory & CRM',
  'Website & CMS',
  'System & Settings',
];

export const AdminDashboardPage: React.FC = () => {
  const { admin, adminLoading, logoutAdmin, data } = useSite();
  const navigate = useNavigate();

  const [activeModule, setActiveModule] = useState<AdminModuleId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [propertySchemeFilter, setPropertySchemeFilter] = useState<string>('');
  const [autoCreatePlotForScheme, setAutoCreatePlotForScheme] = useState<string | null>(null);
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
    if (admin && (activeModule === 'overview' || activeModule === 'analytics')) {
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

  const openProjectWorkspace = (
    mod: 'schemes' | 'project-gallery' | 'project-info' | 'project-payment-plans' | 'project-updates',
    projectId?: string
  ) => {
    if (projectId) setSelectedProjectId(projectId);
    setActiveModule(mod);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-x-hidden">
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
            aria-label="Close admin sidebar"
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {GROUPS.map((group) => (
            <div key={group} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group}
              </p>
              <div className="space-y-0.5">
                {SIDEBAR_MODULES.filter((m) => m.group === group).map((mod) => {
                  const Icon = mod.icon;
                  const active = activeModule === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => {
                        if (mod.id === 'properties') {
                          setPropertySchemeFilter('');
                          setAutoCreatePlotForScheme(null);
                        }
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
              </div>
            </div>
          ))}
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
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold border border-white/20 rounded text-slate-200 hover:bg-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Workspace Main Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin sidebar"
              className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 rounded border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
              <span className="hidden sm:inline">Admin Console</span>
              <span className="hidden sm:inline" aria-hidden="true">/</span>
              <span className="font-semibold text-[#0B192C] truncate">{currentModuleMeta.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationBell variant="light-header" />
            <button
              type="button"
              onClick={() => setActiveModule('add-project')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#B89146] text-[#0B192C] rounded hover:bg-[#cfa95e] whitespace-nowrap"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Add Project</span>
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-300 text-slate-800 rounded hover:border-[#0B192C] whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Public Site</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Active Module Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1240px] w-full mx-auto">
          {activeModule === 'overview' && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-semibold text-[#0B192C]">
                    Executive Operations Overview
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Manage multiple real estate projects, plot inventory, mobile galleries, and client inquiries from any device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModule('add-project')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] min-h-[44px]"
                >
                  <FolderPlus className="w-4 h-4 text-[#D4AF37]" />
                  <span>Add New Project</span>
                </button>
              </div>

              {loadingStats || !stats ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-24 bg-white border border-slate-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Mobile & Desktop Quick Action Workspace Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className="bg-white border border-slate-200 rounded-md p-4">
                      <p className="text-[11px] text-slate-500">Total Projects</p>
                      <p className="mt-1 font-mono-num text-2xl font-semibold text-[#0B192C]">
                        {stats.totalSchemes}
                      </p>
                      <p className="text-[10px] text-emerald-700 mt-0.5">{stats.publishedSchemes} published</p>
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
                    <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between gap-1.5 col-span-2 lg:col-span-1">
                      <p className="text-[11px] text-slate-500">Mobile Quick Jump</p>
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveModule('schemes')}
                          className="text-left text-xs font-semibold text-[#0B192C] hover:text-[#9F7A31] underline"
                        >
                          Manage Projects ({stats.totalSchemes})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveModule('project-gallery')}
                          className="text-left text-xs font-semibold text-[#0B192C] hover:text-[#9F7A31] underline"
                        >
                          Upload Project Photos
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveModule('project-payment-plans')}
                          className="text-left text-xs font-semibold text-[#0B192C] hover:text-[#9F7A31] underline"
                        >
                          Edit Payment Plans
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4-Type Interactive Analytics & Analog Dial Gauges */}
                  {stats.analytics && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="font-display text-2xl font-semibold text-[#0B192C]">
                            Portfolio Analytics &amp; Analog Gauges
                          </h2>
                          <p className="text-xs text-slate-500">
                            Live line trend, project inventory bars, status donut breakdown, and calibrated analog meters.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveModule('analytics')}
                          className="text-xs font-semibold text-[#9F7A31] hover:underline"
                        >
                          Open Full Analytics View
                        </button>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <LineTrendChart
                          title="Inquiries, Customers & Listings Trend"
                          subtitle="6-month activity across inquiries, client signups, and added properties"
                          labels={stats.analytics.trendSeries.map((t) => t.label)}
                          series={[
                            {
                              key: 'inquiries',
                              label: 'Inquiries',
                              color: '#B89146',
                              values: stats.analytics.trendSeries.map((t) => t.inquiries),
                            },
                            {
                              key: 'customers',
                              label: 'Customers',
                              color: '#0B192C',
                              values: stats.analytics.trendSeries.map((t) => t.customers),
                            },
                            {
                              key: 'listings',
                              label: 'Listings',
                              color: '#10B981',
                              values: stats.analytics.trendSeries.map((t) => t.listings),
                            },
                          ]}
                        />

                        <PortfolioBarChart
                          title="Project-Wise Inventory Breakdown"
                          subtitle="Available, Reserved, and Sold listings inside each project"
                          items={stats.analytics.projectBreakdown.map((proj) => ({
                            label: proj.projectName,
                            segments: [
                              { key: 'avail', label: 'Available', value: proj.available, color: '#10B981' },
                              { key: 'res', label: 'Reserved', value: proj.reserved, color: '#D97706' },
                              { key: 'sold', label: 'Sold', value: proj.sold, color: '#E11D48' },
                            ],
                          }))}
                        />

                        <DonutRingChart
                          title="Property Availability & Sales Mix"
                          subtitle="Live status share across your entire property database"
                          centerLabel="Total Plots"
                          slices={[
                            {
                              id: 'available',
                              label: 'Available',
                              value: stats.availableProperties,
                              color: '#10B981',
                            },
                            {
                              id: 'reserved',
                              label: 'Reserved',
                              value: stats.reservedProperties,
                              color: '#D97706',
                            },
                            {
                              id: 'sold',
                              label: 'Sold',
                              value: stats.soldProperties,
                              color: '#E11D48',
                            },
                          ]}
                        />

                        <AnalogDialGaugePanel
                          title="Performance & Readiness Meters"
                          subtitle="Precision calibrated analog dials driven by live portfolio records"
                          meters={[
                            {
                              id: 'avail_ratio',
                              label: 'Available Stock',
                              valuePercent:
                                stats.totalProperties > 0
                                  ? (stats.availableProperties / stats.totalProperties) * 100
                                  : 0,
                              detail: `${stats.availableProperties} of ${stats.totalProperties} plots ready`,
                              accentColor: '#10B981',
                            },
                            {
                              id: 'dev_progress',
                              label: 'Site Development',
                              valuePercent: stats.analytics.avgDevelopmentProgress,
                              detail: `Avg across ${stats.totalSchemes} projects`,
                              accentColor: '#B89146',
                            },
                            {
                              id: 'inq_response',
                              label: 'Inquiry Handled',
                              valuePercent: stats.analytics.inquiryResolutionRate,
                              detail: `${stats.totalInquiries - stats.newInquiries} of ${stats.totalInquiries} actioned`,
                              accentColor: '#0B192C',
                            },
                          ]}
                        />
                      </div>
                    </div>
                  )}

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

          {activeModule === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-semibold text-[#0B192C]">
                    Analytics &amp; Analog Telemetry
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    4 live visualization formats: Line Graph, Project Bar Chart, Proportional Donut Rings, and Calibrated Analog Gauges.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadOverview()}
                  className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded bg-white text-slate-700 hover:border-[#0B192C]"
                >
                  Refresh Live Metrics
                </button>
              </div>

              {loadingStats || !stats?.analytics ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-72 bg-white border border-slate-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <LineTrendChart
                      title="Inquiries, Customers & Listings Trend"
                      subtitle="6-month activity trend across real estate inquiries, registered buyers, and inventory"
                      labels={stats.analytics.trendSeries.map((t) => t.label)}
                      series={[
                        {
                          key: 'inquiries',
                          label: 'Inquiries',
                          color: '#B89146',
                          values: stats.analytics.trendSeries.map((t) => t.inquiries),
                        },
                        {
                          key: 'customers',
                          label: 'Customers',
                          color: '#0B192C',
                          values: stats.analytics.trendSeries.map((t) => t.customers),
                        },
                        {
                          key: 'listings',
                          label: 'Listings',
                          color: '#10B981',
                          values: stats.analytics.trendSeries.map((t) => t.listings),
                        },
                      ]}
                    />

                    <PortfolioBarChart
                      title="Project-Wise Inventory Breakdown"
                      subtitle="Tap or hover any project bar to inspect plot status distribution"
                      items={stats.analytics.projectBreakdown.map((proj) => ({
                        label: proj.projectName,
                        segments: [
                          { key: 'avail', label: 'Available', value: proj.available, color: '#10B981' },
                          { key: 'res', label: 'Reserved', value: proj.reserved, color: '#D97706' },
                          { key: 'sold', label: 'Sold', value: proj.sold, color: '#E11D48' },
                        ],
                      }))}
                    />

                    <DonutRingChart
                      title="Property Status & Category Distribution"
                      subtitle="Inventory share between Available, Reserved, and Sold listings"
                      centerLabel="Properties"
                      slices={[
                        {
                          id: 'available',
                          label: 'Available',
                          value: stats.availableProperties,
                          color: '#10B981',
                        },
                        {
                          id: 'reserved',
                          label: 'Reserved',
                          value: stats.reservedProperties,
                          color: '#D97706',
                        },
                        {
                          id: 'sold',
                          label: 'Sold',
                          value: stats.soldProperties,
                          color: '#E11D48',
                        },
                      ]}
                    />

                    <DonutRingChart
                      title="Lead & Inquiry Pipeline Breakdown"
                      subtitle="Real-time status of incoming customer inquiries"
                      centerLabel="Inquiries"
                      slices={[
                        {
                          id: 'new',
                          label: 'New Unread',
                          value: stats.analytics.inquiryStatusBreakdown.newCount,
                          color: '#B89146',
                        },
                        {
                          id: 'contacted',
                          label: 'Contacted',
                          value: stats.analytics.inquiryStatusBreakdown.contactedCount,
                          color: '#0B192C',
                        },
                        {
                          id: 'closed',
                          label: 'Closed / Resolved',
                          value: stats.analytics.inquiryStatusBreakdown.closedCount,
                          color: '#10B981',
                        },
                      ]}
                    />
                  </div>

                  <AnalogDialGaugePanel
                    title="Executive Analog Performance Gauges"
                    subtitle="Calibrated dial meters monitoring inventory readiness, site engineering progress, and client response rate"
                    meters={[
                      {
                        id: 'avail_ratio_full',
                        label: 'Available Inventory Rate',
                        valuePercent:
                          stats.totalProperties > 0
                            ? (stats.availableProperties / stats.totalProperties) * 100
                            : 0,
                        detail: `${stats.availableProperties} of ${stats.totalProperties} listings available`,
                        accentColor: '#10B981',
                      },
                      {
                        id: 'dev_progress_full',
                        label: 'Development Completion',
                        valuePercent: stats.analytics.avgDevelopmentProgress,
                        detail: `Average across ${stats.totalSchemes} projects`,
                        accentColor: '#B89146',
                      },
                      {
                        id: 'inq_response_full',
                        label: 'Inquiry Follow-Up Rate',
                        valuePercent: stats.analytics.inquiryResolutionRate,
                        detail: `${stats.totalInquiries - stats.newInquiries} of ${stats.totalInquiries} inquiries processed`,
                        accentColor: '#0B192C',
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          )}

          {activeModule === 'schemes' && (
            <SchemesAdminModule
              onAddNewProject={() => setActiveModule('add-project')}
              onOpenProjectSection={(mod, projectId) => openProjectWorkspace(mod, projectId)}
              onManageSocietyPlots={(schemeId, openCreate) => {
                setPropertySchemeFilter(schemeId);
                setAutoCreatePlotForScheme(openCreate ? schemeId : null);
                setActiveModule('properties');
              }}
            />
          )}
          {activeModule === 'add-project' && (
            <AddProjectAdminModule
              onProjectCreated={(projectId) => setSelectedProjectId(projectId)}
              onNavigateModule={(mod, projectId) => openProjectWorkspace(mod, projectId)}
            />
          )}
          {activeModule === 'project-gallery' && (
            <ProjectGalleryAdminModule initialProjectId={selectedProjectId} />
          )}
          {activeModule === 'project-info' && (
            <ProjectInfoAdminModule initialProjectId={selectedProjectId} />
          )}
          {activeModule === 'project-payment-plans' && (
            <ProjectPaymentPlansAdminModule initialProjectId={selectedProjectId} />
          )}
          {activeModule === 'project-updates' && (
            <ProjectUpdatesAdminModule initialProjectId={selectedProjectId} />
          )}
          {activeModule === 'properties' && (
            <PropertiesAdminModule
              initialSchemeFilter={propertySchemeFilter}
              autoCreateForSchemeId={autoCreatePlotForScheme}
              onConsumeAutoCreate={() => setAutoCreatePlotForScheme(null)}
            />
          )}
          {activeModule === 'customers' && <CustomersAdminModule />}
          {activeModule === 'inquiries' && <InquiriesAdminModule />}
          {activeModule === 'notifications' && <NotificationsAdminModule />}
          {activeModule === 'homepage' && <WebsiteContentAdminModule focusMode="homepage" />}
          {activeModule === 'content' && <WebsiteContentAdminModule focusMode="all" />}
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
