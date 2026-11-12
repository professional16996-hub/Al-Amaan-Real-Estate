import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getDb, type StoredUser } from './db.ts';
import type { UserRole } from '../src/types/models.ts';

const RUNTIME_SECRET =
  process.env.JWT_SECRET && process.env.JWT_SECRET !== 'replace-with-strong-production-jwt-secret'
    ? process.env.JWT_SECRET
    : crypto.createHash('sha256').update(`al-amaan-jwt-${process.cwd()}`).digest('hex');

export const CUSTOMER_COOKIE = 'al_amaan_customer_token';
export const ADMIN_COOKIE = 'al_amaan_admin_token';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  scope: 'customer' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  authUser?: StoredUser;
}

export function signAuthToken(payload: TokenPayload): string {
  return jwt.sign(payload, RUNTIME_SECRET, { expiresIn: '7d' });
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, RUNTIME_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, cookieName: string, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response, cookieName: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
  });
}

function extractToken(req: Request, scope: 'customer' | 'admin'): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const candidate = authHeader.slice(7).trim();
    if (candidate) {
      return candidate;
    }
  }
  const cookieName = scope === 'admin' ? ADMIN_COOKIE : CUSTOMER_COOKIE;
  const cookieVal = req.cookies?.[cookieName];
  if (typeof cookieVal === 'string' && cookieVal.trim()) {
    return cookieVal.trim();
  }
  return null;
}

export function resolveOptionalCustomer(req: Request): StoredUser | null {
  const token = extractToken(req, 'customer');
  if (!token) return null;
  const decoded = verifyAuthToken(token);
  if (!decoded || decoded.scope !== 'customer') return null;
  const db = getDb();
  const user = db.users.find((u) => u.id === decoded.userId && u.role === 'customer' && u.active);
  return user || null;
}

export function requireCustomerAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req, 'customer');
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in to your client account.' });
    return;
  }
  const decoded = verifyAuthToken(token);
  if (!decoded || decoded.scope !== 'customer') {
    res.status(401).json({ error: 'Invalid or expired client session. Please sign in again.' });
    return;
  }
  const db = getDb();
  const user = db.users.find((u) => u.id === decoded.userId && u.role === 'customer');
  if (!user) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }
  if (!user.active) {
    res.status(403).json({ error: 'Your account is currently deactivated. Please contact Al Amaan support.' });
    return;
  }
  req.authUser = user;
  next();
}

export function requireAdminAuth(allowedRoles: UserRole[] = ['super_admin', 'editor', 'support']) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const token = extractToken(req, 'admin');
    if (!token) {
      res.status(401).json({ error: 'Admin authentication required.' });
      return;
    }
    const decoded = verifyAuthToken(token);
    if (!decoded || decoded.scope !== 'admin') {
      res.status(401).json({ error: 'Invalid or expired admin session.' });
      return;
    }
    const db = getDb();
    const admin = db.users.find((u) => u.id === decoded.userId && u.role !== 'customer');
    if (!admin) {
      res.status(401).json({ error: 'Administrator account not found.' });
      return;
    }
    if (!admin.active) {
      res.status(403).json({ error: 'This administrator account has been deactivated.' });
      return;
    }
    if (!allowedRoles.includes(admin.role)) {
      res.status(403).json({ error: 'Insufficient role permissions for this administrative operation.' });
      return;
    }
    req.authUser = admin;
    next();
  };
}
