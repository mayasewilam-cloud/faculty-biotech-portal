'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastMessage, ToastType, showToast } from '@/lib/toast';

const STYLES: Record<ToastType, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.45)',
    text: '#34d399',
    icon: <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />,
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.45)',
    text: '#f87171',
    icon: <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />,
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.16)',
    border: 'rgba(245, 158, 11, 0.45)',
    text: '#fbbf24',
    icon: <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0 }} />,
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.16)',
    border: 'rgba(59, 130, 246, 0.45)',
    text: '#60a5fa',
    icon: <Info size={18} color="#60a5fa" style={{ flexShrink: 0 }} />,
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastMessage>).detail;
      if (!detail?.message) return;
      setToasts((prev) => [...prev.slice(-4), detail]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== detail.id));
      }, 4500);
    };

    window.addEventListener('faculty-toast', handleToast);

    // Upgrade legacy window.alert calls across components to non-blocking toasts
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      showToast(String(msg ?? ''));
    };

    return () => {
      window.removeEventListener('faculty-toast', handleToast);
      window.alert = originalAlert;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '420px',
        width: 'calc(100vw - 32px)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const s = STYLES[t.type];
        return (
          <div
            key={t.id}
            role="status"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--card-bg, #0f172a)',
              backgroundImage: `linear-gradient(${s.bg}, ${s.bg})`,
              border: `1px solid ${s.border}`,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text-main, #f8fafc)',
              fontSize: '0.86rem',
              lineHeight: 1.4,
            }}
          >
            {s.icon}
            <span style={{ flex: 1, fontWeight: 500 }}>{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
