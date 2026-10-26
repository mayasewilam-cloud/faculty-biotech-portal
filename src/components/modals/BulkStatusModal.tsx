'use client';

import React from 'react';
import { CheckCircle2, Clock, RotateCcw, CheckCheck } from 'lucide-react';

interface BulkStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  bulkStatus: 'done' | 'in_progress' | 'pending';
  setBulkStatus: (status: 'done' | 'in_progress' | 'pending') => void;
  bulkNotes: string;
  setBulkNotes: (notes: string) => void;
  isDean: boolean;
  isBulkLoading: boolean;
  onSubmit: (status: 'done' | 'in_progress' | 'pending', notes: string) => void;
}

export const BulkStatusModal: React.FC<BulkStatusModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  bulkStatus,
  setBulkStatus,
  bulkNotes,
  setBulkNotes,
  isDean,
  isBulkLoading,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-in_progress" style={{ marginBottom: '6px' }}>
              Bulk Action ({selectedCount} Tasks Selected)
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Update Status for Selected Tasks</h3>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(bulkStatus, bulkNotes);
        }}>
          <div className="form-group">
            <label className="form-label">New Status *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: bulkStatus === 'done' ? '2px solid #10b981' : '1px solid var(--border)',
                background: bulkStatus === 'done' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: bulkStatus === 'done' ? '#10b981' : 'var(--text-secondary)'
              }}>
                <input
                  type="radio"
                  name="bulkStatus"
                  value="done"
                  checked={bulkStatus === 'done'}
                  onChange={() => setBulkStatus('done')}
                  style={{ display: 'none' }}
                />
                <CheckCircle2 size={16} />
                <span>Done</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: bulkStatus === 'in_progress' ? '2px solid #3b82f6' : '1px solid var(--border)',
                background: bulkStatus === 'in_progress' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: bulkStatus === 'in_progress' ? '#60a5fa' : 'var(--text-secondary)'
              }}>
                <input
                  type="radio"
                  name="bulkStatus"
                  value="in_progress"
                  checked={bulkStatus === 'in_progress'}
                  onChange={() => setBulkStatus('in_progress')}
                  style={{ display: 'none' }}
                />
                <Clock size={16} />
                <span>In Progress</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: bulkStatus === 'pending' ? '2px solid #f59e0b' : '1px solid var(--border)',
                background: bulkStatus === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: bulkStatus === 'pending' ? '#fbbf24' : 'var(--text-secondary)'
              }}>
                <input
                  type="radio"
                  name="bulkStatus"
                  value="pending"
                  checked={bulkStatus === 'pending'}
                  onChange={() => setBulkStatus('pending')}
                  style={{ display: 'none' }}
                />
                <RotateCcw size={16} />
                <span>Pending</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Batch Completion Notes / Description {bulkStatus === 'done' && !isDean ? '*' : '(Optional)'}
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Explain steps completed, results achieved, or notes regarding these selected tasks. Will be attached to all selected tasks and recorded in the audit trail..."
              value={bulkNotes}
              onChange={(e) => setBulkNotes(e.target.value)}
              required={bulkStatus === 'done' && !isDean}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
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
              disabled={isBulkLoading}
            >
              <CheckCheck size={16} />
              <span>{isBulkLoading ? 'Updating...' : `Apply to ${selectedCount} Tasks`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
