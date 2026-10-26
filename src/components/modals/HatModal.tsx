'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface HatModalProps {
  isOpen: boolean;
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  hatFormName: string;
  setHatFormName: (val: string) => void;
  hatFormDesc: string;
  setHatFormDesc: (val: string) => void;
  hatFormIcon: string;
  setHatFormIcon: (val: string) => void;
  hatFormColor: string;
  setHatFormColor: (val: string) => void;
  isSavingHat: boolean;
}

export const HatModal: React.FC<HatModalProps> = ({
  isOpen,
  isEdit,
  onClose,
  onSubmit,
  hatFormName,
  setHatFormName,
  hatFormDesc,
  setHatFormDesc,
  hatFormIcon,
  setHatFormIcon,
  hatFormColor,
  setHatFormColor,
  isSavingHat,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>{hatFormIcon}</span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {isEdit ? 'Edit Hat / Committee Group' : 'Create New Hat / Committee Group'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isEdit ? 'Update name, description, icon and theme color.' : 'Group faculty members together so you can assign bulk tasks with 1-click.'}
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Hat Group Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Accreditation & Quality Assurance Committee"
              value={hatFormName}
              onChange={(e) => setHatFormName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Committee Mandate / Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Describe the committee's purpose, deliverables, and tasks..."
              value={hatFormDesc}
              onChange={(e) => setHatFormDesc(e.target.value)}
            />
          </div>

          {/* Icon Selector & Color Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Committee Icon Emoji</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['🎓', '📝', '🧪', '👥', '📋', '🔬', '🛡️', '⚙️', '🌟', '📚', '🏛️', '💡'].map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setHatFormIcon(icon)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: hatFormIcon === icon ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: hatFormIcon === icon ? '2px solid #8b5cf6' : '1px solid var(--border)',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Accent Theme Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { name: 'Purple', val: '#8b5cf6' },
                  { name: 'Blue', val: '#3b82f6' },
                  { name: 'Emerald', val: '#10b981' },
                  { name: 'Amber', val: '#f59e0b' },
                  { name: 'Rose', val: '#f43f5e' },
                  { name: 'Cyan', val: '#06b6d4' },
                ].map(col => (
                  <button
                    key={col.val}
                    type="button"
                    onClick={() => setHatFormColor(col.val)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: col.val,
                      border: hatFormColor === col.val ? '3px solid #ffffff' : '2px solid transparent',
                      boxShadow: hatFormColor === col.val ? `0 0 12px ${col.val}88` : undefined,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={col.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSavingHat}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                borderColor: '#7c3aed'
              }}
            >
              <Check size={16} />
              <span>{isSavingHat ? 'Saving...' : isEdit ? 'Update Hat Group' : 'Create Hat Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
