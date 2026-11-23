import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type {
  ActivityLogItem,
  ContactConfig,
  HousingScheme,
  InquiryItem,
  MediaAsset,
  NavItem,
  PageSEOConfig,
  ProjectDevelopmentUpdate,
  ProjectPaymentPlan,
  PropertyItem,
  SiteNotification,
  SiteSettings,
  SocialConfig,
  TestimonialItem,
  UserAccount,
  WebsiteContent,
} from '../src/types/models.ts';

export interface StoredUser extends UserAccount {
  passwordHash: string;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: number;
  used: boolean;
}

export interface DatabaseSchema {
  users: StoredUser[];
  passwordResets: PasswordResetRecord[];
  schemes: HousingScheme[];
  properties: PropertyItem[];
  inquiries: InquiryItem[];
  testimonials: TestimonialItem[];
  navigation: NavItem[];
  media: MediaAsset[];
  seo: PageSEOConfig[];
  settings: SiteSettings;
  contact: ContactConfig;
  social: SocialConfig;
  content: WebsiteContent;
  activityLogs: ActivityLogItem[];
  notifications: SiteNotification[];
}

const DATA_DIR = path.resolve(process.cwd(), process.env.DATA_DIR || './data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'al-amaan-db.json');

export const ASSET_PATHS = {
  HERO_SOCIETY: '/src/assets/images/hero_lahore_society_1794504538304.jpg',
  AL_JALIL_FEATURED: '/src/assets/images/al_jalil_garden_featured_1794504540747.jpg',
  KANAL_VILLA: '/src/assets/images/property_kanal_villa_1794504541636.jpg',
  TEN_MARLA: '/src/assets/images/property_ten_marla_modern_1794504543789.jpg',
  COMMERCIAL_PLAZA: '/src/assets/images/property_commercial_plaza_1794504544918.jpg',
  RESIDENTIAL_PLOT: '/src/assets/images/property_residential_plot_1794504546024.jpg',
  AGENCY_OFFICE: '/src/assets/images/about_agency_office_1794504546500.jpg',
} as const;

export function generateId(prefix = 'id'): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createInitialSeed(): DatabaseSchema {
  const now = new Date().toISOString();
  const initialAdminEmail = (
    process.env.INITIAL_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'admin@alamaan.com'
  )
    .toLowerCase()
    .trim();
  const initialAdminName = process.env.INITIAL_ADMIN_NAME || 'Tariq Mehmood — Executive Director';
  const initialAdminPassword =
    process.env.INITIAL_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '123456';

  const adminPasswordHash = bcrypt.hashSync(initialAdminPassword, 10);
  const sampleCustomerPasswordHash = bcrypt.hashSync('123456', 10);

  const schemeAlJalilId = 'scheme_al_jalil_garden';
  const schemeWestMarinaId = 'scheme_al_noor_orchard';

  const schemes: HousingScheme[] = [
    {
      id: schemeAlJalilId,
      slug: 'al-jalil-garden',
      name: 'Al Jalil Garden',
      tagline: 'TMA-Approved Master-Planned Gated Community at Faizpur Interchange, Lahore',
      status: 'Ongoing',
      projectLogo: '',
      location: 'Main Sharaqpur Road, Opposite M-2 Motorway Faizpur Interchange, Lahore',
      city: 'Lahore',
      approvalStatus: 'TMA Approved · Possession & Installment Blocks',
      description:
        'Al Jalil Garden is a flagship master-planned gated housing society situated directly opposite the Faizpur Interchange on the Lahore–Islamabad M-2 Motorway, just 8 minutes from District Courts and Thokar Niaz Baig via Lahore Ring Road and Motorway links. Engineered with 100% underground electricity, 150-foot landscaped main boulevards, grand Jamia mosques, dedicated educational and medical complexes, and lush family parks across Phase 1 and Phase 2 (Rose, Jasmine, Tulip, Baidar, and Overseas Blocks), Al Jalil Garden offers both immediate-possession plots and structured development opportunities.',
      overviewHighlights: [
        '8-minute signal-free access from Mall Road & District Courts via Faizpur M-2 Interchange',
        '100% underground electrification, sui gas infrastructure, and water filtration plants',
        'Fully inhabited Phase 1 blocks alongside high-growth Phase 2 possession & investment sectors',
        'Dedicated commercial boulevards, Grand Jamia Mosque, healthcare center, and themed parks',
      ],
      heroImage: ASSET_PATHS.AL_JALIL_FEATURED,
      gallery: [
        ASSET_PATHS.AL_JALIL_FEATURED,
        ASSET_PATHS.HERO_SOCIETY,
        ASSET_PATHS.RESIDENTIAL_PLOT,
        ASSET_PATHS.TEN_MARLA,
        ASSET_PATHS.COMMERCIAL_PLAZA,
      ],
      facilities: [
        '24/7 Gated Boundary Wall & Biometric Security Patrol',
        'Underground Electricity & Backup Grid Station',
        '150-Ft Landscaped Main Boulevard & 40-Ft Internal Streets',
        'Grand Jamia Mosque & Sector Mosques',
        'Community Clubhouse, Gymnasium & Family Parks',
        'Purpose-Built School & 24-Hour Medical Complex',
        'Dedicated Commercial Broadway & Banking Square',
        'Clean Water Filtration & Modern Sewerage System',
      ],
      plotCategories: [
        {
          id: 'pc_ajg_3m',
          size: '3 Marla',
          category: 'Residential',
          startingPrice: 2850000,
          maxPrice: 3900000,
          installmentAvailable: true,
          description: 'Compact residential plots in Baidar & Jasmine Extension blocks ideal for starter homes and steady rental yield.',
        },
        {
          id: 'pc_ajg_5m',
          size: '5 Marla',
          category: 'Residential',
          startingPrice: 4800000,
          maxPrice: 6800000,
          installmentAvailable: true,
          description: 'Prime on-ground possession residential plots in Rose, Tulip, and Umar Blocks with 40-ft carpeted street access.',
        },
        {
          id: 'pc_ajg_10m',
          size: '10 Marla',
          category: 'Residential',
          startingPrice: 9200000,
          maxPrice: 12800000,
          installmentAvailable: false,
          description: 'Executive boulevard and park-facing residential plots in fully developed Phase 1 & Overseas sectors.',
        },
        {
          id: 'pc_ajg_1k',
          size: '1 Kanal',
          category: 'Residential',
          startingPrice: 17500000,
          maxPrice: 23500000,
          installmentAvailable: false,
          description: 'Signature estate plots along Main Boulevard and Central Park enclave designed for bespoke luxury villas.',
        },
        {
          id: 'pc_ajg_4mc',
          size: '4 Marla Commercial',
          category: 'Commercial',
          startingPrice: 16500000,
          maxPrice: 28000000,
          installmentAvailable: true,
          description: 'High-footfall Main Boulevard commercial plots suitable for corporate retail, banks, and multi-story plazas.',
        },
      ],
      mapEmbedUrl:
        'https://www.openstreetmap.org/export/embed.html?bbox=74.1850%2C31.5650%2C74.2450%2C31.6050&layer=mapnik&marker=31.5850%2C74.2150',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Al+Jalil+Garden+Housing+Scheme+Lahore',
      paymentPlans: [
        {
          id: 'pp_ajg_3m',
          planName: 'Phase 2 Easy Installment Plan',
          plotSize: '3 Marla Residential',
          totalPrice: 3150000,
          downPayment: 650000,
          installmentDuration: '36 Months (3 Years)',
          monthlyInstallment: 45000,
          possessionCharges: 'PKR 350,000 at Possession',
          notes: '6 half-yearly balloon installments included; ideal for monthly salaried & overseas buyers.',
        },
        {
          id: 'pp_ajg_5m',
          planName: 'Jasmine & Rose Possession Schedule',
          plotSize: '5 Marla Residential',
          totalPrice: 5250000,
          downPayment: 1250000,
          installmentDuration: '24 Months (2 Years)',
          monthlyInstallment: 95000,
          possessionCharges: 'Immediate Possession Available on 50%',
          notes: 'Direct society transfer with verified NDC and electricity meter readiness.',
        },
        {
          id: 'pp_ajg_4mc',
          planName: 'Main Boulevard Commercial Plan',
          plotSize: '4 Marla Commercial',
          totalPrice: 18500000,
          downPayment: 5500000,
          installmentDuration: '18 Months',
          monthlyInstallment: 500000,
          possessionCharges: 'On Ground Commercial Possession',
          notes: 'Eligible for multi-story retail & corporate office construction.',
        },
      ],
      developmentUpdates: [
        {
          id: 'upd_ajg_1',
          title: 'Jasmine Extension Street Carpet & Sewerage Lines Completed',
          phase: 'Phase 2 · Jasmine Extension',
          date: 'November 2026',
          progressPercent: 92,
          summary: 'Asphalt carpeting on 40-ft internal streets and main trunk storm drainage connections are finalized; street lighting poles energized.',
          image: ASSET_PATHS.RESIDENTIAL_PLOT,
        },
        {
          id: 'upd_ajg_2',
          title: 'Main Boulevard Commercial Corridor Underground Grid Active',
          phase: 'Commercial Broadway',
          date: 'October 2026',
          progressPercent: 100,
          summary: 'Dedicated 11kV underground grid feeders commissioned for newly constructed commercial plazas and banking square.',
          image: ASSET_PATHS.COMMERCIAL_PLAZA,
        },
      ],
      contactPerson: 'Chaudhry Bilal Ahmad — Senior Scheme Advisor',
      contactPhone: '+92 300 8459920',
      whatsappNumber: '923008459920',
      contactEmail: 'aljalil@alamaanestate.com',
      published: true,
      featured: true,
      displayOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: schemeWestMarinaId,
      slug: 'al-noor-orchard-west-marina',
      name: 'Al Noor Orchard — West Marina',
      tagline: 'LDA-Approved Canal-Inspired Residential Enclave on Main Sharaqpur Corridor',
      status: 'Ongoing',
      projectLogo: '',
      location: '3 KM from Faizpur Interchange, Main Sharaqpur Road, Lahore',
      city: 'Lahore',
      approvalStatus: 'LDA Approved · Balloted & Possession Sectors',
      description:
        'Situated just three kilometers west of Al Jalil Garden along the thriving Lahore West growth corridor, Al Noor Orchard West Marina combines LDA-approved town planning with spacious boulevards, waterfront recreational zones, executive villas, and flexible residential and commercial plot holdings curated by Al Amaan Real Estate & Developers.',
      overviewHighlights: [
        '100% LDA-approved master layout with transparent computerized transfer system',
        'Direct connectivity to M-2 Motorway, Lahore–Abdul Hakeem M-3, and Ring Road',
        'Dedicated West Marina Cottages, Executive Villas, and Commercial Broadway',
      ],
      heroImage: ASSET_PATHS.HERO_SOCIETY,
      gallery: [
        ASSET_PATHS.HERO_SOCIETY,
        ASSET_PATHS.RESIDENTIAL_PLOT,
        ASSET_PATHS.KANAL_VILLA,
      ],
      facilities: [
        'LDA Approved Master Plan & Clear Title Documentation',
        '210-Ft Wide Entrance Approach & Landscaped Greenbelts',
        'Underground Electrification & Optical Fiber Readiness',
        'Grand Jamia Masjid & Community Sports Complex',
        'Commercial Hub & Grocery Retail Precinct',
      ],
      plotCategories: [
        {
          id: 'pc_ano_3m',
          size: '3 Marla',
          category: 'Residential',
          startingPrice: 2400000,
          maxPrice: 3100000,
          installmentAvailable: true,
          description: 'Accessible residential allocation in West Marina Executive with structured payment plans.',
        },
        {
          id: 'pc_ano_5m',
          size: '5 Marla',
          category: 'Residential',
          startingPrice: 4100000,
          maxPrice: 5600000,
          installmentAvailable: true,
          description: 'Balloted and on-ground 5 Marla residential plots in Block A, B, and West Marina.',
        },
        {
          id: 'pc_ano_10m',
          size: '10 Marla',
          category: 'Residential',
          startingPrice: 7800000,
          maxPrice: 10500000,
          installmentAvailable: true,
          description: 'Spacious family residential plots facing landscaped sector parks.',
        },
        {
          id: 'pc_ano_1k',
          size: '1 Kanal',
          category: 'Residential',
          startingPrice: 14800000,
          maxPrice: 19200000,
          installmentAvailable: false,
          description: 'Estate-grade 1 Kanal plots for custom architectural residences.',
        },
      ],
      mapEmbedUrl:
        'https://www.openstreetmap.org/export/embed.html?bbox=74.1550%2C31.5750%2C74.2050%2C31.6150&layer=mapnik&marker=31.5950%2C74.1800',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Al+Noor+Orchard+Lahore',
      paymentPlans: [
        {
          id: 'pp_ano_3m',
          planName: 'West Marina Executive Installment Schedule',
          plotSize: '3 Marla Residential',
          totalPrice: 2650000,
          downPayment: 550000,
          installmentDuration: '36 Months',
          monthlyInstallment: 38000,
          possessionCharges: 'Balloted Allocation',
          notes: 'LDA-approved file with computerized ledger verification.',
        },
        {
          id: 'pp_ano_5m',
          planName: 'West Marina Block Possession Plan',
          plotSize: '5 Marla Residential',
          totalPrice: 4450000,
          downPayment: 1100000,
          installmentDuration: '24 Months',
          monthlyInstallment: 85000,
          possessionCharges: 'PKR 400,000 at Possession',
          notes: 'Park-facing & corner options available on priority allocation.',
        },
      ],
      developmentUpdates: [
        {
          id: 'upd_ano_1',
          title: 'West Marina Main Boulevard Curbstone & Greenbelt Landscaping',
          phase: 'West Marina Sector',
          date: 'November 2026',
          progressPercent: 78,
          summary: '210-ft main avenue earthwork, dual carriageway carpeting, and central median plantation completed up to Block C.',
          image: ASSET_PATHS.HERO_SOCIETY,
        },
      ],
      contactPerson: 'Usman Farooq — Portfolio Consultant',
      contactPhone: '+92 300 8459920',
      whatsappNumber: '923008459920',
      contactEmail: 'advisory@alamaanestate.com',
      published: true,
      featured: false,
      displayOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const properties: PropertyItem[] = [
    {
      id: 'prop_ajg_5m_rose',
      referenceCode: 'AAR-AJG-101',
      title: 'Prime 5 Marla Park-Facing Possession Plot — Rose Block',
      slug: 'prime-5-marla-park-facing-possession-plot-rose-block',
      description:
        'Immediate-possession 5 Marla (25x45 ft) residential plot situated directly opposite the central landscaped park in Rose Block, Al Jalil Garden. All development charges are paid in full, underground electricity and sewerage connections are live, and neighboring houses are fully inhabited—ready for immediate architectural plan approval and construction.',
      price: 5850000,
      location: 'Rose Block, Street 4, Al Jalil Garden',
      city: 'Lahore',
      schemeId: schemeAlJalilId,
      size: '5 Marla',
      areaSqFt: 1125,
      category: 'Residential Plot',
      status: 'Available',
      featured: true,
      images: [ASSET_PATHS.RESIDENTIAL_PLOT, ASSET_PATHS.AL_JALIL_FEATURED],
      features: [
        'All Development Charges Paid',
        'Direct Park-Facing Orientation (North-East)',
        '40-Ft Carpeted Road Frontage',
        'Immediate Possession & Registry/Transfer Ready',
        'Underground Electricity & Gas Infrastructure',
      ],
      possessionReady: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prop_ajg_10m_house',
      referenceCode: 'AAR-AJG-102',
      title: 'Architect-Designed 10 Marla Contemporary Residence — Jasmine Block',
      slug: 'architect-designed-10-marla-contemporary-residence-jasmine-block',
      description:
        'Brand-new 10 Marla (35x65 ft) A+ category designer residence in Jasmine Block, Al Jalil Garden. Crafted with imported Spanish porcelain tilework, solid ash-wood joinery, double-height entrance lobby, Grohe sanitary fittings, dual kitchens, 5 spacious en-suite bedrooms, servant quarter, and solar net-metering readiness.',
      price: 34500000,
      location: 'Jasmine Block, 60-Ft Avenue, Al Jalil Garden',
      city: 'Lahore',
      schemeId: schemeAlJalilId,
      size: '10 Marla',
      areaSqFt: 2275,
      category: 'Luxury Residence',
      status: 'Available',
      featured: true,
      images: [ASSET_PATHS.TEN_MARLA, ASSET_PATHS.AL_JALIL_FEATURED],
      features: [
        '5 En-Suite Bedrooms + Powder Room & Servant Quarter',
        'Double-Height Lobby & Travertine Limestone Elevation',
        'Dual Kitchens (Dirty Kitchen + Imported Fittings)',
        'Three-Car Porch on 60-Ft Landscaped Avenue',
        '10kW Hybrid Solar Pre-Wiring Installed',
      ],
      bedrooms: 5,
      bathrooms: 6,
      possessionReady: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prop_ajg_4m_comm',
      referenceCode: 'AAR-AJG-103',
      title: 'Main Boulevard 4 Marla Commercial Plot — Broadway Square',
      slug: 'main-boulevard-4-marla-commercial-plot-broadway-square',
      description:
        'High-visibility 4 Marla commercial plot located on the 150-foot Main Boulevard of Al Jalil Garden near the banking enclave and society main gate. Approved for Basement + Ground + 4 Floors construction with expansive parking apron—ideal for corporate retail, pharmacy chains, or rental plaza development.',
      price: 22500000,
      location: 'Main Boulevard Commercial, Phase 1, Al Jalil Garden',
      city: 'Lahore',
      schemeId: schemeAlJalilId,
      size: '4 Marla Commercial',
      areaSqFt: 900,
      category: 'Commercial Plot',
      status: 'Available',
      featured: true,
      images: [ASSET_PATHS.COMMERCIAL_PLAZA, ASSET_PATHS.AL_JALIL_FEATURED],
      features: [
        '150-Ft Main Boulevard Frontage',
        'Approved for B + G + 4 Commercial Elevation',
        'Dedicated Customer Parking Apron',
        'High Rental Yield & Capital Appreciation Zone',
      ],
      possessionReady: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prop_ajg_1k_villa',
      referenceCode: 'AAR-AJG-104',
      title: 'Signature 1 Kanal Travertine Estate Villa — Tulip Enclave',
      slug: 'signature-1-kanal-travertine-estate-villa-tulip-enclave',
      description:
        'Bespoke 1 Kanal (50x90 ft) luxury architectural villa in Tulip Enclave, Al Jalil Garden. Features private manicured lawn, temperature-controlled plunge pool, cedar louver sun-breakers, floor-to-ceiling thermal glass, 6 bedrooms, home theater lounge, and imported Italian kitchen cabinetry.',
      price: 68000000,
      location: 'Tulip Enclave, Central Park Loop, Al Jalil Garden',
      city: 'Lahore',
      schemeId: schemeAlJalilId,
      size: '1 Kanal',
      areaSqFt: 4500,
      category: 'Luxury Residence',
      status: 'Reserved',
      featured: true,
      images: [ASSET_PATHS.KANAL_VILLA, ASSET_PATHS.HERO_SOCIETY],
      features: [
        '6 Luxury En-Suite Bedrooms & Private Study',
        'Private Landscaped Lawn & Courtyard Terrace',
        'Natural Travertine & Solid Teak Architectural Facade',
        'Smart Security & Climate Zoning Throughout',
      ],
      bedrooms: 6,
      bathrooms: 7,
      possessionReady: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prop_ajg_3m_baidar',
      referenceCode: 'AAR-AJG-105',
      title: '3 Marla Corner Residential Plot — Baidar Block',
      slug: '3-marla-corner-residential-plot-baidar-block',
      description:
        'Well-located 3 Marla corner plot in Baidar Block, Al Jalil Garden with extra corner land paid and clear computerized allotment letter. Walking distance from sector masjid and commercial market.',
      price: 3350000,
      location: 'Baidar Block, Corner Street 9, Al Jalil Garden',
      city: 'Lahore',
      schemeId: schemeAlJalilId,
      size: '3 Marla',
      areaSqFt: 675,
      category: 'Residential Plot',
      status: 'Available',
      featured: false,
      images: [ASSET_PATHS.RESIDENTIAL_PLOT],
      features: [
        'Corner Category Paid in Full',
        '2-Minute Walk to Sector Mosque & Market',
        'Direct Owner Transfer at Society Office',
      ],
      possessionReady: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prop_ano_10m_west_marina',
      referenceCode: 'AAR-ANO-201',
      title: '10 Marla Balloted Plot — West Marina Executive Block',
      slug: '10-marla-balloted-plot-west-marina-executive-block',
      description:
        'Verified 10 Marla plot with plot number allotted on the 80-foot wide main spine road in Al Noor Orchard West Marina, Lahore. Excellent medium-term appreciation prospect with LDA-approved documentation verified by Al Amaan legal counsel.',
      price: 8600000,
      location: 'West Marina Executive, Main 80-Ft Road, Al Noor Orchard',
      city: 'Lahore',
      schemeId: schemeWestMarinaId,
      size: '10 Marla',
      areaSqFt: 2250,
      category: 'Residential Plot',
      status: 'Available',
      featured: false,
      images: [ASSET_PATHS.HERO_SOCIETY, ASSET_PATHS.RESIDENTIAL_PLOT],
      features: [
        'LDA Approved & Computerized Plot Number Allotted',
        '80-Ft Main Spine Road Location',
        'Verified Clear Title & No Dues Certificate Ready',
      ],
      possessionReady: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prop_ajg_5m_sold',
      referenceCode: 'AAR-AJG-106',
      title: '5 Marla Possession Plot — Umar Block',
      slug: '5-marla-possession-plot-umar-block',
      description:
        'Standard 5 Marla residential plot in Umar Block, Al Jalil Garden, successfully transacted and transferred through Al Amaan Real Estate & Developers.',
      price: 5200000,
      location: 'Umar Block, Street 11, Al Jalil Garden',
      city: 'Lahore',
      schemeId: schemeAlJalilId,
      size: '5 Marla',
      areaSqFt: 1125,
      category: 'Residential Plot',
      status: 'Sold',
      featured: false,
      images: [ASSET_PATHS.RESIDENTIAL_PLOT],
      features: [
        'Possession Sector',
        '40-Ft Carpeted Road',
        'Verified Transfer Completed',
      ],
      possessionReady: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const users: StoredUser[] = [
    {
      id: 'usr_admin_primary',
      name: initialAdminName,
      email: initialAdminEmail,
      phone: '+92 300 8459920',
      role: 'super_admin',
      active: true,
      favoritePropertyIds: [],
      passwordHash: adminPasswordHash,
      createdAt: now,
      lastLoginAt: now,
    },
    {
      id: 'usr_cust_kamran',
      name: 'Dr. Kamran Siddiqui',
      email: 'kamran.siddiqui@example.pk',
      phone: '+92 321 4498120',
      role: 'customer',
      active: true,
      favoritePropertyIds: ['prop_ajg_5m_rose', 'prop_ajg_10m_house'],
      passwordHash: sampleCustomerPasswordHash,
      createdAt: now,
    },
    {
      id: 'usr_cust_ayesha',
      name: 'Ayesha Mansoor',
      email: 'ayesha.mansoor@example.pk',
      phone: '+92 333 4109823',
      role: 'customer',
      active: true,
      favoritePropertyIds: ['prop_ajg_4m_comm'],
      passwordHash: sampleCustomerPasswordHash,
      createdAt: now,
    },
  ];

  const inquiries: InquiryItem[] = [
    {
      id: 'inq_initial_1',
      customerId: 'usr_cust_kamran',
      name: 'Dr. Kamran Siddiqui',
      email: 'kamran.siddiqui@example.pk',
      phone: '+92 321 4498120',
      subject: 'Site Visit Request — Rose Block 5 Marla Plot (AAR-AJG-101)',
      message:
        'Assalam-o-Alaikum, I would like to schedule an on-site visit this Saturday afternoon to inspect Plot AAR-AJG-101 in Rose Block, Al Jalil Garden and verify NDC timelines.',
      propertyId: 'prop_ajg_5m_rose',
      propertyTitle: 'Prime 5 Marla Park-Facing Possession Plot — Rose Block',
      schemeId: schemeAlJalilId,
      schemeName: 'Al Jalil Garden',
      preferredPlotSize: '5 Marla',
      status: 'New',
      internalNotes: [
        {
          id: 'note_1',
          authorId: 'usr_admin_primary',
          authorName: initialAdminName,
          note: 'Verified Rose Block plot file in society transfer branch; ready for Saturday 3 PM site inspection.',
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'inq_initial_2',
      customerId: 'usr_cust_ayesha',
      name: 'Ayesha Mansoor',
      email: 'ayesha.mansoor@example.pk',
      phone: '+92 333 4109823',
      subject: 'Commercial Plot Inquiry — Main Boulevard Al Jalil Garden',
      message:
        'Please share the exact plot dimensions, corner status, and expected annual rental return for the 4 Marla Main Boulevard commercial plot.',
      propertyId: 'prop_ajg_4m_comm',
      propertyTitle: 'Main Boulevard 4 Marla Commercial Plot — Broadway Square',
      schemeId: schemeAlJalilId,
      schemeName: 'Al Jalil Garden',
      preferredPlotSize: '4 Marla Commercial',
      status: 'In Progress',
      internalNotes: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const testimonials: TestimonialItem[] = [
    {
      id: 'test_1',
      name: 'Brig. (R) Khalid Mahmood',
      role: 'Homeowner & Investor',
      location: 'Gulberg III, Lahore',
      investmentContext: 'Purchased 10 Marla Possession Plot in Jasmine Block, Al Jalil Garden',
      quote:
        'Before working with Al Amaan Real Estate, verifying society NDCs and hidden transfer charges took weeks of uncertainty. Their advisory desk completed official file verification at Al Jalil Garden within 48 hours and oversaw our transfer transparently at face value.',
      published: true,
      createdAt: now,
    },
    {
      id: 'test_2',
      name: 'Engr. Salman Raza',
      role: 'Overseas Pakistani Director, Civil Infrastructure',
      location: 'Riyadh / Lahore',
      investmentContext: 'Acquired Two 5 Marla Plots & Turnkey Gray-Structure Advisory',
      quote:
        'Investing from abroad requires an agency whose word matches written documentation. Al Amaan handled biometric power-of-attorney coordination, video site inspections in Rose Block, and milestone-based reporting without a single discrepancy.',
      published: true,
      createdAt: now,
    },
    {
      id: 'test_3',
      name: 'Farhana & Adeel Sheikh',
      role: 'Retail Business Owners',
      location: 'DHA Phase 5, Lahore',
      investmentContext: 'Commercial Broadway Allocation in Al Jalil Garden',
      quote:
        'Al Amaan advised us to pivot from an unapproved file into an on-ground Main Boulevard commercial plot in Al Jalil Garden. Within fourteen months, surrounding plaza occupancy surged and our asset appreciated by over 28%.',
      published: true,
      createdAt: now,
    },
  ];

  const navigation: NavItem[] = [
    { id: 'nav_h1', label: 'Home', path: '/', isExternal: false, visible: true, order: 1, placement: 'header' },
    { id: 'nav_h2', label: 'Projects', path: '/projects', isExternal: false, visible: true, order: 2, placement: 'header' },
    { id: 'nav_h3', label: 'Al Jalil Garden', path: '/projects/al-jalil-garden', isExternal: false, visible: true, order: 3, placement: 'header' },
    { id: 'nav_h4', label: 'Properties', path: '/properties', isExternal: false, visible: true, order: 4, placement: 'header' },
    { id: 'nav_h5', label: 'Services', path: '/services', isExternal: false, visible: true, order: 5, placement: 'header' },
    { id: 'nav_f1', label: 'About Al Amaan', path: '/about', isExternal: false, visible: true, order: 1, placement: 'footer_explore' },
    { id: 'nav_f2', label: 'All Real Estate Projects', path: '/projects', isExternal: false, visible: true, order: 2, placement: 'footer_explore' },
    { id: 'nav_f3', label: 'Al Jalil Garden Lahore', path: '/projects/al-jalil-garden', isExternal: false, visible: true, order: 3, placement: 'footer_explore' },
    { id: 'nav_f4', label: 'Available Plots & Homes', path: '/properties', isExternal: false, visible: true, order: 4, placement: 'footer_explore' },
    { id: 'nav_f5', label: 'Our Advisory Services', path: '/services', isExternal: false, visible: true, order: 5, placement: 'footer_explore' },
    { id: 'nav_f6', label: 'Contact Head Office', path: '/contact', isExternal: false, visible: true, order: 6, placement: 'footer_explore' },
    { id: 'nav_l1', label: 'Privacy Policy', path: '/privacy', isExternal: false, visible: true, order: 1, placement: 'footer_legal' },
    { id: 'nav_l2', label: 'Terms & Conditions', path: '/terms', isExternal: false, visible: true, order: 2, placement: 'footer_legal' },
    { id: 'nav_l3', label: 'Client Account Portal', path: '/login', isExternal: false, visible: true, order: 3, placement: 'footer_legal' },
  ];

  const media: MediaAsset[] = [
    {
      id: 'med_1',
      title: 'Lahore Master-Planned Housing Society Aerial',
      url: ASSET_PATHS.HERO_SOCIETY,
      filename: 'hero_lahore_society_1794504538304.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 420000,
      isSystemAsset: true,
      uploadedAt: now,
    },
    {
      id: 'med_2',
      title: 'Al Jalil Garden Grand Boulevard & Entrance',
      url: ASSET_PATHS.AL_JALIL_FEATURED,
      filename: 'al_jalil_garden_featured_1794504540747.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 410000,
      isSystemAsset: true,
      uploadedAt: now,
    },
    {
      id: 'med_3',
      title: '1 Kanal Travertine Luxury Villa',
      url: ASSET_PATHS.KANAL_VILLA,
      filename: 'property_kanal_villa_1794504541636.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 380000,
      isSystemAsset: true,
      uploadedAt: now,
    },
    {
      id: 'med_4',
      title: '10 Marla Contemporary Designer Residence',
      url: ASSET_PATHS.TEN_MARLA,
      filename: 'property_ten_marla_modern_1794504543789.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 375000,
      isSystemAsset: true,
      uploadedAt: now,
    },
    {
      id: 'med_5',
      title: 'Main Boulevard Commercial Plaza',
      url: ASSET_PATHS.COMMERCIAL_PLAZA,
      filename: 'property_commercial_plaza_1794504544918.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 395000,
      isSystemAsset: true,
      uploadedAt: now,
    },
    {
      id: 'med_6',
      title: 'Developed Park-Facing Residential Plots',
      url: ASSET_PATHS.RESIDENTIAL_PLOT,
      filename: 'property_residential_plot_1794504546024.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 360000,
      isSystemAsset: true,
      uploadedAt: now,
    },
    {
      id: 'med_7',
      title: 'Al Amaan Executive Advisory Boardroom',
      url: ASSET_PATHS.AGENCY_OFFICE,
      filename: 'about_agency_office_1794504546500.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 390000,
      isSystemAsset: true,
      uploadedAt: now,
    },
  ];

  const seo: PageSEOConfig[] = [
    {
      pageKey: 'home',
      pageLabel: 'Homepage',
      title: 'Al Amaan Real Estate & Developers — Lahore Property & Al Jalil Garden',
      description:
        'Authorized real estate consultants and developers in Lahore, Pakistan. Explore Al Jalil Garden residential & commercial plots, luxury homes, and verified property transfers.',
      keywords: 'Al Amaan Real Estate, Al Jalil Garden Lahore, plots for sale in Lahore, 5 Marla plot Lahore, Pakistan real estate',
      ogImage: ASSET_PATHS.HERO_SOCIETY,
    },
    {
      pageKey: 'about',
      pageLabel: 'About Us',
      title: 'About Al Amaan Real Estate & Developers — Lahore Real Estate Advisory',
      description:
        'Learn how Al Amaan Real Estate & Developers delivers TMA/LDA verified plots, turnkey architectural development, and transparent real estate advisory in Lahore.',
      keywords: 'About Al Amaan Real Estate, property developers Lahore, trusted property dealers Lahore',
      ogImage: ASSET_PATHS.AGENCY_OFFICE,
    },
    {
      pageKey: 'schemes',
      pageLabel: 'All Housing Schemes',
      title: 'Approved Housing Schemes in Lahore — Al Amaan Real Estate',
      description:
        'Browse vetted master-planned housing societies in Lahore including Al Jalil Garden and Al Noor Orchard West Marina with plot prices and master maps.',
      keywords: 'housing schemes in Lahore, Al Jalil Garden, Al Noor Orchard, approved societies Lahore',
      ogImage: ASSET_PATHS.AL_JALIL_FEATURED,
    },
    {
      pageKey: 'properties',
      pageLabel: 'All Properties & Plots',
      title: 'Available Plots, Villas & Commercial Properties in Lahore — Al Amaan',
      description:
        'Search verified 3 Marla, 5 Marla, 10 Marla, and 1 Kanal plots, commercial plazas, and designer residences in Al Jalil Garden and Lahore.',
      keywords: 'plots for sale Al Jalil Garden, 5 Marla house Lahore, commercial plots Lahore',
      ogImage: ASSET_PATHS.RESIDENTIAL_PLOT,
    },
    {
      pageKey: 'services',
      pageLabel: 'Our Services',
      title: 'Real Estate Advisory, File Verification & Construction — Al Amaan',
      description:
        'Comprehensive real estate brokerage, society NDC verification, turnkey gray & finishing construction, and overseas Pakistani investment management.',
      keywords: 'real estate services Lahore, turnkey construction Lahore, overseas Pakistani property advisory',
      ogImage: ASSET_PATHS.KANAL_VILLA,
    },
    {
      pageKey: 'contact',
      pageLabel: 'Contact Us',
      title: 'Contact Al Amaan Real Estate & Developers — Head Office Lahore',
      description:
        'Visit our Main Boulevard office at Al Jalil Garden, Faizpur Interchange, Lahore or connect directly on WhatsApp for verified plot pricing and site tours.',
      keywords: 'contact Al Amaan Real Estate, Al Jalil Garden office phone, Lahore property WhatsApp',
      ogImage: ASSET_PATHS.AGENCY_OFFICE,
    },
  ];

  const settings: SiteSettings = {
    siteName: 'Al Amaan Real Estate & Developers',
    shortName: 'Al Amaan',
    tagline: 'Authorized Real Estate Advisory & Turnkey Property Developers · Lahore, Pakistan',
    logoUrl: '',
    faviconUrl: '',
    currency: 'PKR',
    primaryColor: '#0B192C',
    accentColor: '#B89146',
    whatsappFloatingEnabled: true,
    whatsappDefaultMessage:
      'Assalam-o-Alaikum Al Amaan Real Estate & Developers, I would like to inquire about available plots and properties in Lahore.',
  };

  const contact: ContactConfig = {
    primaryPhone: '+92 300 8459920',
    secondaryPhone: '+92 42 37189400',
    whatsappNumber: '923008459920',
    email: 'info@alamaanestate.com',
    supportEmail: 'transfers@alamaanestate.com',
    officeAddress: 'Plaza 14-B, Main Boulevard Commercial, Al Jalil Garden (Opposite M-2 Faizpur Interchange), Sharaqpur Road, Lahore',
    city: 'Lahore, Pakistan',
    officeHours: 'Monday – Sunday · 10:00 AM to 8:00 PM (Friday Prayer Break 1:00 PM – 2:30 PM)',
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Al+Jalil+Garden+Main+Boulevard+Lahore',
    mapEmbedUrl:
      'https://www.openstreetmap.org/export/embed.html?bbox=74.1850%2C31.5650%2C74.2450%2C31.6050&layer=mapnik&marker=31.5850%2C74.2150',
  };

  const social: SocialConfig = {
    facebook: 'https://www.facebook.com/alamaanrealestate',
    instagram: 'https://www.instagram.com/alamaanrealestate',
    tiktok: 'https://www.tiktok.com/@alamaanrealestate',
    youtube: 'https://www.youtube.com/@alamaanrealestate',
    linkedin: 'https://www.linkedin.com/company/al-amaan-real-estate',
  };

  const content: WebsiteContent = {
    heroHeadline: 'Building Dreams, Creating Destinations.',
    heroIntroduction:
      'Al Amaan Real Estate & Developers is a premier Lahore real estate brokerage and turnkey construction firm specializing in TMA and LDA-approved communities—led by our flagship portfolio in Al Jalil Garden.',
    heroImage: ASSET_PATHS.HERO_SOCIETY,
    heroExplorePropertiesLabel: 'Explore Properties',
    heroExploreSchemesLabel: 'Explore Projects',
    heroContactLabel: 'Contact Us',
    featuredSchemeSectionKicker: 'Flagship Master-Planned Community · Lahore',
    featuredSchemeSectionHeading: 'Featured Development — Engineered for Modern Living & Enduring Value',
    featuredSchemeSectionSummary:
      'Explore flagship and partner housing societies managed by Al Amaan Real Estate & Developers with verified approvals, underground utilities, and transparent transfer support.',
    moreProjectsHeading: 'More Projects & Development Portfolio',
    moreProjectsSummary:
      'Discover ongoing, upcoming, and completed real estate projects developed and marketed by Al Amaan Real Estate & Developers across Lahore.',
    whyChooseHeading: 'Why Discerning Families & Investors Choose Al Amaan',
    whyChooseSummary:
      'Every transaction is backed by direct society verification, written due diligence, and decades of on-ground market intelligence across Lahore’s western and southern corridors.',
    whyChooseItems: [
      {
        id: 'wc_1',
        title: '100% Title & NDC Verification Before Token',
        description:
          'We verify every plot allotment, TMA/LDA NOC standing, and society No-Demand Certificate directly at the transfer counter before a single rupee changes hands.',
      },
      {
        id: 'wc_2',
        title: 'Authorized Presence in Flagship Societies',
        description:
          'Operating directly from Main Boulevard Al Jalil Garden gives our clients immediate access to verified direct-owner inventory without multi-broker markups.',
      },
      {
        id: 'wc_3',
        title: 'Turnkey Architectural & Construction Execution',
        description:
          'From soil testing and society blueprint approvals to A+ gray structure and bespoke interior finishing, our in-house engineering team delivers fixed-timeline homes.',
      },
      {
        id: 'wc_4',
        title: 'Dedicated Overseas Pakistani Desk',
        description:
          'Structured biometric transfer guidance, live drone/video plot inspections, and documented milestone reporting tailored for expatriate families worldwide.',
      },
    ],
    servicesHeading: 'Comprehensive Real Estate & Development Capabilities',
    servicesSummary:
      'End-to-end advisory designed for residential homebuyers, commercial yield investors, and overseas Pakistanis building generational assets in Lahore.',
    servicesItems: [
      {
        id: 'srv_1',
        indexLabel: '01',
        title: 'Authorized Sales, Acquisitions & Plot Transfers',
        summary:
          'Direct acquisition and sale of residential and commercial plots in Al Jalil Garden and LDA-approved Lahore societies with complete transfer desk execution.',
        deliverables: [
          'Comparative market valuation based on recorded block transfers',
          'Direct buyer-seller meeting and documented Bayana agreement',
          'Society NDC clearance and biometric transfer completion',
        ],
      },
      {
        id: 'srv_2',
        indexLabel: '02',
        title: 'Turnkey Residential & Commercial Development',
        summary:
          'Architectural design, structural engineering, and turnkey A+ construction for 5 Marla, 10 Marla, and 1 Kanal residences as well as Main Boulevard commercial plazas.',
        deliverables: [
          '3D elevation, structural drawings, and society submission approvals',
          'Audited BOQ material specifications with stage-gate quality inspections',
          'Written structural warranty and on-schedule key handover',
        ],
      },
      {
        id: 'srv_3',
        indexLabel: '03',
        title: 'Portfolio Structuring & Commercial Yield Advisory',
        summary:
          'Capital allocation strategies balancing immediate-possession plots, commercial rental units, and structured installment allocations for 18–36 month horizons.',
        deliverables: [
          'Block-by-block capital appreciation and rental yield modeling',
          'Commercial tenant placement and lease documentation',
          'Periodic portfolio revaluation and exit timing execution',
        ],
      },
      {
        id: 'srv_4',
        indexLabel: '04',
        title: 'Legal Due Diligence & Overseas Client Representation',
        summary:
          'Dedicated transaction security for local and expatriate clients requiring verifiable documentation, embassy PoA guidance, and remote site verification.',
        deliverables: [
          'Allotment letter, Fard, and society ledger verification',
          'Live high-definition video walk-through of exact street and plot markers',
          'Secure banking channel payment trails and tax withholding compliance',
        ],
      },
    ],
    statsHeading: 'Measured Track Record Across Lahore’s Growth Corridors',
    statistics: [
      {
        id: 'stat_1',
        value: '14+ Years',
        label: 'Lahore Market Leadership',
        context: 'Continuous on-ground brokerage & construction operations since 2012',
      },
      {
        id: 'stat_2',
        value: '2,650+',
        label: 'Verified Plot & Home Transfers',
        context: 'Zero disputed titles across residential and commercial transactions',
      },
      {
        id: 'stat_3',
        value: 'PKR 19.4B',
        label: 'Advisory Transaction Volume',
        context: 'Cumulative verified residential & commercial real estate transacted',
      },
      {
        id: 'stat_4',
        value: '185+',
        label: 'Turnkey Projects Delivered',
        context: 'Custom residences and commercial plazas built in Lahore societies',
      },
    ],
    aboutHeadline: 'Principled Real Estate Advisory & Master-Crafted Development in Lahore.',
    aboutStory:
      'Founded in Lahore with a commitment to eliminating opacity in Pakistani real estate transactions, Al Amaan Real Estate & Developers has grown into one of the Sharaqpur Road and M-2 Faizpur corridor’s most respected property institutions. Headquartered on Main Boulevard in Al Jalil Garden, our firm brings together seasoned society transfer specialists, real estate investment analysts, civil engineers, and residential architects under one roof.\n\nWhether guiding a family toward their first 5 Marla park-facing plot, structuring a Main Boulevard commercial acquisition, or executing a bespoke 1 Kanal residence from foundation to handover, we treat every client’s capital as a sacred trust—which is the literal meaning of Al Amaan.',
    aboutMission:
      'To protect and grow our clients’ real estate wealth through 100% verified documentation, honest market pricing, and uncompromising architectural construction standards across Lahore’s approved housing communities.',
    aboutVision:
      'To set the benchmark for institutional transparency, customer accountability, and sustainable urban development in Pakistan’s real estate sector.',
    aboutImage: ASSET_PATHS.AGENCY_OFFICE,
    privacyPolicyContent: `Last Updated: November 2026

1. Information We Collect
Al Amaan Real Estate & Developers collects personal contact details—including your full name, phone/WhatsApp number, email address, and property preferences—strictly when you register for a client account, save favorite listings, or submit a property or housing scheme inquiry.

2. How We Use Your Information
Your information is used exclusively to respond to your property inquiries, arrange verified site inspections in Al Jalil Garden and partner Lahore housing schemes, maintain your saved property portfolio, and communicate official allotment or transfer updates.

3. Confidentiality & Data Security
We never sell, rent, or trade client contact registries to third-party telemarketers or external agencies. Account passwords are encrypted using industry-standard cryptographic hashing, and client dashboard records are isolated with strict role-based access controls.

4. Client Rights & Account Control
Registered clients may review, update, or request deletion of their personal profile and inquiry records at any time via the Client Account Portal or by emailing info@alamaanestate.com.`,
    termsConditionsContent: `Last Updated: November 2026

1. Scope of Advisory & Listings
All property prices (quoted in Pakistani Rupees — PKR), plot availability statuses (Available, Reserved, Sold), and housing scheme installment schedules published on the Al Amaan Real Estate & Developers website reflect verified records at the time of publication. Due to active market trading in Lahore real estate, final prices and plot availability are confirmed in writing prior to token (Bayana) execution.

2. Official Verification & Transfer Protocol
All plot and house transactions facilitated by Al Amaan Real Estate & Developers are executed through documented agreements accompanied by official housing society No-Demand Certificate (NDC) and allotment verification at the respective society transfer office.

3. Client Account Responsibilities
Users registering on the Client Portal agree to provide accurate contact credentials and maintain the confidentiality of their login password. Automated scraping, fraudulent inquiries, or unauthorized access attempts are strictly prohibited.

4. Governing Law
These Terms & Conditions are governed by the laws of the Islamic Republic of Pakistan, with exclusive jurisdiction vested in the courts of Lahore, Punjab.`,
  };

  const activityLogs: ActivityLogItem[] = [
    {
      id: 'log_init_1',
      actorId: 'usr_admin_primary',
      actorName: initialAdminName,
      actorRole: 'super_admin',
      action: 'SYSTEM_INITIALIZED',
      module: 'Settings',
      details: 'Initialized production database with Al Jalil Garden featured scheme and initial Lahore property inventory.',
      createdAt: now,
    },
  ];

  const notifications = buildDefaultNotifications(now);

  return {
    users,
    passwordResets: [],
    schemes,
    properties,
    inquiries,
    testimonials,
    navigation,
    media,
    seo,
    settings,
    contact,
    social,
    content,
    activityLogs,
    notifications,
  };
}

function buildDefaultNotifications(now: string): SiteNotification[] {
  return [
    {
      id: 'notif_init_ajg',
      title: 'Al Jalil Garden — Phase 2 Possession & Installments',
      message: '3 & 5 Marla residential plots in Jasmine & Rose Extension now open with verified NDC transfer.',
      category: 'project',
      link: '/projects/al-jalil-garden',
      targetAudience: 'all',
      createdAt: now,
    },
    {
      id: 'notif_init_dev',
      title: 'Site Development Progress: West Marina Canal',
      message: 'Main Sharaqpur Road access & underground utility ducting reached 78% completion.',
      category: 'development',
      link: '/projects/al-noor-orchard-west-marina',
      targetAudience: 'all',
      createdAt: now,
    },
    {
      id: 'notif_init_prop',
      title: 'New Verified Plots Available in Lahore',
      message: 'Browse updated 5 Marla, 10 Marla, 1 Kanal, and commercial listings directly in our portfolio.',
      category: 'property',
      link: '/properties',
      targetAudience: 'all',
      createdAt: now,
    },
  ];
}

let cachedDb: DatabaseSchema | null = null;

export function ensureStorageDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function normalizeSchemeDefaults(scheme: HousingScheme): HousingScheme {
  return {
    ...scheme,
    status: scheme.status || 'Ongoing',
    projectLogo: scheme.projectLogo || '',
    whatsappNumber: scheme.whatsappNumber || scheme.contactPhone || '',
    overviewHighlights: Array.isArray(scheme.overviewHighlights) ? scheme.overviewHighlights : [],
    gallery: Array.isArray(scheme.gallery) ? scheme.gallery : [],
    facilities: Array.isArray(scheme.facilities) ? scheme.facilities : [],
    plotCategories: Array.isArray(scheme.plotCategories) ? scheme.plotCategories : [],
    paymentPlans: Array.isArray(scheme.paymentPlans) ? scheme.paymentPlans : ([] as ProjectPaymentPlan[]),
    developmentUpdates: Array.isArray(scheme.developmentUpdates)
      ? scheme.developmentUpdates
      : ([] as ProjectDevelopmentUpdate[]),
  };
}

export function getDb(): DatabaseSchema {
  if (cachedDb) {
    return cachedDb;
  }
  ensureStorageDirectories();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseSchema;
      parsed.schemes = Array.isArray(parsed.schemes)
        ? parsed.schemes.map(normalizeSchemeDefaults)
        : [];
      if (!Array.isArray(parsed.notifications) || parsed.notifications.length === 0) {
        parsed.notifications = buildDefaultNotifications(new Date().toISOString());
      }
      cachedDb = parsed;
      return cachedDb;
    } catch (err) {
      console.error('Failed reading existing DB file, re-initializing cleanly:', err);
    }
  }
  cachedDb = createInitialSeed();
  saveDb(cachedDb);
  return cachedDb;
}

export function saveDb(db: DatabaseSchema): void {
  ensureStorageDirectories();
  cachedDb = db;
  const tempFile = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

export function recordActivity(
  actor: { id: string; name: string; role: string },
  module: string,
  action: string,
  details: string
): void {
  const db = getDb();
  db.activityLogs.unshift({
    id: generateId('log'),
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    module,
    details,
    createdAt: new Date().toISOString(),
  });
  if (db.activityLogs.length > 300) {
    db.activityLogs = db.activityLogs.slice(0, 300);
  }
  saveDb(db);
}

export function pushNotification(
  input: Omit<SiteNotification, 'id' | 'createdAt'>
): SiteNotification {
  const db = getDb();
  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
  }
  const entry: SiteNotification = {
    id: generateId('notif'),
    createdAt: new Date().toISOString(),
    ...input,
  };
  db.notifications.unshift(entry);
  if (db.notifications.length > 120) {
    db.notifications = db.notifications.slice(0, 120);
  }
  saveDb(db);
  return entry;
}

export function sanitizeUser(user: StoredUser): UserAccount {
  const { passwordHash: _unused, ...safe } = user;
  return safe;
}
