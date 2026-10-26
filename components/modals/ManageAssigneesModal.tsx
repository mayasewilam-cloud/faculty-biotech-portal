'use client';

import React, { useState, useMemo } from 'react';
import { Task, User } from '@/types';
import { Search, X, Check, UserPlus, Users, Shield } from 'lucide-react';

interface ManageAssigneesModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  allStaff?: any[];
  allUsers?: any[];
  onSave?: (taskId: number, newAssignees: string[]) => Promise<void> | void;
  onSaveAssignees?: (taskId: number, newAssignees: string[]) => Promise<void> | void;
}

export const ManageAssigneesModal: React.FC<ManageAssigneesModalProps> = ({
  isOpen,
  task,
  onClose,
  allStaff,
  allUsers,
  onSave,
  onSaveAssignees,
}) => {
  const staffList = allUsers || allStaff || [];
  const [search, setSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize selected members when task changes
  React.useEffect(() => {
    if (task) {
      let initial: string[] = [];
      if (Array.isArray(task.assigned_members)) {
        initial = [...task.assigned_members];
      } else if (typeof task.assigned_members === 'string') {
        try {
          const parsed = JSON.parse(task.assigned_members);
          if (Array.isArray(parsed)) initial = parsed;
          else initial = (task.assigned_members as string).split(',').map((s) => s.trim());
        } catch {
          initial = (task.assigned_members as string).split(',').map((s) => s.trim());
        }
      }
      if (initial.length === 0 && task.assignee_name) {
        initial = [task.assignee_name];
      }
      setSelectedMembers(initial.filter(Boolean));
    }
  }, [task]);

  if (!isOpen || !task) return null;

  // Toggle member inclusion / exclusion
  const handleToggle = (memberName: string) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((m) => m.toLowerCase().trim() === memberName.toLowerCase().trim());
      if (exists) {
        return prev.filter((m) => m.toLowerCase().trim() !== memberName.toLowerCase().trim());
      } else {
        return [...prev, memberName];
      }
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saveFn = onSave || onSaveAssignees;
      if (saveFn && task) {
        await saveFn(task.id, selectedMembers);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (s.full_name || s.name || '').toLowerCase();
    const title = (s.title || '').toLowerCase();
    const dept = (s.department || '').toLowerCase();
    return name.includes(q) || title.includes(q) || dept.includes(q);
  });

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--card-bg, #111a31)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--accent-blue)" />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Assigned Team Members
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Include or exclude faculty staff for directive: <strong>{task.title}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Summary Bar */}
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--bg-inset)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Currently Included: <span style={{ color: 'var(--accent-blue)' }}>{selectedMembers.length} staff</span>
          </span>
          {selectedMembers.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedMembers([])}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Exclude All
            </button>
          )}
        </div>

        {/* Search Input */}
        <div style={{ padding: '16px 24px 10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '38px', width: '100%', fontSize: '0.85rem' }}
              placeholder="Search faculty members by name, rank, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Staff List with Toggles */}
        <div style={{ padding: '0 24px 16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredStaff.map((staff) => {
            const name = staff.full_name || staff.name;
            const title = staff.title || 'Faculty Staff';
            const isIncluded = selectedMembers.some((m) => m.toLowerCase().trim() === name.toLowerCase().trim());

            return (
              <div
                key={staff.id || name}
                onClick={() => handleToggle(name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: isIncluded ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                  background: isIncluded ? 'rgba(37, 99, 235, 0.08)' : 'var(--card-bg, #111a31)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isIncluded ? 'var(--accent-blue)' : 'rgba(255,255,255,0.08)',
                      color: isIncluded ? '#ffffff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                    }}
                  >
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isIncluded ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                      {name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {title} • {staff.department || 'Faculty of Biotechnology'}
                    </div>
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(name);
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    backgroundColor: isIncluded ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                    color: isIncluded ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isIncluded ? (
                    <>
                      <Check size={14} />
                      <span>Included</span>
                    </>
                  ) : (
                    <span>+ Include</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving Changes...' : `Save Assigned Team (${selectedMembers.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
