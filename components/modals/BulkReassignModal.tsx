'use client';

import React, { useState } from 'react';
import { User, Hat } from '@/types';
import { Users, ShieldCheck, UserCheck, Check } from 'lucide-react';

interface BulkReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  users: User[];
  hats: Hat[];
  isBulkLoading: boolean;
  onSubmit: (assignedToId: number, hatId?: number | null) => void;
}

export const BulkReassignModal: React.FC<BulkReassignModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  users,
  hats,
  isBulkLoading,
  onSubmit,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedHatMode, setSelectedHatMode] = useState<'keep' | 'clear' | 'assign'>('keep');
  const [selectedHatId, setSelectedHatId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter out dean from assignees unless specifically needed
  const assignableUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(query) ||
      (u.department && u.department.toLowerCase().includes(query)) ||
      (u.title && u.title.toLowerCase().includes(query))
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    let hatIdParam: number | null | undefined = undefined;
    if (selectedHatMode === 'clear') {
      hatIdParam = null;
    } else if (selectedHatMode === 'assign' && selectedHatId) {
      hatIdParam = Number(selectedHatId);
    }

    onSubmit(Number(selectedUserId), hatIdParam);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', width: '100%', borderRadius: '16px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <span className="badge badge-in_progress" style={{ marginBottom: '4px' }}>
                Batch Reassignment ({selectedCount} Tasks Selected)
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Reassign to Faculty Member
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

        <form onSubmit={handleSubmit}>
          {/* Faculty Search */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Search Faculty / Staff Member *
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, title, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: '8px' }}
            />
            <select
              className="form-select"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
              required
              size={6}
              style={{ height: 'auto', minHeight: '140px' }}
            >
              <option value="" disabled>-- Select Faculty Member ({assignableUsers.length} available) --</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title ? `${u.title} ` : ''}{u.full_name} — {u.department || 'Biotechnology'}
                </option>
              ))}
            </select>
          </div>

          {/* Committee / Hat Options */}
          <div className="form-group" style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
              Committee / Hat Portfolio (Optional)
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="hatMode"
                  value="keep"
                  checked={selectedHatMode === 'keep'}
                  onChange={() => setSelectedHatMode('keep')}
                />
                <span>Keep existing Hat / Committee affiliations for each task</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="hatMode"
                  value="clear"
                  checked={selectedHatMode === 'clear'}
                  onChange={() => setSelectedHatMode('clear')}
                />
                <span>Remove Hat affiliation (Individual department assignment only)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="radio"
                  name="hatMode"
                  value="assign"
                  checked={selectedHatMode === 'assign'}
                  onChange={() => setSelectedHatMode('assign')}
                />
                <span>Assign to a specific Committee / Hat</span>
              </label>

              {selectedHatMode === 'assign' && (
                <select
                  className="form-select"
                  value={selectedHatId}
                  onChange={(e) => setSelectedHatId(e.target.value ? Number(e.target.value) : '')}
                  style={{ marginTop: '6px' }}
                  required={selectedHatMode === 'assign'}
                >
                  <option value="">-- Select Committee / Hat --</option>
                  {hats.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
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
              disabled={isBulkLoading || !selectedUserId}
              style={{ background: '#2563eb', gap: '6px' }}
            >
              <UserCheck size={16} />
              <span>{isBulkLoading ? 'Reassigning...' : `Reassign ${selectedCount} Tasks`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
