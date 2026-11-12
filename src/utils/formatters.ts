export function formatPKR(amount: number, currency = 'PKR'): string {
  if (!Number.isFinite(amount)) return `${currency} 0`;
  return `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatPKRCompact(amount: number, currency = 'PKR'): string {
  if (!Number.isFinite(amount) || amount <= 0) return `${currency} 0`;
  if (amount >= 10_000_000) {
    const crores = amount / 10_000_000;
    const formatted = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2).replace(/\.?0+$/, '');
    return `${currency} ${formatted} Crore`;
  }
  if (amount >= 100_000) {
    const lakhs = amount / 100_000;
    const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2).replace(/\.?0+$/, '');
    return `${currency} ${formatted} Lakh`;
  }
  return formatPKR(amount, currency);
}

export function normalizeWhatsAppDigits(rawPhone: string): string {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '923008459920';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  return digits;
}

export function buildWhatsAppUrl(whatsappNumber: string, message: string): string {
  const cleanNumber = normalizeWhatsAppDigits(whatsappNumber);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function formatDisplayDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDisplayDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
