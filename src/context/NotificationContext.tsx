import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { apiRequest } from '../services/api';
import type { SiteNotification } from '../types/models';
import { useSite } from './SiteContext';

type BrowserPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface NotificationContextValue {
  notifications: SiteNotification[];
  unreadCount: number;
  readIds: Set<string>;
  permission: BrowserPermissionState;
  swReady: boolean;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  requestMobilePermission: () => Promise<BrowserPermissionState>;
  sendTestMobileNotification: () => Promise<{ ok: boolean; text: string }>;
}

const READ_STORAGE_KEY = 'al_amaan_notif_read_ids_v1';
const OS_SENT_STORAGE_KEY = 'al_amaan_notif_os_sent_v1';

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function loadIdSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

function saveIdSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set).slice(-200)));
  } catch {
    // Ignore storage quota errors
  }
}

function detectPermission(): BrowserPermissionState {
  try {
    if (typeof window === 'undefined' || !('Notification' in window) || !window.Notification) {
      return 'unsupported';
    }
    return (window.Notification.permission || 'default') as BrowserPermissionState;
  } catch {
    return 'unsupported';
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customer, admin } = useSite();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const [notifications, setNotifications] = useState<SiteNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadIdSet(READ_STORAGE_KEY));
  const [permission, setPermission] = useState<BrowserPermissionState>(() => detectPermission());
  const [swReady, setSwReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastNotif, setToastNotif] = useState<SiteNotification | null>(null);

  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);
  const initialSyncedRef = useRef(false);
  const osSentIdsRef = useRef<Set<string>>(loadIdSet(OS_SENT_STORAGE_KEY));

  // Register Service Worker for Android Chrome & mobile notification bar delivery
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let active = true;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (!active) return;
        swRegRef.current = reg;
        setSwReady(true);
      })
      .catch(() => {
        // Non-blocking fallback if SW blocked by strict environment
      });
    return () => {
      active = false;
    };
  }, []);

  const dispatchMobileBarAlert = useCallback(async (notif: SiteNotification): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;

    const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
      body: notif.message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: notif.id,
      renotify: true,
      vibrate: [140, 60, 140],
      data: { url: notif.link || '/' },
    };

    try {
      let reg = swRegRef.current;
      if (!reg && 'serviceWorker' in navigator) {
        reg = (await navigator.serviceWorker.getRegistration('/')) || null;
        if (!reg) {
          reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
          ]);
        }
        if (reg) swRegRef.current = reg;
      }

      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(notif.title, options);
        return true;
      }
    } catch {
      // Fallback to standard Notification constructor below
    }

    try {
      const n = new Notification(notif.title, {
        body: notif.message,
        icon: '/pwa-192x192.png',
        tag: notif.id,
      });
      n.onclick = () => {
        try {
          window.focus();
          if (notif.link) navigate(notif.link);
          n.close();
        } catch {
          // ignore
        }
      };
      return true;
    } catch {
      return false;
    }
  }, [navigate]);

  const refreshNotifications = useCallback(async () => {
    try {
      let list: SiteNotification[] = [];
      if (isAdminRoute && admin) {
        const res = await apiRequest<{ notifications: SiteNotification[] }>('/api/admin/notifications', {
          scope: 'admin',
        });
        list = res.notifications || [];
      } else {
        const res = await apiRequest<{ notifications: SiteNotification[] }>('/api/public/notifications', {
          scope: customer ? 'customer' : 'public',
        });
        list = res.notifications || [];
      }

      setNotifications(list);

      if (!initialSyncedRef.current) {
        // Seed initial OS-sent IDs so page reload doesn't replay old historical notifications
        list.forEach((n) => osSentIdsRef.current.add(n.id));
        saveIdSet(OS_SENT_STORAGE_KEY, osSentIdsRef.current);
        initialSyncedRef.current = true;
      } else {
        // Check for brand-new notifications that arrived after initial load
        const newlyArrived = list.filter((n) => !osSentIdsRef.current.has(n.id));
        if (newlyArrived.length > 0) {
          newlyArrived.forEach((n) => osSentIdsRef.current.add(n.id));
          saveIdSet(OS_SENT_STORAGE_KEY, osSentIdsRef.current);

          const latest = newlyArrived[0];
          setToastNotif(latest);
          void dispatchMobileBarAlert(latest);
        }
      }
    } catch {
      // Fail silently on transient background polling errors
    } finally {
      setLoading(false);
    }
  }, [isAdminRoute, admin, customer, dispatchMobileBarAlert]);

  useEffect(() => {
    initialSyncedRef.current = false;
    void refreshNotifications();
  }, [refreshNotifications]);

  // Live background sync (every 12s + when returning to mobile tab)
  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, 12_000);

    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        setPermission(detectPermission());
        void refreshNotifications();
      }
    };

    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [refreshNotifications]);

  // Auto-dismiss in-app toast after 6 seconds
  useEffect(() => {
    if (!toastNotif) return;
    const t = window.setTimeout(() => setToastNotif(null), 6500);
    return () => window.clearTimeout(t);
  }, [toastNotif]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveIdSet(READ_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveIdSet(READ_STORAGE_KEY, next);
      return next;
    });
  }, [notifications]);

  const requestMobilePermission = useCallback(async (): Promise<BrowserPermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      const nextState = result as BrowserPermissionState;
      setPermission(nextState);

      if (nextState === 'granted') {
        await dispatchMobileBarAlert({
          id: `welcome_${Date.now()}`,
          title: 'Al Amaan Real Estate Alerts Enabled',
          message: 'You will now receive new projects, plot listings & site updates in your notification bar.',
          category: 'announcement',
          link: '/projects',
          targetAudience: 'all',
          createdAt: new Date().toISOString(),
        });
      }
      return nextState;
    } catch {
      const current = detectPermission();
      setPermission(current);
      return current;
    }
  }, [dispatchMobileBarAlert]);

  const sendTestMobileNotification = useCallback(async (): Promise<{ ok: boolean; text: string }> => {
    const latest = notifications[0] || {
      id: `test_${Date.now()}`,
      title: 'Al Amaan Real Estate & Developers',
      message: 'Live mobile notification bar is active and working properly.',
      category: 'announcement' as const,
      link: '/projects',
      targetAudience: 'all' as const,
      createdAt: new Date().toISOString(),
    };

    const currentPerm = detectPermission();
    setPermission(currentPerm);

    if (currentPerm === 'unsupported') {
      setToastNotif(latest);
      return { ok: false, text: 'Browser OS notifications are unsupported here; in-app alerts remain active.' };
    }

    if (currentPerm === 'default') {
      const granted = await requestMobilePermission();
      if (granted === 'granted') {
        return { ok: true, text: 'Notification sent to your phone notification bar.' };
      }
      setToastNotif(latest);
      return { ok: false, text: 'Permission was not granted in browser settings.' };
    }

    if (currentPerm === 'denied') {
      setToastNotif(latest);
      return { ok: false, text: 'Notifications are blocked in your browser settings. Allow notifications for this site to see them in your phone bar.' };
    }

    const delivered = await dispatchMobileBarAlert({
      ...latest,
      id: `${latest.id}_${Date.now()}`,
    });

    if (delivered) {
      return { ok: true, text: 'Notification dispatched to your device notification bar.' };
    }
    setToastNotif(latest);
    return { ok: false, text: 'Displayed inside app (OS notification blocked by current embedded frame).' };
  }, [notifications, requestMobilePermission, dispatchMobileBarAlert]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        readIds,
        permission,
        swReady,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        requestMobilePermission,
        sendTestMobileNotification,
      }}
    >
      {children}

      {/* Non-intrusive Live In-App Mobile Notification Banner */}
      {toastNotif && (
        <div className="fixed top-[4.5rem] right-3 left-3 sm:left-auto sm:w-96 z-50 bg-[#0B192C] text-white border border-[#B89146] rounded-md shadow-2xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B89146]/20 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <button
            type="button"
            onClick={() => {
              markAsRead(toastNotif.id);
              const target = toastNotif.link || '/';
              setToastNotif(null);
              navigate(target);
            }}
            className="flex-1 text-left min-w-0"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#D4AF37]">
              New Alert
            </p>
            <p className="text-xs font-semibold text-white truncate">{toastNotif.title}</p>
            <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{toastNotif.message}</p>
          </button>
          <button
            type="button"
            onClick={() => setToastNotif(null)}
            aria-label="Dismiss notification"
            className="p-1 text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }
  return ctx;
}
