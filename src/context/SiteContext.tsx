import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, getStoredToken, setStoredToken } from '../services/api';
import type { PublicBootstrapPayload, UserAccount } from '../types/models';

interface SiteContextValue {
  data: PublicBootstrapPayload | null;
  loading: boolean;
  error: string | null;
  refreshPublicData: () => Promise<void>;

  customer: UserAccount | null;
  customerLoading: boolean;
  loginCustomer: (email: string, password: string) => Promise<void>;
  registerCustomer: (payload: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logoutCustomer: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
  toggleFavoriteProperty: (propertyId: string) => Promise<boolean>;

  admin: UserAccount | null;
  adminLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const SiteContext = createContext<SiteContextValue | undefined>(undefined);

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PublicBootstrapPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<UserAccount | null>(null);
  const [customerLoading, setCustomerLoading] = useState<boolean>(true);

  const [admin, setAdmin] = useState<UserAccount | null>(null);
  const [adminLoading, setAdminLoading] = useState<boolean>(true);

  const refreshPublicData = useCallback(async () => {
    try {
      setError(null);
      const payload = await apiRequest<PublicBootstrapPayload>('/api/public/bootstrap');
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to Al Amaan server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCustomer = useCallback(async () => {
    const token = getStoredToken('customer');
    if (!token) {
      setCustomer(null);
      setCustomerLoading(false);
      return;
    }
    try {
      const res = await apiRequest<{ user: UserAccount }>('/api/auth/me', { scope: 'customer' });
      setCustomer(res.user);
    } catch {
      setStoredToken('customer', null);
      setCustomer(null);
    } finally {
      setCustomerLoading(false);
    }
  }, []);

  const refreshAdmin = useCallback(async () => {
    const token = getStoredToken('admin');
    if (!token) {
      setAdmin(null);
      setAdminLoading(false);
      return;
    }
    try {
      const res = await apiRequest<{ admin: UserAccount }>('/api/admin/auth/me', { scope: 'admin' });
      setAdmin(res.admin);
    } catch {
      setStoredToken('admin', null);
      setAdmin(null);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPublicData();
    void refreshCustomer();
    void refreshAdmin();
  }, [refreshPublicData, refreshCustomer, refreshAdmin]);

  const loginCustomer = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; user: UserAccount }>('/api/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password },
    });
    setStoredToken('customer', res.token);
    setCustomer(res.user);
  };

  const registerCustomer = async (payload: { name: string; email: string; phone: string; password: string }) => {
    const res = await apiRequest<{ token: string; user: UserAccount }>('/api/auth/register', {
      method: 'POST',
      body: { ...payload, email: payload.email.trim().toLowerCase() },
    });
    setStoredToken('customer', res.token);
    setCustomer(res.user);
  };

  const logoutCustomer = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST', scope: 'customer' });
    } catch {
      // Ignore network errors on logout
    }
    setStoredToken('customer', null);
    setCustomer(null);
  };

  const toggleFavoriteProperty = async (propertyId: string): Promise<boolean> => {
    const res = await apiRequest<{ saved: boolean; favoritePropertyIds: string[] }>(
      `/api/customer/favorites/${propertyId}`,
      { method: 'POST', scope: 'customer' }
    );
    setCustomer((prev) => (prev ? { ...prev, favoritePropertyIds: res.favoritePropertyIds } : prev));
    return res.saved;
  };

  const loginAdmin = async (email: string, password: string) => {
    const res = await apiRequest<{ token: string; admin: UserAccount }>('/api/admin/auth/login', {
      method: 'POST',
      body: { email: email.trim().toLowerCase(), password },
    });
    setStoredToken('admin', res.token);
    setAdmin(res.admin);
  };

  const logoutAdmin = async () => {
    try {
      await apiRequest('/api/admin/auth/logout', { method: 'POST', scope: 'admin' });
    } catch {
      // Ignore network errors on logout
    }
    setStoredToken('admin', null);
    setAdmin(null);
  };

  return (
    <SiteContext.Provider
      value={{
        data,
        loading,
        error,
        refreshPublicData,
        customer,
        customerLoading,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        refreshCustomer,
        toggleFavoriteProperty,
        admin,
        adminLoading,
        loginAdmin,
        logoutAdmin,
        refreshAdmin,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export function useSite(): SiteContextValue {
  const ctx = useContext(SiteContext);
  if (!ctx) {
    throw new Error('useSite must be used inside SiteProvider');
  }
  return ctx;
}
