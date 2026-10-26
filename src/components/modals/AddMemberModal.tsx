'use client';

import React from 'react';
import { Hat } from '@/types';
import { Plus } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetHat: Hat | null;
  onSubmit: (e: React.FormEvent) => void;
  memberSearchQuery: string;
  setMemberSearchQuery: (val: string) => void;
  newMemberUserId: number | '';
  setNewMemberUserId: (val: number) => void;
  newMemberRoleInHat: string;
  setNewMemberRoleInHat: (val: string) => void;
  leadershipUsers: any[];
  profUsers: any[];
  drUsers: any[];
  laUsers: any[];
  taUsers: any[];
  raN112Users: any[];
  prototypingRaUsers: any[];
  adminCadreUsers: any[];
  isAddingMember: boolean;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  targetHat,
  onSubmit,
  memberSearchQuery,
  setMemberSearchQuery,
  newMemberUserId,
  setNewMemberUserId,
  newMemberRoleInHat,
  setNewMemberRoleInHat,
  leadershipUsers,
  profUsers,
  drUsers,
  laUsers,
  taUsers,
  raN112Users,
  prototypingRaUsers,
  adminCadreUsers,
  isAddingMember,
}) => {
  if (!isOpen || !targetHat) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>{targetHat.icon || '🎓'}</span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add Member to Hat</h3>
              <p style={{ fontSize: '0.8rem', color: '#c4b5fd' }}>
                {targetHat.name}
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
          {/* Search Staff */}
          <div className="form-group">
            <label className="form-label">Search & Select Faculty Member *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Filter by faculty name or title..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              style={{ height: '36px', fontSize: '0.825rem', marginBottom: '8px' }}
            />

            <select
              className="form-select"
              value={newMemberUserId}
              onChange={(e) => setNewMemberUserId(Number(e.target.value))}
              required
              size={5}
              style={{ height: '140px' }}
            >
              <optgroup label="👑 Faculty Leadership">
                {leadershipUsers
                  .filter(u => u.id !== 99 && !targetHat.members?.some(m => m.user_id === u.id))
                  .filter(u => !memberSearchQuery || u.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map((u) => (
                    <option key={u.id} value={u.id} style={{ padding: '6px 10px' }}>
                      👑 {u.full_name} — {u.title}
                    </option>
                  ))}
              </optgroup>
              <optgroup label={`🏛️ Professors & Assoc. Professors (${profUsers.length})`}>
                {profUsers
                  .filter(u => !targetHat.members?.some(m => m.user_id === u.id))
                  .filter(u => !memberSearchQuery || u.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map((u) => (
                    <option key={u.id} value={u.id} style={{ padding: '6px 10px' }}>
                      🏛️ {u.full_name} — {u.title}
                    </option>
                  ))}
              </optgroup>
              <optgroup label={`🩺 Lecturers (Dr.) (${drUsers.length})`}>
                {drUsers
                  .filter(u => !targetHat.members?.some(m => m.user_id === u.id))
                  .filter(u => !memberSearchQuery || u.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map((u) => (
                    <option key={u.id} value={u.id} style={{ padding: '6px 10px' }}>
                      🩺 {u.full_name} — {u.title}
                    </option>
                  ))}
              </optgroup>
              <optgroup label={`🧬 Lecturer Assistants (LA) (${laUsers.length})`}>
                {laUsers
                  .filter(u => !targetHat.members?.some(m => m.user_id === u.id))
                  .filter(u => !memberSearchQuery || u.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map((u) => (
                    <option key={u.id} value={u.id} style={{ padding: '6px 10px' }}>
                      🧬 {u.full_name} — {u.title}
                    </option>
                  ))}
              </optgroup>
              <optgroup label={`📚 Teaching Assistants (TA) (${taUsers.length})`}>
                {taUsers
                  .filter(u => !targetHat.members?.some(m => m.user_id === u.id))
                  .filter(u => !memberSearchQuery || u.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map((u) => (
                    <option key={u.id} value={u.id} style={{ padding: '6px 10px' }}>
                      📚 {u.full_name} — {u.title}
                    </option>
                  ))}
              </optgroup>
              <optgroup label={`🧪 RA N112 (${raN112Users.length})`}>
                {raN112Users
                  .filter(u => !targetHat.members?.some(m => m.user_id === u.id))
                  .filter(u => !memberSearchQuery || u.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map((u) => (
                    <option key={u.id} value={u.id} style={{ padding: '6px 10px' }}>
                      🔬 {u.full_name} (RA N112)
                    </option>
                  ))}
              </optgroup>
              <optgroup label={`🔬 Prototyping RA (${prototypingRaUsers.length})`}>
                {prototypingRaUsers
                  .filter(u => !targetHat.members?.some(m => m.user_id === u.id))
                  .filter(u => !memberSearchQuery || u.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map((u) => (
                    <option key={u.id} value={u.id} style={{ padding: '6px 10px' }}>
                      🧪 {u.full_name} (Prototyping RA)
                    </option>
                  ))}
              </optgroup>
              <optgroup label={`🏢 Academic Administration (${adminCadreUsers.length})`}>
                {adminCadreUsers
                  .filter(u => !targetHat.members?.some(m => m.user_id === u.id))
                  .filter(u => !memberSearchQuery || u.full_name.toLowerCase().includes(memberSearchQuery.toLowerCase()))
                  .map((u) => (
                    <option key={u.id} value={u.id} style={{ padding: '6px 10px' }}>
                      💼 {u.full_name} — {u.title}
                    </option>
                  ))}
              </optgroup>
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Showing staff not yet assigned to this committee.
            </div>
          </div>

          {/* Role in Hat */}
          <div className="form-group">
            <label className="form-label">Member Role / Designation in this Hat</label>
            <select
              className="form-select"
              value={newMemberRoleInHat}
              onChange={(e) => setNewMemberRoleInHat(e.target.value)}
            >
              <option value="Lead Coordinator">Lead Coordinator</option>
              <option value="Head / Chair">Head / Chair</option>
              <option value="Board Member">Board Member</option>
              <option value="Quality Officer">Quality Officer</option>
              <option value="Safety Officer">Safety Officer</option>
              <option value="Secretary">Secretary</option>
              <option value="Examiner">Examiner</option>
              <option value="Advisor">Advisor</option>
              <option value="Member">Member</option>
            </select>
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
              disabled={isAddingMember || !newMemberUserId}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                borderColor: '#7c3aed'
              }}
            >
              <Plus size={16} />
              <span>{isAddingMember ? 'Adding...' : 'Add to Hat'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
