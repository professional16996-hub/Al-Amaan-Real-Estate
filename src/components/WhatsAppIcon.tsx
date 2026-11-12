import React from 'react';
import { useSite } from '../context/SiteContext';
import { buildWhatsAppUrl } from '../utils/formatters';

export const WhatsAppLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M12.031 2c-5.508 0-9.987 4.479-9.987 9.988 0 1.763.459 3.483 1.332 4.999L2 22l5.142-1.349a9.946 9.946 0 0 0 4.887 1.282h.004c5.507 0 9.986-4.479 9.988-9.988a9.927 9.927 0 0 0-2.923-7.065A9.926 9.926 0 0 0 12.031 2zm5.821 14.298c-.246.693-1.434 1.326-1.988 1.409-.508.076-1.15.108-1.856-.116-.429-.136-.979-.318-1.685-.623-2.966-1.281-4.903-4.269-5.051-4.467-.148-.197-1.206-1.605-1.206-3.062 0-1.456.763-2.172 1.035-2.469.271-.296.592-.37.79-.37.197 0 .395.002.568.01.182.009.426-.069.666.509.247.593.839 2.049.913 2.197.074.148.123.321.025.518-.099.198-.148.321-.296.494-.148.173-.312.386-.445.518-.148.148-.303.309-.13.605.173.296.768 1.267 1.649 2.053 1.133 1.01 2.088 1.323 2.384 1.471.296.148.469.123.642-.074.173-.198.741-.864.938-1.16.198-.296.395-.247.667-.148.271.099 1.728.815 2.024.963.296.148.494.222.568.346.074.123.074.716-.172 1.409z" />
  </svg>
);

export const FloatingWhatsApp: React.FC = () => {
  const { data } = useSite();
  if (!data || !data.settings.whatsappFloatingEnabled || !data.contact.whatsappNumber) {
    return null;
  }

  const href = buildWhatsAppUrl(
    data.contact.whatsappNumber,
    data.settings.whatsappDefaultMessage ||
      `Assalam-o-Alaikum ${data.settings.siteName}, I would like to inquire about available properties in Lahore.`
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        right: 'auto',
        zIndex: 9999,
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#25D366',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      }}
      className="text-white transition-transform duration-150 hover:scale-110 active:scale-95"
    >
      <WhatsAppLogo className="w-8 h-8" />
    </a>
  );
};
