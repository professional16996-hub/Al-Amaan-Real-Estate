import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { DynamicSEO } from '../../components/DynamicSEO';

export const AdminLoginPage: React.FC = () => {
  const { admin, adminLoading, loginAdmin, data } = useSite();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!adminLoading && admin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await loginAdmin(email.trim().toLowerCase(), password);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Administrator authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111E] flex flex-col justify-center items-center px-5 py-12">
      <DynamicSEO customTitle={`Executive Admin Portal | ${data?.settings.siteName || 'Al Amaan Real Estate'}`} />

      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-[#D4AF37] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Website</span>
        </Link>

        <div className="bg-white border border-slate-200 rounded-md p-7 sm:p-9 shadow-2xl">
          <div className="flex items-center gap-2 text-[#9F7A31] text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Personnel Only</span>
          </div>

          <h1 className="mt-1.5 font-display text-3xl font-semibold text-[#0B192C]">
            Admin Console Sign In
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            {data?.settings.siteName || 'Al Amaan Real Estate & Developers'} — Enterprise Management System
          </p>

          {error && (
            <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Administrator Email
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter administrator email"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 px-4 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 transition-colors"
            >
              {busy ? 'Authenticating...' : 'Access Admin Dashboard'}
            </button>
          </form>

          <p className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center">
            Once signed in, you can change your email and password anytime inside Admin Profile &amp; Team.
          </p>
        </div>
      </div>
    </div>
  );
};
