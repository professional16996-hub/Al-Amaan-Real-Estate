import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import {
  UPLOADS_DIR,
  ensureStorageDirectories,
  generateId,
  getDb,
  recordActivity,
  sanitizeUser,
  saveDb,
  slugify,
} from './db.ts';
import {
  ADMIN_COOKIE,
  CUSTOMER_COOKIE,
  clearSessionCookie,
  requireAdminAuth,
  requireCustomerAuth,
  resolveOptionalCustomer,
  setSessionCookie,
  signAuthToken,
  type AuthenticatedRequest,
} from './auth.ts';
import type {
  AdminDashboardStats,
  HousingScheme,
  InquiryStatus,
  NavItem,
  PageSEOConfig,
  PlotCategory,
  PropertyCategory,
  PropertyItem,
  PropertyStatus,
  TestimonialItem,
  UserRole,
} from '../src/types/models.ts';

export const apiRouter = express.Router();

ensureStorageDirectories();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureStorageDirectories();
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const base = slugify(path.basename(file.originalname, ext)).slice(0, 40) || 'asset';
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP, GIF, and SVG image files are permitted.'));
    }
  },
});

function enrichProperty(prop: PropertyItem, schemes: HousingScheme[]): PropertyItem {
  const scheme = schemes.find((s) => s.id === prop.schemeId);
  return {
    ...prop,
    schemeName: scheme ? scheme.name : prop.schemeName || 'Independent Lahore Location',
    schemeSlug: scheme ? scheme.slug : undefined,
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================================
// PUBLIC BOOTSTRAP & CATALOG ENDPOINTS
// ============================================================================

apiRouter.get('/public/bootstrap', (_req, res) => {
  const db = getDb();
  const publishedSchemes = db.schemes
    .filter((s) => s.published)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder);

  const enrichedProperties = db.properties
    .filter((p) => {
      const parentScheme = db.schemes.find((s) => s.id === p.schemeId);
      return !parentScheme || parentScheme.published;
    })
    .map((p) => enrichProperty(p, db.schemes));

  res.json({
    settings: db.settings,
    contact: db.contact,
    social: db.social,
    content: db.content,
    navigation: [...db.navigation].sort((a, b) => a.order - b.order),
    seo: db.seo,
    testimonials: db.testimonials.filter((t) => t.published),
    schemes: publishedSchemes,
    properties: enrichedProperties,
  });
});

apiRouter.get('/public/schemes/:slug', (req, res) => {
  const db = getDb();
  const scheme = db.schemes.find((s) => s.slug === req.params.slug && s.published);
  if (!scheme) {
    res.status(404).json({ error: 'Housing scheme not found or currently unpublished.' });
    return;
  }
  const schemeProperties = db.properties
    .filter((p) => p.schemeId === scheme.id)
    .map((p) => enrichProperty(p, db.schemes));
  res.json({ scheme, properties: schemeProperties });
});

apiRouter.get('/public/properties/:id', (req, res) => {
  const db = getDb();
  const prop = db.properties.find((p) => p.id === req.params.id || p.slug === req.params.id);
  if (!prop) {
    res.status(404).json({ error: 'Property listing not found.' });
    return;
  }
  res.json({ property: enrichProperty(prop, db.schemes) });
});

// Public & Customer Inquiry Submission with Duplicate Submission Protection
apiRouter.post('/public/inquiries', (req, res) => {
  const db = getDb();
  const optionalCustomer = resolveOptionalCustomer(req);

  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const subject = String(req.body.subject || 'General Real Estate Inquiry').trim();
  const message = String(req.body.message || '').trim();
  const propertyId = req.body.propertyId ? String(req.body.propertyId).trim() : undefined;
  const schemeId = req.body.schemeId ? String(req.body.schemeId).trim() : undefined;
  const preferredPlotSize = req.body.preferredPlotSize ? String(req.body.preferredPlotSize).trim() : undefined;

  if (!name || name.length < 2) {
    res.status(400).json({ error: 'Please provide your full name.' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  if (!phone || phone.length < 7) {
    res.status(400).json({ error: 'Please provide a valid phone or WhatsApp number.' });
    return;
  }
  if (!message || message.length < 10) {
    res.status(400).json({ error: 'Please enter a brief inquiry message (at least 10 characters).' });
    return;
  }

  // Duplicate submission protection within 60 seconds
  const nowMs = Date.now();
  const recentDuplicate = db.inquiries.find((inq) => {
    const createdMs = new Date(inq.createdAt).getTime();
    return (
      nowMs - createdMs < 60_000 &&
      inq.email.toLowerCase() === email &&
      inq.message.trim() === message &&
      inq.propertyId === propertyId
    );
  });

  if (recentDuplicate) {
    res.status(409).json({
      error: 'Your inquiry was already received moments ago. Our team will respond shortly.',
    });
    return;
  }

  const matchedProp = propertyId ? db.properties.find((p) => p.id === propertyId) : undefined;
  const matchedScheme = schemeId
    ? db.schemes.find((s) => s.id === schemeId)
    : matchedProp
      ? db.schemes.find((s) => s.id === matchedProp.schemeId)
      : undefined;

  const nowIso = new Date().toISOString();
  const newInquiry = {
    id: generateId('inq'),
    customerId: optionalCustomer?.id,
    name,
    email,
    phone,
    subject,
    message,
    propertyId: matchedProp?.id,
    propertyTitle: matchedProp?.title,
    schemeId: matchedScheme?.id,
    schemeName: matchedScheme?.name,
    preferredPlotSize,
    status: 'New' as InquiryStatus,
    internalNotes: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.inquiries.unshift(newInquiry);
  saveDb(db);

  res.status(201).json({
    message: 'Thank you. Your inquiry has been registered with Al Amaan Real Estate & Developers.',
    inquiry: newInquiry,
  });
});

// ============================================================================
// CUSTOMER AUTHENTICATION & ACCOUNT ENDPOINTS
// ============================================================================

apiRouter.post('/auth/register', (req, res) => {
  const db = getDb();
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');

  if (!name || name.length < 2) {
    res.status(400).json({ error: 'Please enter your full name.' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (!phone || phone.length < 7) {
    res.status(400).json({ error: 'Please enter a valid phone number.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  const now = new Date().toISOString();
  const newUser = {
    id: generateId('usr'),
    name,
    email,
    phone,
    role: 'customer' as UserRole,
    active: true,
    favoritePropertyIds: [],
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: now,
    lastLoginAt: now,
  };

  db.users.unshift(newUser);
  // Link any prior inquiries submitted with the same email
  db.inquiries.forEach((inq) => {
    if (!inq.customerId && inq.email.toLowerCase() === email) {
      inq.customerId = newUser.id;
    }
  });
  saveDb(db);

  const token = signAuthToken({ userId: newUser.id, role: 'customer', scope: 'customer' });
  setSessionCookie(res, CUSTOMER_COOKIE, token);

  res.status(201).json({
    token,
    user: sanitizeUser(newUser),
  });
});

apiRouter.post('/auth/login', (req, res) => {
  const db = getDb();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const user = db.users.find((u) => u.email.toLowerCase() === email && u.role === 'customer');
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid email address or password.' });
    return;
  }
  if (!user.active) {
    res.status(403).json({
      error: 'Your client account is currently inactive. Please contact Al Amaan Real Estate support.',
    });
    return;
  }

  user.lastLoginAt = new Date().toISOString();
  saveDb(db);

  const token = signAuthToken({ userId: user.id, role: 'customer', scope: 'customer' });
  setSessionCookie(res, CUSTOMER_COOKIE, token);

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

apiRouter.post('/auth/logout', (_req, res) => {
  clearSessionCookie(res, CUSTOMER_COOKIE);
  res.json({ message: 'Signed out successfully.' });
});

apiRouter.get('/auth/me', requireCustomerAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: sanitizeUser(req.authUser!) });
});

apiRouter.post('/auth/forgot-password', (req, res) => {
  const db = getDb();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid registered email address.' });
    return;
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email && u.role === 'customer');
  if (!user) {
    // Return helpful verification error so legitimate customers know if they mistyped
    res.status(404).json({ error: 'No client account found matching that email address.' });
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.passwordResets = db.passwordResets.filter((r) => r.userId !== user.id);
  db.passwordResets.push({
    id: generateId('rst'),
    userId: user.id,
    email: user.email,
    code,
    expiresAt: Date.now() + 30 * 60 * 1000,
    used: false,
  });
  saveDb(db);

  // When an external SMTP relay is not configured, return verificationCode so password reset works end-to-end
  res.json({
    message: 'Password reset verification code generated. Enter the 6-digit code below to set a new password.',
    verificationCode: code,
    expiresInMinutes: 30,
  });
});

apiRouter.post('/auth/reset-password', (req, res) => {
  const db = getDb();
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim();
  const newPassword = String(req.body.newPassword || '');

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }

  const resetRecord = db.passwordResets.find(
    (r) => r.email.toLowerCase() === email && r.code === code && !r.used && r.expiresAt > Date.now()
  );

  if (!resetRecord) {
    res.status(400).json({ error: 'Invalid or expired verification code. Please request a fresh code.' });
    return;
  }

  const user = db.users.find((u) => u.id === resetRecord.userId && u.role === 'customer');
  if (!user) {
    res.status(404).json({ error: 'Customer account not found.' });
    return;
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  resetRecord.used = true;
  saveDb(db);

  res.json({ message: 'Your password has been reset successfully. You may now sign in.' });
});

apiRouter.put('/customer/profile', requireCustomerAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.authUser!.id)!;

  const name = String(req.body.name || user.name).trim();
  const phone = String(req.body.phone || user.phone).trim();
  const email = String(req.body.email || user.email).trim().toLowerCase();
  const currentPassword = req.body.currentPassword ? String(req.body.currentPassword) : '';
  const newPassword = req.body.newPassword ? String(req.body.newPassword) : '';

  if (!name || name.length < 2) {
    res.status(400).json({ error: 'Name must be at least 2 characters.' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  const emailConflict = db.users.find((u) => u.id !== user.id && u.email.toLowerCase() === email);
  if (emailConflict) {
    res.status(409).json({ error: 'That email address is already in use by another account.' });
    return;
  }

  if (newPassword) {
    if (!currentPassword || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
  }

  user.name = name;
  user.phone = phone;
  user.email = email;
  saveDb(db);

  res.json({ user: sanitizeUser(user), message: 'Profile updated successfully.' });
});

apiRouter.get('/customer/dashboard', requireCustomerAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.authUser!.id)!;

  const myInquiries = db.inquiries.filter(
    (inq) => inq.customerId === user.id || inq.email.toLowerCase() === user.email.toLowerCase()
  );

  const favoriteProperties = db.properties
    .filter((p) => user.favoritePropertyIds.includes(p.id))
    .map((p) => enrichProperty(p, db.schemes));

  res.json({
    user: sanitizeUser(user),
    inquiries: myInquiries,
    favorites: favoriteProperties,
  });
});

apiRouter.post('/customer/favorites/:propertyId', requireCustomerAuth, (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.authUser!.id)!;
  const propId = req.params.propertyId;

  const exists = db.properties.some((p) => p.id === propId);
  if (!exists) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  const idx = user.favoritePropertyIds.indexOf(propId);
  let saved = false;
  if (idx >= 0) {
    user.favoritePropertyIds.splice(idx, 1);
    saved = false;
  } else {
    user.favoritePropertyIds.push(propId);
    saved = true;
  }

  saveDb(db);
  res.json({
    saved,
    favoritePropertyIds: user.favoritePropertyIds,
  });
});

// ============================================================================
// ADMIN AUTHENTICATION & PROTECTED MANAGEMENT MODULES
// ============================================================================

apiRouter.post('/admin/auth/login', (req, res) => {
  const db = getDb();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const admin = db.users.find((u) => u.email.toLowerCase() === email && u.role !== 'customer');
  if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
    res.status(401).json({ error: 'Invalid administrator credentials.' });
    return;
  }
  if (!admin.active) {
    res.status(403).json({ error: 'This administrator account is inactive.' });
    return;
  }

  admin.lastLoginAt = new Date().toISOString();
  saveDb(db);
  recordActivity(admin, 'Authentication', 'ADMIN_LOGIN', `Administrator signed in (${admin.email}).`);

  const token = signAuthToken({ userId: admin.id, role: admin.role, scope: 'admin' });
  setSessionCookie(res, ADMIN_COOKIE, token);

  res.json({
    token,
    admin: sanitizeUser(admin),
  });
});

apiRouter.post('/admin/auth/logout', requireAdminAuth(), (req: AuthenticatedRequest, res) => {
  recordActivity(req.authUser!, 'Authentication', 'ADMIN_LOGOUT', 'Administrator signed out.');
  clearSessionCookie(res, ADMIN_COOKIE);
  res.json({ message: 'Signed out of Admin Portal.' });
});

apiRouter.get('/admin/auth/me', requireAdminAuth(), (req: AuthenticatedRequest, res) => {
  res.json({ admin: sanitizeUser(req.authUser!) });
});

// Overview Dashboard Statistics
apiRouter.get('/admin/overview', requireAdminAuth(), (_req, res) => {
  const db = getDb();
  const customers = db.users.filter((u) => u.role === 'customer');
  const admins = db.users.filter((u) => u.role !== 'customer');

  const stats: AdminDashboardStats = {
    totalCustomers: customers.length,
    totalAccounts: db.users.length,
    totalAdmins: admins.length,
    totalSchemes: db.schemes.length,
    publishedSchemes: db.schemes.filter((s) => s.published).length,
    totalProperties: db.properties.length,
    availableProperties: db.properties.filter((p) => p.status === 'Available').length,
    soldProperties: db.properties.filter((p) => p.status === 'Sold').length,
    reservedProperties: db.properties.filter((p) => p.status === 'Reserved').length,
    totalInquiries: db.inquiries.length,
    newInquiries: db.inquiries.filter((i) => i.status === 'New').length,
    recentCustomers: customers
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map(sanitizeUser),
    recentActivities: db.activityLogs.slice(0, 12),
  };

  res.json(stats);
});

// A. SCHEME MANAGEMENT
apiRouter.get('/admin/schemes', requireAdminAuth(), (_req, res) => {
  const db = getDb();
  res.json({
    schemes: [...db.schemes].sort((a, b) => a.displayOrder - b.displayOrder),
  });
});

apiRouter.post('/admin/schemes', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const name = String(req.body.name || '').trim();
  const location = String(req.body.location || '').trim();
  const description = String(req.body.description || '').trim();

  if (!name || !location || !description) {
    res.status(400).json({ error: 'Scheme name, location, and description are required.' });
    return;
  }

  let slug = slugify(String(req.body.slug || name));
  if (!slug) slug = generateId('scheme');
  if (db.schemes.some((s) => s.slug === slug)) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const now = new Date().toISOString();
  const plotCategories: PlotCategory[] = Array.isArray(req.body.plotCategories)
    ? req.body.plotCategories.map((pc: Partial<PlotCategory>) => ({
        id: pc.id || generateId('pc'),
        size: String(pc.size || '5 Marla'),
        category: pc.category === 'Commercial' ? 'Commercial' : 'Residential',
        startingPrice: Number(pc.startingPrice) || 0,
        maxPrice: pc.maxPrice ? Number(pc.maxPrice) : undefined,
        installmentAvailable: Boolean(pc.installmentAvailable),
        description: String(pc.description || ''),
      }))
    : [];

  const newScheme: HousingScheme = {
    id: generateId('scheme'),
    slug,
    name,
    tagline: String(req.body.tagline || `${name} — Master-Planned Community`),
    location,
    city: String(req.body.city || 'Lahore'),
    approvalStatus: String(req.body.approvalStatus || 'Approved Housing Scheme'),
    description,
    overviewHighlights: Array.isArray(req.body.overviewHighlights)
      ? req.body.overviewHighlights.map(String).filter(Boolean)
      : [],
    heroImage: String(req.body.heroImage || db.content.heroImage),
    gallery: Array.isArray(req.body.gallery) ? req.body.gallery.map(String).filter(Boolean) : [],
    facilities: Array.isArray(req.body.facilities) ? req.body.facilities.map(String).filter(Boolean) : [],
    plotCategories,
    mapEmbedUrl: String(req.body.mapEmbedUrl || ''),
    googleMapsUrl: String(req.body.googleMapsUrl || ''),
    contactPerson: String(req.body.contactPerson || 'Al Amaan Scheme Desk'),
    contactPhone: String(req.body.contactPhone || db.contact.primaryPhone),
    contactEmail: String(req.body.contactEmail || db.contact.email),
    published: req.body.published !== undefined ? Boolean(req.body.published) : true,
    featured: Boolean(req.body.featured),
    displayOrder: Number(req.body.displayOrder) || db.schemes.length + 1,
    createdAt: now,
    updatedAt: now,
  };

  db.schemes.push(newScheme);
  saveDb(db);
  recordActivity(req.authUser!, 'Schemes', 'SCHEME_CREATED', `Added housing scheme "${newScheme.name}".`);

  res.status(201).json({ scheme: newScheme });
});

apiRouter.put('/admin/schemes/:id', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const scheme = db.schemes.find((s) => s.id === req.params.id);
  if (!scheme) {
    res.status(404).json({ error: 'Housing scheme not found.' });
    return;
  }

  if (req.body.name !== undefined) scheme.name = String(req.body.name).trim();
  if (req.body.slug !== undefined) {
    const candidateSlug = slugify(String(req.body.slug));
    if (candidateSlug && !db.schemes.some((s) => s.id !== scheme.id && s.slug === candidateSlug)) {
      scheme.slug = candidateSlug;
    }
  }
  if (req.body.tagline !== undefined) scheme.tagline = String(req.body.tagline);
  if (req.body.location !== undefined) scheme.location = String(req.body.location);
  if (req.body.city !== undefined) scheme.city = String(req.body.city);
  if (req.body.approvalStatus !== undefined) scheme.approvalStatus = String(req.body.approvalStatus);
  if (req.body.description !== undefined) scheme.description = String(req.body.description);
  if (Array.isArray(req.body.overviewHighlights)) {
    scheme.overviewHighlights = req.body.overviewHighlights.map(String).filter(Boolean);
  }
  if (req.body.heroImage !== undefined) scheme.heroImage = String(req.body.heroImage);
  if (Array.isArray(req.body.gallery)) scheme.gallery = req.body.gallery.map(String).filter(Boolean);
  if (Array.isArray(req.body.facilities)) scheme.facilities = req.body.facilities.map(String).filter(Boolean);
  if (Array.isArray(req.body.plotCategories)) {
    scheme.plotCategories = req.body.plotCategories.map((pc: Partial<PlotCategory>) => ({
      id: pc.id || generateId('pc'),
      size: String(pc.size || '5 Marla'),
      category: pc.category === 'Commercial' ? 'Commercial' : 'Residential',
      startingPrice: Number(pc.startingPrice) || 0,
      maxPrice: pc.maxPrice ? Number(pc.maxPrice) : undefined,
      installmentAvailable: Boolean(pc.installmentAvailable),
      description: String(pc.description || ''),
    }));
  }
  if (req.body.mapEmbedUrl !== undefined) scheme.mapEmbedUrl = String(req.body.mapEmbedUrl);
  if (req.body.googleMapsUrl !== undefined) scheme.googleMapsUrl = String(req.body.googleMapsUrl);
  if (req.body.contactPerson !== undefined) scheme.contactPerson = String(req.body.contactPerson);
  if (req.body.contactPhone !== undefined) scheme.contactPhone = String(req.body.contactPhone);
  if (req.body.contactEmail !== undefined) scheme.contactEmail = String(req.body.contactEmail);
  if (req.body.published !== undefined) scheme.published = Boolean(req.body.published);
  if (req.body.featured !== undefined) scheme.featured = Boolean(req.body.featured);
  if (req.body.displayOrder !== undefined) scheme.displayOrder = Number(req.body.displayOrder) || 1;
  scheme.updatedAt = new Date().toISOString();

  saveDb(db);
  recordActivity(req.authUser!, 'Schemes', 'SCHEME_UPDATED', `Updated scheme "${scheme.name}" (published: ${scheme.published}).`);

  res.json({ scheme });
});

apiRouter.delete('/admin/schemes/:id', requireAdminAuth(['super_admin']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.schemes.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Housing scheme not found.' });
    return;
  }
  const [removed] = db.schemes.splice(idx, 1);
  saveDb(db);
  recordActivity(req.authUser!, 'Schemes', 'SCHEME_DELETED', `Deleted housing scheme "${removed.name}".`);
  res.json({ message: 'Housing scheme deleted.' });
});

// B. PROPERTY MANAGEMENT
apiRouter.get('/admin/properties', requireAdminAuth(), (_req, res) => {
  const db = getDb();
  res.json({
    properties: db.properties.map((p) => enrichProperty(p, db.schemes)),
  });
});

apiRouter.post('/admin/properties', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const title = String(req.body.title || '').trim();
  const price = Number(req.body.price);
  const location = String(req.body.location || '').trim();

  if (!title || Number.isNaN(price) || price <= 0 || !location) {
    res.status(400).json({ error: 'Valid property title, positive PKR price, and location are required.' });
    return;
  }

  const now = new Date().toISOString();
  const propCount = db.properties.length + 101;
  const newProp: PropertyItem = {
    id: generateId('prop'),
    referenceCode: String(req.body.referenceCode || `AAR-LHR-${propCount}`).trim(),
    title,
    slug: `${slugify(title)}-${Date.now().toString().slice(-4)}`,
    description: String(req.body.description || ''),
    price,
    location,
    city: String(req.body.city || 'Lahore'),
    schemeId: String(req.body.schemeId || ''),
    size: String(req.body.size || '5 Marla'),
    areaSqFt: Number(req.body.areaSqFt) || 1125,
    category: (req.body.category as PropertyCategory) || 'Residential Plot',
    status: (req.body.status as PropertyStatus) || 'Available',
    featured: Boolean(req.body.featured),
    images: Array.isArray(req.body.images) && req.body.images.length > 0
      ? req.body.images.map(String).filter(Boolean)
      : [db.content.heroImage],
    features: Array.isArray(req.body.features) ? req.body.features.map(String).filter(Boolean) : [],
    bedrooms: req.body.bedrooms ? Number(req.body.bedrooms) : undefined,
    bathrooms: req.body.bathrooms ? Number(req.body.bathrooms) : undefined,
    possessionReady: Boolean(req.body.possessionReady),
    createdAt: now,
    updatedAt: now,
  };

  db.properties.unshift(newProp);
  saveDb(db);
  recordActivity(req.authUser!, 'Properties', 'PROPERTY_CREATED', `Added listing "${newProp.title}" (${newProp.referenceCode}).`);

  res.status(201).json({ property: enrichProperty(newProp, db.schemes) });
});

apiRouter.put('/admin/properties/:id', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const prop = db.properties.find((p) => p.id === req.params.id);
  if (!prop) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }

  if (req.body.title !== undefined) prop.title = String(req.body.title).trim();
  if (req.body.referenceCode !== undefined) prop.referenceCode = String(req.body.referenceCode).trim();
  if (req.body.description !== undefined) prop.description = String(req.body.description);
  if (req.body.price !== undefined) prop.price = Number(req.body.price) || prop.price;
  if (req.body.location !== undefined) prop.location = String(req.body.location);
  if (req.body.city !== undefined) prop.city = String(req.body.city);
  if (req.body.schemeId !== undefined) prop.schemeId = String(req.body.schemeId);
  if (req.body.size !== undefined) prop.size = String(req.body.size);
  if (req.body.areaSqFt !== undefined) prop.areaSqFt = Number(req.body.areaSqFt) || prop.areaSqFt;
  if (req.body.category !== undefined) prop.category = req.body.category as PropertyCategory;
  if (req.body.status !== undefined) prop.status = req.body.status as PropertyStatus;
  if (req.body.featured !== undefined) prop.featured = Boolean(req.body.featured);
  if (Array.isArray(req.body.images) && req.body.images.length > 0) {
    prop.images = req.body.images.map(String).filter(Boolean);
  }
  if (Array.isArray(req.body.features)) {
    prop.features = req.body.features.map(String).filter(Boolean);
  }
  prop.bedrooms = req.body.bedrooms ? Number(req.body.bedrooms) : undefined;
  prop.bathrooms = req.body.bathrooms ? Number(req.body.bathrooms) : undefined;
  if (req.body.possessionReady !== undefined) prop.possessionReady = Boolean(req.body.possessionReady);
  prop.updatedAt = new Date().toISOString();

  saveDb(db);
  recordActivity(req.authUser!, 'Properties', 'PROPERTY_UPDATED', `Updated "${prop.title}" (Status: ${prop.status}).`);

  res.json({ property: enrichProperty(prop, db.schemes) });
});

apiRouter.delete('/admin/properties/:id', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.properties.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Property not found.' });
    return;
  }
  const [removed] = db.properties.splice(idx, 1);
  saveDb(db);
  recordActivity(req.authUser!, 'Properties', 'PROPERTY_DELETED', `Deleted property "${removed.title}".`);
  res.json({ message: 'Property deleted successfully.' });
});

// C. CUSTOMER MANAGEMENT
apiRouter.get('/admin/customers', requireAdminAuth(), (_req, res) => {
  const db = getDb();
  const customers = db.users.filter((u) => u.role === 'customer').map(sanitizeUser);
  res.json({ customers });
});

apiRouter.put('/admin/customers/:id', requireAdminAuth(['super_admin', 'support']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const customer = db.users.find((u) => u.id === req.params.id && u.role === 'customer');
  if (!customer) {
    res.status(404).json({ error: 'Customer account not found.' });
    return;
  }

  if (req.body.name !== undefined) customer.name = String(req.body.name).trim();
  if (req.body.phone !== undefined) customer.phone = String(req.body.phone).trim();
  if (req.body.email !== undefined) {
    const nextEmail = String(req.body.email).trim().toLowerCase();
    if (isValidEmail(nextEmail) && !db.users.some((u) => u.id !== customer.id && u.email.toLowerCase() === nextEmail)) {
      customer.email = nextEmail;
    }
  }
  if (req.body.active !== undefined) {
    customer.active = Boolean(req.body.active);
  }

  saveDb(db);
  recordActivity(
    req.authUser!,
    'Customers',
    'CUSTOMER_UPDATED',
    `Updated customer "${customer.name}" (Active: ${customer.active}).`
  );

  res.json({ customer: sanitizeUser(customer) });
});

// D. INQUIRY MANAGEMENT
apiRouter.get('/admin/inquiries', requireAdminAuth(), (_req, res) => {
  const db = getDb();
  res.json({ inquiries: db.inquiries });
});

apiRouter.put('/admin/inquiries/:id', requireAdminAuth(), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const inquiry = db.inquiries.find((i) => i.id === req.params.id);
  if (!inquiry) {
    res.status(404).json({ error: 'Inquiry not found.' });
    return;
  }

  if (req.body.status !== undefined) {
    inquiry.status = req.body.status as InquiryStatus;
  }
  if (req.body.note && String(req.body.note).trim()) {
    inquiry.internalNotes.unshift({
      id: generateId('note'),
      authorId: req.authUser!.id,
      authorName: req.authUser!.name,
      note: String(req.body.note).trim(),
      createdAt: new Date().toISOString(),
    });
  }
  inquiry.updatedAt = new Date().toISOString();

  saveDb(db);
  recordActivity(
    req.authUser!,
    'Inquiries',
    'INQUIRY_UPDATED',
    `Updated inquiry from "${inquiry.name}" to status "${inquiry.status}".`
  );

  res.json({ inquiry });
});

apiRouter.delete('/admin/inquiries/:id', requireAdminAuth(['super_admin']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.inquiries.findIndex((i) => i.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Inquiry not found.' });
    return;
  }
  const [removed] = db.inquiries.splice(idx, 1);
  saveDb(db);
  recordActivity(req.authUser!, 'Inquiries', 'INQUIRY_DELETED', `Deleted inquiry from "${removed.name}".`);
  res.json({ message: 'Inquiry deleted.' });
});

// E. WEBSITE CONTENT MANAGEMENT (CMS + Statistics + Services + Legal)
apiRouter.put('/admin/content', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  db.content = {
    ...db.content,
    ...req.body,
  };
  saveDb(db);
  recordActivity(req.authUser!, 'Content', 'CONTENT_UPDATED', 'Updated website copy, statistics, and section headings.');
  res.json({ content: db.content });
});

// F. CONTACT MANAGEMENT
apiRouter.put('/admin/contact', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  db.contact = {
    ...db.contact,
    ...req.body,
  };
  saveDb(db);
  recordActivity(req.authUser!, 'Contact', 'CONTACT_UPDATED', 'Updated agency phone numbers, WhatsApp, and office location.');
  res.json({ contact: db.contact });
});

// G. SOCIAL MEDIA MANAGEMENT
apiRouter.put('/admin/social', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  db.social = {
    ...db.social,
    ...req.body,
  };
  saveDb(db);
  recordActivity(req.authUser!, 'Social Media', 'SOCIAL_UPDATED', 'Updated official social media links.');
  res.json({ social: db.social });
});

// H. NAVIGATION MANAGEMENT
apiRouter.put('/admin/navigation', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!Array.isArray(req.body.navigation)) {
    res.status(400).json({ error: 'Navigation array is required.' });
    return;
  }
  db.navigation = req.body.navigation.map((item: Partial<NavItem>, idx: number) => ({
    id: item.id || generateId('nav'),
    label: String(item.label || 'Link').trim(),
    path: String(item.path || '/').trim(),
    isExternal: Boolean(item.isExternal),
    visible: item.visible !== undefined ? Boolean(item.visible) : true,
    order: Number(item.order) || idx + 1,
    placement: item.placement || 'header',
  }));
  saveDb(db);
  recordActivity(req.authUser!, 'Navigation', 'NAVIGATION_UPDATED', 'Updated header and footer navigation menus.');
  res.json({ navigation: db.navigation });
});

// I. TESTIMONIALS MANAGEMENT
apiRouter.get('/admin/testimonials', requireAdminAuth(), (_req, res) => {
  const db = getDb();
  res.json({ testimonials: db.testimonials });
});

apiRouter.post('/admin/testimonials', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const name = String(req.body.name || '').trim();
  const quote = String(req.body.quote || '').trim();
  if (!name || !quote) {
    res.status(400).json({ error: 'Client name and review quote are required.' });
    return;
  }
  const item: TestimonialItem = {
    id: generateId('test'),
    name,
    role: String(req.body.role || 'Property Investor').trim(),
    location: String(req.body.location || 'Lahore').trim(),
    investmentContext: String(req.body.investmentContext || 'Al Jalil Garden').trim(),
    quote,
    published: req.body.published !== undefined ? Boolean(req.body.published) : true,
    createdAt: new Date().toISOString(),
  };
  db.testimonials.unshift(item);
  saveDb(db);
  recordActivity(req.authUser!, 'Testimonials', 'TESTIMONIAL_ADDED', `Added testimonial from "${item.name}".`);
  res.status(201).json({ testimonial: item });
});

apiRouter.put('/admin/testimonials/:id', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const item = db.testimonials.find((t) => t.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Testimonial not found.' });
    return;
  }
  if (req.body.name !== undefined) item.name = String(req.body.name).trim();
  if (req.body.role !== undefined) item.role = String(req.body.role).trim();
  if (req.body.location !== undefined) item.location = String(req.body.location).trim();
  if (req.body.investmentContext !== undefined) item.investmentContext = String(req.body.investmentContext).trim();
  if (req.body.quote !== undefined) item.quote = String(req.body.quote).trim();
  if (req.body.published !== undefined) item.published = Boolean(req.body.published);
  saveDb(db);
  recordActivity(req.authUser!, 'Testimonials', 'TESTIMONIAL_UPDATED', `Updated testimonial from "${item.name}".`);
  res.json({ testimonial: item });
});

apiRouter.delete('/admin/testimonials/:id', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.testimonials.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Testimonial not found.' });
    return;
  }
  const [removed] = db.testimonials.splice(idx, 1);
  saveDb(db);
  recordActivity(req.authUser!, 'Testimonials', 'TESTIMONIAL_DELETED', `Deleted testimonial from "${removed.name}".`);
  res.json({ message: 'Testimonial deleted.' });
});

// J. MEDIA MANAGEMENT (Upload, Replace, Delete)
apiRouter.get('/admin/media', requireAdminAuth(), (_req, res) => {
  const db = getDb();
  res.json({ media: db.media });
});

apiRouter.post(
  '/admin/media/upload',
  requireAdminAuth(['super_admin', 'editor']),
  upload.single('file'),
  (req: AuthenticatedRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No valid image file uploaded.' });
      return;
    }
    const db = getDb();
    const title = String(req.body.title || req.file.originalname).trim();
    const asset = {
      id: generateId('med'),
      title,
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      isSystemAsset: false,
      uploadedAt: new Date().toISOString(),
    };
    db.media.unshift(asset);
    saveDb(db);
    recordActivity(req.authUser!, 'Media', 'MEDIA_UPLOADED', `Uploaded image "${asset.title}".`);
    res.status(201).json({ asset });
  }
);

apiRouter.put(
  '/admin/media/:id/replace',
  requireAdminAuth(['super_admin', 'editor']),
  upload.single('file'),
  (req: AuthenticatedRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'Please select a replacement image file.' });
      return;
    }
    const db = getDb();
    const asset = db.media.find((m) => m.id === req.params.id);
    if (!asset) {
      res.status(404).json({ error: 'Media item not found.' });
      return;
    }

    const oldUrl = asset.url;
    if (!asset.isSystemAsset && asset.filename) {
      const oldPath = path.join(UPLOADS_DIR, asset.filename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const newUrl = `/uploads/${req.file.filename}`;
    asset.url = newUrl;
    asset.filename = req.file.filename;
    asset.mimeType = req.file.mimetype;
    asset.sizeBytes = req.file.size;
    asset.isSystemAsset = false;
    asset.uploadedAt = new Date().toISOString();

    // Automatically cascade replacement URL across schemes, properties, and content!
    if (db.content.heroImage === oldUrl) db.content.heroImage = newUrl;
    if (db.content.aboutImage === oldUrl) db.content.aboutImage = newUrl;
    if (db.settings.logoUrl === oldUrl) db.settings.logoUrl = newUrl;
    db.schemes.forEach((s) => {
      if (s.heroImage === oldUrl) s.heroImage = newUrl;
      s.gallery = s.gallery.map((g) => (g === oldUrl ? newUrl : g));
    });
    db.properties.forEach((p) => {
      p.images = p.images.map((img) => (img === oldUrl ? newUrl : img));
    });

    saveDb(db);
    recordActivity(req.authUser!, 'Media', 'MEDIA_REPLACED', `Replaced media asset "${asset.title}".`);
    res.json({ asset });
  }
);

apiRouter.delete('/admin/media/:id', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const idx = db.media.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Media item not found.' });
    return;
  }
  const asset = db.media[idx];
  if (asset.isSystemAsset) {
    res.status(400).json({ error: 'Core system architecture photography cannot be deleted, only replaced.' });
    return;
  }
  if (asset.filename) {
    const diskPath = path.join(UPLOADS_DIR, asset.filename);
    if (fs.existsSync(diskPath)) {
      fs.unlinkSync(diskPath);
    }
  }
  db.media.splice(idx, 1);
  saveDb(db);
  recordActivity(req.authUser!, 'Media', 'MEDIA_DELETED', `Deleted uploaded image "${asset.title}".`);
  res.json({ message: 'Media deleted.' });
});

// K. SEO MANAGEMENT
apiRouter.put('/admin/seo', requireAdminAuth(['super_admin', 'editor']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  if (!Array.isArray(req.body.seo)) {
    res.status(400).json({ error: 'SEO configuration array is required.' });
    return;
  }
  db.seo = req.body.seo.map((entry: PageSEOConfig) => ({
    pageKey: String(entry.pageKey),
    pageLabel: String(entry.pageLabel),
    title: String(entry.title || ''),
    description: String(entry.description || ''),
    keywords: String(entry.keywords || ''),
    ogImage: String(entry.ogImage || ''),
  }));
  saveDb(db);
  recordActivity(req.authUser!, 'SEO', 'SEO_UPDATED', 'Updated page titles, meta descriptions, and social cards.');
  res.json({ seo: db.seo });
});

// L. ADMIN PROFILE & ROLE-BASED TEAM ADMINS
apiRouter.put('/admin/profile', requireAdminAuth(), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const admin = db.users.find((u) => u.id === req.authUser!.id)!;

  const name = String(req.body.name || admin.name).trim();
  const email = String(req.body.email || admin.email).trim().toLowerCase();
  const phone = String(req.body.phone || admin.phone).trim();
  const currentPassword = req.body.currentPassword ? String(req.body.currentPassword) : '';
  const newPassword = req.body.newPassword ? String(req.body.newPassword) : '';

  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (db.users.some((u) => u.id !== admin.id && u.email.toLowerCase() === email)) {
    res.status(409).json({ error: 'Email is already assigned to another account.' });
    return;
  }

  if (newPassword) {
    if (!currentPassword || !bcrypt.compareSync(currentPassword, admin.passwordHash)) {
      res.status(400).json({ error: 'Current administrator password is incorrect.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }
    admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  }

  admin.name = name;
  admin.email = email;
  admin.phone = phone;
  saveDb(db);
  recordActivity(admin, 'Admin Profile', 'PROFILE_UPDATED', `Updated administrator profile (${admin.email}).`);

  res.json({ admin: sanitizeUser(admin), message: 'Administrator profile updated.' });
});

apiRouter.get('/admin/team', requireAdminAuth(['super_admin']), (_req, res) => {
  const db = getDb();
  const team = db.users.filter((u) => u.role !== 'customer').map(sanitizeUser);
  res.json({ team });
});

apiRouter.post('/admin/team', requireAdminAuth(['super_admin']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const phone = String(req.body.phone || '').trim();
  const password = String(req.body.password || '');
  const role = (req.body.role as UserRole) || 'editor';

  if (!['super_admin', 'editor', 'support'].includes(role)) {
    res.status(400).json({ error: 'Invalid administrative role.' });
    return;
  }
  if (!name || !isValidEmail(email) || password.length < 6) {
    res.status(400).json({ error: 'Name, valid email, and password (min 6 chars) are required.' });
    return;
  }
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const newMember = {
    id: generateId('adm'),
    name,
    email,
    phone,
    role,
    active: true,
    favoritePropertyIds: [],
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };

  db.users.push(newMember);
  saveDb(db);
  recordActivity(req.authUser!, 'Admin Team', 'ADMIN_CREATED', `Created ${role} account for "${newMember.name}".`);
  res.status(201).json({ member: sanitizeUser(newMember) });
});

// M. GENERAL SETTINGS
apiRouter.put('/admin/settings', requireAdminAuth(['super_admin']), (req: AuthenticatedRequest, res) => {
  const db = getDb();
  db.settings = {
    ...db.settings,
    ...req.body,
  };
  saveDb(db);
  recordActivity(req.authUser!, 'Settings', 'SETTINGS_UPDATED', 'Updated general brand, WhatsApp, and site configuration.');
  res.json({ settings: db.settings });
});

// N. ACTIVITY LOGS
apiRouter.get('/admin/activity-logs', requireAdminAuth(), (_req, res) => {
  const db = getDb();
  res.json({ logs: db.activityLogs });
});
