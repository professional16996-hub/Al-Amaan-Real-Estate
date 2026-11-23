import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { apiRequest } from '../services/api';
import { DynamicSEO } from '../components/DynamicSEO';

export const CustomerLoginPage: React.FC = () => {
  const { loginCustomer, data } = useSite();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await loginCustomer(email, password);
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[75vh] bg-[#F8FAFC] py-16 px-5 flex items-center justify-center">
      <DynamicSEO customTitle={`Client Sign In | ${data?.settings.siteName || 'Al Amaan Real Estate'}`} />
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-md p-7 sm:p-9">
        <p className="text-xs font-semibold text-[#9F7A31]">Client Account Portal</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-[#0B192C]">Sign In to Your Account</h1>
        <p className="mt-1.5 text-xs text-slate-600">
          Access saved properties, submitted inquiry updates, and direct advisory support.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-medium text-[#9F7A31] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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
            {busy ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-600 text-center">
          New to {data?.settings.shortName || 'Al Amaan'}?{' '}
          <Link to="/register" className="font-semibold text-[#0B192C] hover:underline">
            Create a Client Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export const CustomerRegisterPage: React.FC = () => {
  const { registerCustomer, data } = useSite();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await registerCustomer({ name, phone, email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register account.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[75vh] bg-[#F8FAFC] py-16 px-5 flex items-center justify-center">
      <DynamicSEO customTitle={`Create Client Account | ${data?.settings.siteName || 'Al Amaan Real Estate'}`} />
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-md p-7 sm:p-9">
        <p className="text-xs font-semibold text-[#9F7A31]">Client Registration</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-[#0B192C]">Create Your Account</h1>
        <p className="mt-1.5 text-xs text-slate-600">
          Shortlist plots in Al Jalil Garden, track official inquiries, and connect with our Lahore advisors.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Usman Ahmad"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone / WhatsApp Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-3.5 pr-9 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 px-4 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 transition-colors"
          >
            {busy ? 'Creating Account...' : 'Create Client Account'}
          </button>
        </form>

        <p className="mt-6 pt-5 border-t border-slate-100 text-xs text-slate-600 text-center">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-[#0B192C] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export const CustomerForgotPasswordPage: React.FC = () => {
  const { data } = useSite();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [issuedCodeHint, setIssuedCodeHint] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await apiRequest<{ message: string; verificationCode?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      if (res.verificationCode) {
        setIssuedCodeHint(res.verificationCode);
        setCode(res.verificationCode);
      }
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to initiate password reset.');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: { email, code, newPassword },
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[75vh] bg-[#F8FAFC] py-16 px-5 flex items-center justify-center">
      <DynamicSEO customTitle={`Password Recovery | ${data?.settings.siteName || 'Al Amaan Real Estate'}`} />
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-md p-7 sm:p-9">
        <div className="flex items-center gap-2 text-[#9F7A31] text-xs font-semibold">
          <KeyRound className="w-4 h-4" />
          <span>Account Security</span>
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold text-[#0B192C]">Reset Your Password</h1>

        {error && (
          <div className="mt-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequestCode} className="mt-5 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered client email address to generate a 6-digit password reset verification code.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 px-4 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60"
            >
              {busy ? 'Generating Verification Code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
            {issuedCodeHint && (
              <div className="p-3.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <p className="font-semibold">Instant Verification Code Issued:</p>
                <p className="font-mono-num text-base font-bold tracking-widest text-[#0B192C]">
                  {issuedCodeHint}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">6-Digit Verification Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full px-3.5 py-2.5 text-sm font-mono-num border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 px-4 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60"
            >
              {busy ? 'Updating Password...' : 'Confirm New Password'}
            </button>
          </form>
        )}

        {step === 'done' && (
          <div className="mt-6 p-5 rounded bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Password Updated Successfully</span>
            </div>
            <p className="text-xs text-emerald-800">
              Your client account password has been updated. Sign in below with your new credentials.
            </p>
            <Link
              to="/login"
              className="inline-block px-5 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded"
            >
              Proceed to Client Sign In
            </Link>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link to="/login" className="text-xs font-medium text-slate-600 hover:text-[#0B192C]">
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
