'use client';

import React, { useState } from 'react';
import { FacultyCommittee, User } from '@/types';
import { X, UserPlus, Users } from 'lucide-react';

interface AddCommitteeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  committee: FacultyCommittee | null;
  staffList: User[];
  onAddMember: (committeeId: number, member: {
    user_id: number;
    name: string;
    title: string;
    role: string;
    department: string;
  }) => Promise<void>;
}

export const AddCommitteeMemberModal: React.FC<AddCommitteeMemberModalProps> = ({
  isOpen,
  onClose,
  committee,
  staffList,
  onAddMember,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [roleInCommittee, setRoleInCommittee] = useState('Committee Member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !committee) return null;

  const currentMemberIds = new Set((committee.members || []).map(m => m.user_id));
  const availableStaff = staffList.filter(s => !currentMemberIds.has(s.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert('Please select a faculty member');
      return;
    }

    const staff = staffList.find(s => s.id === Number(selectedUserId));
    if (!staff) return;

    setIsSubmitting(true);
    try {
      await onAddMember(committee.id, {
        user_id: staff.id,
        name: staff.full_name,
        title: staff.title || 'Dr.',
        role: roleInCommittee,
        department: staff.department || 'Academic Staff',
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to add member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 9, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94%',
          maxWidth: '520px',
          padding: '26px',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-secondary, #ffffff)',
          border: '1.5px solid var(--border)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
          color: 'var(--text-main)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--accent-blue)" />
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Appoint Committee Member
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {committee.name}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.785rem' }}>Select Faculty / Staff Member *</label>
            <select
              className="form-input"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              required
            >
              <option value="">-- Choose faculty member --</option>
              {availableStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} {s.full_name} ({s.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.785rem' }}>Designation / Role in Committee *</label>
            <input
              type="text"
              className="form-input"
              value={roleInCommittee}
              onChange={(e) => setRoleInCommittee(e.target.value)}
              placeholder="e.g. Senior Quality Member, Module Coordinator, Examination Officer"
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !selectedUserId}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                padding: '8px 20px',
                fontWeight: 700,
              }}
            >
              {isSubmitting ? 'Appointing...' : 'Appoint to Committee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
