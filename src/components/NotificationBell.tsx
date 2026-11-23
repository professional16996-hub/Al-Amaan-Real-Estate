import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  Building2,
  Calendar,
  CheckCheck,
  Compass,
  Layers,
  Megaphone,
  MessageSquare,
  Smartphone,
  X,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import type { NotificationCategory, SiteNotification } from '../types/models';

interface NotificationBellProps {
  variant?: 'dark-header' | 'light-header';
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 60_000) return 'Just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
}

function getCategoryMeta(cat: NotificationCategory) {
  switch (cat) {
    case 'project':
      return { label: 'Project', Icon: Compass, tone: 'bg-[#0B192C]/10 text-[#0B192C]' };
    case 'property':
      return { label: 'Property', Icon: Building2, tone: 'bg-emerald-50 text-emerald-700' };
    case 'development':
      return { label: 'Site Update', Icon: Calendar, tone: 'bg-amber-50 text-amber-800' };
    case 'payment_plan':
      return { label: 'Payment Plan', Icon: Layers, tone: 'bg-indigo-50 text-indigo-700' };
    case 'inquiry':
      return { label: 'Inquiry', Icon: MessageSquare, tone: 'bg-sky-50 text-sky-700' };
    default:
      return { label: 'Alert', Icon: Megaphone, tone: 'bg-[#B89146]/15 text-[#9F7A31]' };
  }
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ variant = 'dark-header' }) => {
  const {
    notifications,
    unreadCount,
    readIds,
    permission,
    loading,
    markAsRead,
    markAllAsRead,
    requestMobilePermission,
    sendTestMobileNotification,
    refreshNotifications,
  } = useNotifications();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'project' | 'property' | 'updates'>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'project') return notifications.filter((n) => n.category === 'project');
    if (filter === 'property') return notifications.filter((n) => n.category === 'property');
    return notifications.filter(
      (n) =>
        n.category === 'development' ||
        n.category === 'payment_plan' ||
        n.category === 'inquiry' ||
        n.category === 'announcement'
    );
  }, [notifications, filter]);

  const handleOpenItem = (notif: SiteNotification) => {
    markAsRead(notif.id);
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleEnableMobileAlerts = async () => {
    setStatusMessage(null);
    const result = await requestMobilePermission();
    if (result === 'granted') {
      setStatusMessage('Mobile notification bar alerts enabled.');
    } else if (result === 'denied') {
      setStatusMessage('Blocked in browser settings. Enable site notifications in Chrome/Safari settings.');
    } else if (result === 'unsupported') {
      setStatusMessage('In-app notifications are active; this browser frame does not expose system tray alerts.');
    }
  };

  const handleSendTest = async () => {
    const res = await sendTestMobileNotification();
    setStatusMessage(res.text);
  };

  const btnStyle =
    variant === 'dark-header'
      ? 'text-white hover:text-[#D4AF37] hover:bg-white/10'
      : 'text-slate-700 hover:text-[#0B192C] hover:bg-slate-100 border border-slate-200';

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) void refreshNotifications();
            return next;
          });
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        className={`relative w-10 h-10 inline-flex items-center justify-center rounded transition-colors ${btnStyle}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#B89146] text-[#07111E] text-[10px] font-mono-num font-bold leading-none flex items-center justify-center shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[4.25rem] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[390px] max-w-full bg-white text-slate-900 border border-slate-200 rounded-md shadow-2xl z-50 overflow-hidden">
          {/* Drawer Header */}
          <div className="px-4 py-3 bg-[#0B192C] text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <BellRing className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span className="text-xs font-semibold tracking-wide truncate">
                Notifications ({notifications.length})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D4AF37] hover:underline"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Phone Notification Bar Control */}
          <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-slate-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="w-4 h-4 text-[#9F7A31] shrink-0" />
                <span className="text-[11px] font-semibold text-slate-700 truncate">
                  {permission === 'granted'
                    ? 'Mobile Notification Bar: Active'
                    : permission === 'denied'
                      ? 'Phone Alerts Blocked in Browser'
                      : permission === 'unsupported'
                        ? 'In-App Alerts Active'
                        : 'Get Alerts in Phone Notification Bar'}
                </span>
              </div>

              {permission === 'default' && (
                <button
                  type="button"
                  onClick={handleEnableMobileAlerts}
                  className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] whitespace-nowrap shrink-0"
                >
                  Enable Alerts
                </button>
              )}

              {permission === 'granted' && (
                <button
                  type="button"
                  onClick={handleSendTest}
                  className="px-2.5 py-1 text-[11px] font-semibold border border-[#0B192C] text-[#0B192C] rounded hover:bg-[#0B192C] hover:text-white whitespace-nowrap shrink-0"
                >
                  Test Bar Alert
                </button>
              )}
            </div>

            {statusMessage && (
              <p className="text-[11px] text-slate-600 leading-snug">{statusMessage}</p>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white">
            {[
              { id: 'all', label: 'All' },
              { id: 'project', label: 'Projects' },
              { id: 'property', label: 'Properties' },
              { id: 'updates', label: 'Updates & Plans' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as typeof filter)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? 'bg-[#0B192C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification Items List */}
          <div className="max-h-[58vh] sm:max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">Loading notifications...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No notifications in this category yet.
              </div>
            ) : (
              filtered.map((item) => {
                const isUnread = !readIds.has(item.id);
                const meta = getCategoryMeta(item.category);
                const Icon = meta.Icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenItem(item)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-slate-50 ${
                      isUnread ? 'bg-[#F7F1E3]/40' : 'bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${meta.tone}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9F7A31]">
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-mono-num text-slate-400 shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 leading-snug ${isUnread ? 'font-semibold text-[#0B192C]' : 'font-medium text-slate-800'}`}>
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#B89146] shrink-0 mt-2" aria-label="Unread" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
