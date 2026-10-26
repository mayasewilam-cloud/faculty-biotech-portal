'use client';

import React, { useState } from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface BulkRescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  isBulkLoading: boolean;
  onSubmit: (deadline: string) => void;
  onQuickExtend: (days: number) => void;
}

export const BulkRescheduleModal: React.FC<BulkRescheduleModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  isBulkLoading,
  onSubmit,
  onQuickExtend,
}) => {
  const [customDeadline, setCustomDeadline] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDeadline) return;
    onSubmit(new Date(customDeadline).toISOString());
  };

  const quickPresets = [
    { label: '+1 Day', days: 1, desc: 'Tomorrow' },
    { label: '+3 Days', days: 3, desc: 'Short Extension' },
    { label: '+7 Days', days: 7, desc: '1 Week' },
    { label: '+14 Days', days: 14, desc: '2 Weeks' },
    { label: '+30 Days', days: 30, desc: '1 Month' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '100%', borderRadius: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <Calendar size={22} />
            </div>
            <div>
              <span className="badge badge-in_progress" style={{ marginBottom: '4px' }}>
                Batch Timeline Control ({selectedCount} Tasks Selected)
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Reschedule & Extend Deadlines
              </h3>
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

        {/* Quick Presets */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ fontWeight: 600, marginBottom: '10px', display: 'block' }}>
            Quick Extension Presets (From Today)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
            {quickPresets.map((preset) => (
              <button
                key={preset.days}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onQuickExtend(preset.days)}
                disabled={isBulkLoading}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 4px',
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#60a5fa' }}>{preset.label}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{preset.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Or Specify Exact Date
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
        </div>

        {/* Custom Exact Date Form */}
        <form onSubmit={handleCustomSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Specific Target Deadline *
            </label>
            <input
              type="date"
              className="form-input"
              value={customDeadline}
              onChange={(e) => setCustomDeadline(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isBulkLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isBulkLoading || !customDeadline}
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 700, gap: '6px' }}
            >
              <Clock size={16} />
              <span>{isBulkLoading ? 'Updating...' : `Set New Deadline for ${selectedCount} Tasks`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
