export interface PlotCategory {
  id: string;
  size: string;
  category: 'Residential' | 'Commercial';
  startingPrice: number;
  maxPrice?: number;
  installmentAvailable: boolean;
  description: string;
}

export type ProjectStatus = 'Upcoming' | 'Ongoing' | 'Completed';

export interface ProjectPaymentPlan {
  id: string;
  planName: string;
  plotSize: string;
  totalPrice: number;
  downPayment: number;
  installmentDuration: string;
  monthlyInstallment: number;
  possessionCharges?: string;
  notes?: string;
}

export interface ProjectDevelopmentUpdate {
  id: string;
  title: string;
  phase: string;
  date: string;
  progressPercent?: number;
  summary: string;
  image?: string;
}

export interface HousingScheme {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  status?: ProjectStatus;
  projectLogo?: string;
  location: string;
  city: string;
  approvalStatus: string;
  description: string;
  overviewHighlights: string[];
  heroImage: string;
  gallery: string[];
  facilities: string[];
  plotCategories: PlotCategory[];
  paymentPlans?: ProjectPaymentPlan[];
  developmentUpdates?: ProjectDevelopmentUpdate[];
  mapEmbedUrl: string;
  googleMapsUrl: string;
  contactPerson: string;
  contactPhone: string;
  whatsappNumber?: string;
  contactEmail: string;
  published: boolean;
  featured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type PropertyCategory =
  | 'Residential Plot'
  | 'Commercial Plot'
  | 'Luxury Residence'
  | 'Commercial Plaza';

export type PropertyStatus = 'Available' | 'Reserved' | 'Sold';

export interface PropertyItem {
  id: string;
  referenceCode: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  location: string;
  city: string;
  schemeId: string;
  schemeName?: string;
  schemeSlug?: string;
  size: string;
  areaSqFt: number;
  category: PropertyCategory;
  status: PropertyStatus;
  featured: boolean;
  images: string[];
  features: string[];
  bedrooms?: number;
  bathrooms?: number;
  possessionReady: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'customer' | 'super_admin' | 'editor' | 'support';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  favoritePropertyIds: string[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface InquiryNote {
  id: string;
  authorId: string;
  authorName: string;
  note: string;
  createdAt: string;
}

export type InquiryStatus = 'New' | 'In Progress' | 'Contacted' | 'Closed';

export interface InquiryItem {
  id: string;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  propertyId?: string;
  propertyTitle?: string;
  schemeId?: string;
  schemeName?: string;
  preferredPlotSize?: string;
  status: InquiryStatus;
  internalNotes: InquiryNote[];
  createdAt: string;
  updatedAt: string;
}

export interface StatMetric {
  id: string;
  value: string;
  label: string;
  context: string;
}

export interface ServiceItem {
  id: string;
  indexLabel: string;
  title: string;
  summary: string;
  deliverables: string[];
}

export interface WhyChooseItem {
  id: string;
  title: string;
  description: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  location: string;
  investmentContext: string;
  quote: string;
  published: boolean;
  createdAt: string;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  isExternal: boolean;
  visible: boolean;
  order: number;
  placement: 'header' | 'footer_explore' | 'footer_legal';
}

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  isSystemAsset: boolean;
  uploadedAt: string;
}

export interface PageSEOConfig {
  pageKey: string;
  pageLabel: string;
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
}

export interface SiteSettings {
  siteName: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  currency: string;
  primaryColor: string;
  accentColor: string;
  whatsappFloatingEnabled: boolean;
  whatsappDefaultMessage: string;
}

export interface ContactConfig {
  primaryPhone: string;
  secondaryPhone: string;
  whatsappNumber: string;
  email: string;
  supportEmail: string;
  officeAddress: string;
  city: string;
  officeHours: string;
  googleMapsUrl: string;
  mapEmbedUrl: string;
}

export interface SocialConfig {
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
}

export interface WebsiteContent {
  heroHeadline: string;
  heroIntroduction: string;
  heroImage: string;
  heroExplorePropertiesLabel: string;
  heroExploreSchemesLabel: string;
  heroContactLabel: string;
  featuredSchemeSectionKicker: string;
  featuredSchemeSectionHeading: string;
  featuredSchemeSectionSummary: string;
  moreProjectsHeading?: string;
  moreProjectsSummary?: string;
  whyChooseHeading: string;
  whyChooseSummary: string;
  whyChooseItems: WhyChooseItem[];
  servicesHeading: string;
  servicesSummary: string;
  servicesItems: ServiceItem[];
  statsHeading: string;
  statistics: StatMetric[];
  aboutHeadline: string;
  aboutStory: string;
  aboutMission: string;
  aboutVision: string;
  aboutImage: string;
  privacyPolicyContent: string;
  termsConditionsContent: string;
}

export type NotificationCategory =
  | 'project'
  | 'property'
  | 'development'
  | 'payment_plan'
  | 'inquiry'
  | 'announcement';

export interface SiteNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  link: string;
  targetAudience: 'all' | 'customer' | 'admin';
  targetCustomerId?: string;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  module: string;
  details: string;
  createdAt: string;
}

export interface PublicBootstrapPayload {
  settings: SiteSettings;
  contact: ContactConfig;
  social: SocialConfig;
  content: WebsiteContent;
  navigation: NavItem[];
  seo: PageSEOConfig[];
  testimonials: TestimonialItem[];
  schemes: HousingScheme[];
  properties: PropertyItem[];
}

export interface AdminProjectAnalyticsItem {
  projectId: string;
  projectName: string;
  status: ProjectStatus;
  totalProperties: number;
  available: number;
  reserved: number;
  sold: number;
  inquiriesCount: number;
  avgDevelopmentProgress: number;
}

export interface AdminTrendPoint {
  label: string;
  inquiries: number;
  customers: number;
  listings: number;
}

export interface AdminAnalyticsPayload {
  projectBreakdown: AdminProjectAnalyticsItem[];
  inquiryStatusBreakdown: {
    newCount: number;
    contactedCount: number;
    closedCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    count: number;
  }>;
  trendSeries: AdminTrendPoint[];
  avgDevelopmentProgress: number;
  inquiryResolutionRate: number;
}

export interface AdminDashboardStats {
  totalCustomers: number;
  totalAccounts: number;
  totalAdmins: number;
  totalSchemes: number;
  publishedSchemes: number;
  totalProperties: number;
  availableProperties: number;
  soldProperties: number;
  reservedProperties: number;
  totalInquiries: number;
  newInquiries: number;
  recentCustomers: UserAccount[];
  recentActivities: ActivityLogItem[];
  analytics: AdminAnalyticsPayload;
}
