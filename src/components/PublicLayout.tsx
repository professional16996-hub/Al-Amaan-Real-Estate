import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, MoreVertical, ShieldCheck, User, X } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { FloatingWhatsApp, WhatsAppLogo } from './WhatsAppIcon';
import { buildWhatsAppUrl } from '../utils/formatters';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, customer, admin, logoutCustomer } = useSite();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const headerNav = (data?.navigation || [])
    .filter((n) => n.placement === 'header' && n.visible)
    .sort((a, b) => a.order - b.order)
    .slice(0, 5);

  const footerExplore = (data?.navigation || [])
    .filter((n) => n.placement === 'footer_explore' && n.visible)
    .sort((a, b) => a.order - b.order);

  const footerLegal = (data?.navigation || [])
    .filter((n) => n.placement === 'footer_legal' && n.visible)
    .sort((a, b) => a.order - b.order);

  const siteName = data?.settings.siteName || 'Al Amaan Real Estate & Developers';
  const shortBrand = data?.settings.shortName
    ? `${data.settings.shortName} Real Estate`
    : 'Al Amaan Real Estate';

  const whatsappDirectUrl = data?.contact.whatsappNumber
    ? buildWhatsAppUrl(
        data.contact.whatsappNumber,
        data.settings.whatsappDefaultMessage ||
          `Assalam-o-Alaikum ${siteName}, I would like to connect with an advisor.`
      )
    : '#';

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-16 bg-[#0B192C] text-white border-b border-white/10">
        <div className="max-w-[1240px] mx-auto h-full px-5 sm:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="font-display text-xl sm:text-2xl font-semibold tracking-wide text-white hover:text-[#D4AF37] transition-colors duration-150 whitespace-nowrap shrink-0 flex items-center gap-2.5"
          >
            {data?.settings.logoUrl ? (
              <img
                src={data.settings.logoUrl}
                alt={siteName}
                referrerPolicy="no-referrer"
                className="h-8 w-auto object-contain"
              />
            ) : null}
            <span>{shortBrand}</span>
          </Link>

          {/* Zone 2: 4–5 Clean Single-Line Text Navigation Links */}
          <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-200">
            {headerNav.map((item) =>
              item.isExternal ? (
                <a
                  key={item.id}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1 border-b border-transparent hover:text-white hover:border-[#B89146] transition-colors duration-150 whitespace-nowrap shrink-0"
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `py-1 border-b transition-colors duration-150 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'text-[#D4AF37] border-[#B89146]'
                        : 'border-transparent text-slate-200 hover:text-white hover:border-white/40'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          {/* Zone 3: Primary CTA + Three-Dot Overflow Menu (with Admin Login) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {customer ? (
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide bg-[#B89146] text-[#0B192C] rounded hover:bg-[#cfa95e] transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                <User className="w-3.5 h-3.5" />
                <span>My Portfolio</span>
              </Link>
            ) : (
              <Link
                to="/contact"
                className="hidden sm:inline-flex items-center px-4 py-2 text-xs font-semibold tracking-wide bg-[#B89146] text-[#0B192C] rounded hover:bg-[#cfa95e] transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                Schedule Consultation
              </Link>
            )}

            {/* Three-Dot Menu containing Customer Portal & Admin Login */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((prev) => !prev)}
                aria-label="More options and portal login"
                aria-expanded={moreOpen}
                className="w-10 h-10 inline-flex items-center justify-center rounded text-slate-200 hover:text-white hover:bg-white/10 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {moreOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-md bg-white text-slate-800 shadow-xl border border-slate-200 py-1.5 z-50">
                  {customer ? (
                    <>
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900 truncate">{customer.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{customer.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B192C]"
                      >
                        Client Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          await logoutCustomer();
                          setMoreOpen(false);
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-red-700"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B192C]"
                      >
                        Client Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B192C]"
                      >
                        Create Client Account
                      </Link>
                    </>
                  )}

                  <div className="my-1 border-t border-slate-100" />
                  <Link
                    to="/about"
                    className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B192C]"
                  >
                    About Al Amaan
                  </Link>
                  <Link
                    to="/contact"
                    className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0B192C]"
                  >
                    Contact Head Office
                  </Link>

                  <div className="my-1 border-t border-slate-100" />
                  <Link
                    to={admin ? '/admin' : '/admin/login'}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0B192C] hover:bg-amber-50/70"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#9F7A31]" />
                    <span>{admin ? 'Open Admin Dashboard' : 'Admin Login'}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#0B192C] border-b border-white/15 px-5 pt-3 pb-6 space-y-4 shadow-2xl">
            <nav className="flex flex-col space-y-2.5">
              {headerNav.map((item) =>
                item.isExternal ? (
                  <a
                    key={item.id}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-slate-200 py-1.5"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-sm font-medium text-slate-200 hover:text-[#D4AF37] py-1.5"
                  >
                    {item.label}
                  </Link>
                )
              )}
              <Link to="/about" className="text-sm font-medium text-slate-200 hover:text-[#D4AF37] py-1.5">
                About Us
              </Link>
              <Link to="/contact" className="text-sm font-medium text-slate-200 hover:text-[#D4AF37] py-1.5">
                Contact Us
              </Link>
            </nav>

            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
              {customer ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2.5 text-xs font-semibold bg-[#B89146] text-[#0B192C] rounded"
                >
                  Client Dashboard ({customer.name.split(' ')[0]})
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2.5 text-xs font-semibold bg-[#B89146] text-[#0B192C] rounded"
                  >
                    Client Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2.5 text-xs font-medium border border-white/25 text-white rounded"
                  >
                    Create Account
                  </Link>
                </>
              )}
              <Link
                to={admin ? '/admin' : '/admin/login'}
                className="px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-[#D4AF37]"
              >
                {admin ? 'Admin Panel' : 'Admin Login'}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Quiet Luxury Footer */}
      <footer className="bg-[#07111E] text-slate-300 border-t border-white/10">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
            <div className="lg:col-span-5 space-y-4">
              <Link to="/" className="inline-block font-display text-2xl font-semibold text-white tracking-wide">
                {siteName}
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                {data?.settings.tagline ||
                  'Authorized Real Estate Advisory & Turnkey Property Developers in Lahore, Pakistan.'}
              </p>
              <div className="pt-2 space-y-1.5 text-xs text-slate-400">
                <p className="text-slate-200 font-medium">{data?.contact.officeAddress}</p>
                <p>{data?.contact.officeHours}</p>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <h3 className="font-sans text-xs font-semibold tracking-wider text-[#D4AF37]">
                Explore Portfolio
              </h3>
              <ul className="space-y-2 text-sm">
                {footerExplore.map((item) => (
                  <li key={item.id}>
                    {item.isExternal ? (
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.path} className="text-slate-400 hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <h3 className="font-sans text-xs font-semibold tracking-wider text-[#D4AF37]">
                Advisory Desk &amp; Direct Lines
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <a
                    href={`tel:${data?.contact.primaryPhone || ''}`}
                    className="font-mono-num text-white hover:text-[#D4AF37] transition-colors"
                  >
                    {data?.contact.primaryPhone}
                  </a>
                  {data?.contact.secondaryPhone ? (
                    <span className="text-slate-500">
                      {' '}
                      ·{' '}
                      <a
                        href={`tel:${data.contact.secondaryPhone}`}
                        className="font-mono-num text-slate-300 hover:text-white"
                      >
                        {data.contact.secondaryPhone}
                      </a>
                    </span>
                  ) : null}
                </p>
                <p>
                  <a
                    href={`mailto:${data?.contact.email || ''}`}
                    className="text-slate-300 hover:text-white transition-colors"
                  >
                    {data?.contact.email}
                  </a>
                </p>
                <div className="pt-1">
                  <a
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#25D366] hover:underline"
                  >
                    <WhatsAppLogo className="w-4 h-4" />
                    <span>Connect on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Dynamic Social Media Links */}
              {data?.social && (
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  {data.social.facebook && (
                    <a
                      href={data.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#D4AF37] transition-colors"
                    >
                      Facebook
                    </a>
                  )}
                  {data.social.instagram && (
                    <a
                      href={data.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#D4AF37] transition-colors"
                    >
                      Instagram
                    </a>
                  )}
                  {data.social.tiktok && (
                    <a
                      href={data.social.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#D4AF37] transition-colors"
                    >
                      TikTok
                    </a>
                  )}
                  {data.social.youtube && (
                    <a
                      href={data.social.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#D4AF37] transition-colors"
                    >
                      YouTube
                    </a>
                  )}
                  {data.social.linkedin && (
                    <a
                      href={data.social.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#D4AF37] transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} {siteName}. All rights reserved. Lahore, Pakistan.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              {footerLegal.map((item) => (
                <Link key={item.id} to={item.path} className="hover:text-slate-300 transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <FloatingWhatsApp />
    </div>
  );
};
