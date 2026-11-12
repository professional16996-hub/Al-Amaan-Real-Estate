import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useSite } from '../context/SiteContext';

interface InquiryFormCardProps {
  heading?: string;
  subtext?: string;
  defaultSubject?: string;
  propertyId?: string;
  schemeId?: string;
  plotSizes?: string[];
}

export const InquiryFormCard: React.FC<InquiryFormCardProps> = ({
  heading = 'Request Official Verification & Pricing',
  subtext = 'Submit your inquiry directly to our Al Jalil Garden Main Boulevard advisory desk.',
  defaultSubject = 'Property & Plot Advisory Inquiry',
  propertyId,
  schemeId,
  plotSizes = ['3 Marla', '5 Marla', '10 Marla', '1 Kanal', 'Commercial Plot'],
}) => {
  const { customer } = useSite();
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [preferredPlotSize, setPreferredPlotSize] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setName((prev) => prev || customer.name);
      setEmail((prev) => prev || customer.email);
      setPhone((prev) => prev || customer.phone);
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await apiRequest<{ message: string }>('/api/public/inquiries', {
        method: 'POST',
        body: {
          name,
          email,
          phone,
          subject: defaultSubject,
          message,
          propertyId,
          schemeId,
          preferredPlotSize: preferredPlotSize || undefined,
        },
      });
      setSuccessMsg(res.message);
      setMessage('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit inquiry right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8">
      <h3 className="font-display text-2xl font-semibold text-[#0B192C]">{heading}</h3>
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{subtext}</p>

      {successMsg ? (
        <div className="mt-6 p-5 rounded bg-emerald-50/80 border border-emerald-200 text-emerald-900 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Inquiry Registered</span>
          </div>
          <p className="text-xs leading-relaxed text-emerald-800">{successMsg}</p>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="pt-1 text-xs font-semibold text-[#0B192C] underline"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Muhammad Tariq"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone / WhatsApp *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 0000000"
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
          </div>

          {plotSizes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Category / Plot Size
              </label>
              <select
                value={preferredPlotSize}
                onChange={(e) => setPreferredPlotSize(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded bg-white focus:outline-none focus:border-[#0B192C]"
              >
                <option value="">Select plot category (optional)</option>
                {plotSizes.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Inquiry Details *</label>
            <textarea
              rows={4}
              required
              minLength={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your preferred block, budget in PKR, or preferred time for a site visit..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-[#0B192C]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-5 text-xs font-semibold tracking-wide bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Submitting Inquiry...' : 'Submit Official Inquiry'}
          </button>
        </form>
      )}
    </div>
  );
};
