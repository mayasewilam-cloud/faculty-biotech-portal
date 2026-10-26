'use client';

import React from 'react';

interface BulkPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  bulkPriority: 'low' | 'medium' | 'high' | 'urgent';
  setBulkPriority: (priority: 'low' | 'medium' | 'high' | 'urgent') => void;
  isBulkLoading: boolean;
  onSubmit: (priority: 'low' | 'medium' | 'high' | 'urgent') => void;
}

export const BulkPriorityModal: React.FC<BulkPriorityModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  bulkPriority,
  setBulkPriority,
  isBulkLoading,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-in_progress" style={{ marginBottom: '6px' }}>
              Bulk Action ({selectedCount} Tasks Selected)
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Change Priority Level</h3>
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
          onSubmit(bulkPriority);
        }}>
          <div className="form-group">
            <label className="form-label">Select Priority for {selectedCount} Tasks *</label>
            <select
              className="form-select"
              value={bulkPriority}
              onChange={(e: any) => setBulkPriority(e.target.value)}
            >
              <option value="urgent">🚨 Urgent (Immediate Attention)</option>
              <option value="high">🟠 High Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="low">🟢 Low Priority</option>
            </select>
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
              <span>{isBulkLoading ? 'Updating...' : `Set Priority on ${selectedCount} Tasks`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
