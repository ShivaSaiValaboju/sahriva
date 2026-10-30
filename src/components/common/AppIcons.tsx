import React from 'react';

export const PlatformIcons: Record<string, React.FC<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>> = {
  macos: ({ className = 'w-4 h-4', ...props }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.64-.81 1.08-1.94.96-3.07-1 .04-2.18.67-2.88 1.48-.56.64-1.06 1.79-.92 2.91 1.12.09 2.22-.55 2.84-1.32" />
    </svg>
  ),
  windows: ({ className = 'w-4 h-4', ...props }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M3 5.44l7.15-1 .01 6.84-7.16.03V5.44zm0 7.82l7.16.03v6.84L3 19.14v-5.88zm8.13-9.01L21 2.8v8.43l-9.87.05V4.25zm9.87 8.04L21 21.2l-9.87-1.42v-7.49l9.87.03z" />
    </svg>
  ),
  linux: ({ className = 'w-4 h-4', ...props }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2a4 4 0 0 0-4 4c0 .8.24 1.55.66 2.18C6.63 9.4 5 11.5 5 14c0 3.87 3.13 7 7 7s7-3.13 7-7c0-2.5-1.63-4.6-3.66-5.82A3.98 3.98 0 0 0 16 6a4 4 0 0 0-4-4zm-2 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm-2 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
    </svg>
  ),
  android: ({ className = 'w-4 h-4', ...props }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.523 15.341a.927.927 0 1 0 0-1.854.927.927 0 0 0 0 1.854zm-11.046 0a.927.927 0 1 0 0-1.854.927.927 0 0 0 0 1.854zm12.355-6.223l1.83-3.17a.44.44 0 0 0-.161-.602.44.44 0 0 0-.602.161l-1.865 3.23a10.875 10.875 0 0 0-6.034-1.787c-2.22 0-4.28.647-6.034 1.787L4.096 5.507a.44.44 0 0 0-.602-.161.44.44 0 0 0-.161.602l1.83 3.17C2.186 10.74 0 13.9 0 17.5h24c0-3.6-2.186-6.76-5.168-8.382z" />
    </svg>
  ),
};

export const SoftwareIcons: Record<string, React.FC<{ className?: string; accentColor?: string }>> = {
  Layers: ({ className = 'w-10 h-10', accentColor = '#8B5CF6' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    </div>
  ),
  Terminal: ({ className = 'w-10 h-10', accentColor = '#38BDF8' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    </div>
  ),
  PenTool: ({ className = 'w-10 h-10', accentColor = '#EC4899' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    </div>
  ),
  Database: ({ className = 'w-10 h-10', accentColor = '#10B981' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    </div>
  ),
  ShieldCheck: ({ className = 'w-10 h-10', accentColor = '#6366F1' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    </div>
  ),
  Sparkles: ({ className = 'w-10 h-10', accentColor = '#F59E0B' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.912 5.886a2 2 0 0 0 1.272 1.272L21 12l-5.816 1.842a2 2 0 0 0-1.272 1.272L12 21l-1.912-5.886a2 2 0 0 0-1.272-1.272L3 12l5.816-1.842a2 2 0 0 0 1.272-1.272L12 3z" />
      </svg>
    </div>
  ),
  Film: ({ className = 'w-10 h-10', accentColor = '#06B6D4' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    </div>
  ),
  Scissors: ({ className = 'w-10 h-10', accentColor = '#F43F5E' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    </div>
  ),
  Video: ({ className = 'w-10 h-10', accentColor = '#8B5CF6' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    </div>
  ),
  Clapperboard: ({ className = 'w-10 h-10', accentColor = '#EC4899' }) => (
    <div
      className={`rounded-2xl flex items-center justify-center shadow-lg border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accentColor}33 0%, ${accentColor}11 100%), #141824`,
      }}
    >
      <svg className="w-3/5 h-3/5" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4z" />
        <path d="m4 11 16-6" />
        <path d="m8.5 7.5 1.5 3.5" />
        <path d="m14 5.5 1.5 3.5" />
        <path d="M4 11h16" />
      </svg>
    </div>
  ),
};

export const AppIcon: React.FC<{
  name: string;
  accentColor?: string;
  className?: string;
}> = ({ name, accentColor, className }) => {
  const IconComponent = SoftwareIcons[name] || SoftwareIcons.Layers;
  return <IconComponent className={className} accentColor={accentColor} />;
};
