'use client';

import React from 'react';
import { AlertTriangle, Trash2, UserMinus, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isBusy = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const accentColor = isDanger ? '#ef4444' : '#f59e0b';
  const bgTint = isDanger ? 'rgba(239, 68, 68, 0.14)' : 'rgba(245, 158, 11, 0.14)';
  const borderTint = isDanger ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)';

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      style={{ zIndex: 10000 }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', width: '100%', padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: bgTint,
                border: `1px solid ${borderTint}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isDanger ? <Trash2 size={18} color={accentColor} /> : <UserMinus size={18} color={accentColor} />}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 6px' }}
            aria-label="Close confirmation"
          >
            <X size={15} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            disabled={isBusy}
            style={{
              backgroundColor: accentColor,
              borderColor: accentColor,
              color: '#ffffff',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} />
            <span>{isBusy ? 'Processing...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
