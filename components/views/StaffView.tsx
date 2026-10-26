'use client';

import React from 'react';
import { Search, Plus, Upload, Edit2, Trash2, Mail, Phone, UserCheck, Shield } from 'lucide-react';

interface StaffViewProps {
  baseUsers: any[];
  profUsers: any[];
  drUsers: any[];
  laUsers: any[];
  taUsers: any[];
  raN112Users: any[];
  prototypingRaUsers: any[];
  adminCadreUsers: any[];
  leadershipUsers: any[];
  academicStaffUsers: any[];
  directoryCategory: string;
  setDirectoryCategory: (val: any) => void;
  directorySearch: string;
  setDirectorySearch: (val: string) => void;
  onAssignTaskToMember: (memberId: number) => void;
  onViewMemberTasks?: (memberName: string) => void;
  onOpenCreateMember?: () => void;
  onOpenImportMembers?: () => void;
  onEditMember?: (member: any) => void;
  onDeleteMember?: (memberId: number, memberName: string) => void;
  currentUser?: any;
}

export const StaffView: React.FC<StaffViewProps> = ({
  baseUsers,
  profUsers,
  drUsers,
  laUsers,
  taUsers,
  raN112Users,
  prototypingRaUsers,
  adminCadreUsers,
  leadershipUsers,
  academicStaffUsers,
  directoryCategory,
  setDirectoryCategory,
  directorySearch,
  setDirectorySearch,
  onAssignTaskToMember,
  onViewMemberTasks,
  onOpenCreateMember,
  onOpenImportMembers,
  onEditMember,
  onDeleteMember,
  currentUser,
}) => {
  const isDeanOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.id === 99 ||
    currentUser?.id === 6496 ||
    currentUser?.id === 6591 ||
    currentUser?.role === 'dean' ||
    currentUser?.role === 'vice_dean';

  return (
    <div>
      {/* Top Action Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Faculty Staff
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Comprehensive directory of professors, lecturers, teaching assistants, research cadres, and administrative staff ({baseUsers.length} total members).
          </p>
        </div>

        {isDeanOrAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {onOpenImportMembers && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onOpenImportMembers}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  color: '#10b981',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                }}
              >
                <Upload size={16} />
                <span>Import File / CSV</span>
              </button>
            )}

            {onOpenCreateMember && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onOpenCreateMember}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                }}
              >
                <Plus size={16} />
                <span>Add Faculty Member</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Directory Filter Bar & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`chip-filter ${directoryCategory === 'all' ? 'active' : ''}`}
            onClick={() => setDirectoryCategory('all')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🌐 All ({baseUsers.length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'professors' ? 'active-prof' : ''}`}
            onClick={() => setDirectoryCategory('professors')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🏛️ Professors ({profUsers.length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'doctors' ? 'active-dr' : ''}`}
            onClick={() => setDirectoryCategory('doctors')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🩺 Doctors ({drUsers.length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'la' ? 'active-la' : ''}`}
            onClick={() => setDirectoryCategory('la')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🧬 LA ({laUsers.length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'ta' ? 'active-ta' : ''}`}
            onClick={() => setDirectoryCategory('ta')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            📚 TA ({taUsers.length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'ra_n112' ? 'active-ra-n112' : ''}`}
            onClick={() => setDirectoryCategory('ra_n112')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🧪 RA N112 ({raN112Users.length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'prototyping_ra' ? 'active-proto-ra' : ''}`}
            onClick={() => setDirectoryCategory('prototyping_ra')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🔬 Prototyping RA ({prototypingRaUsers.length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'admin' ? 'active-admin' : ''}`}
            onClick={() => setDirectoryCategory('admin')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🏢 Administration ({adminCadreUsers.length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'leadership' ? 'active-leadership' : ''}`}
            onClick={() => setDirectoryCategory('leadership')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            👑 Leadership ({leadershipUsers.length})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search faculty by name, email, or cadre..."
            value={directorySearch}
            onChange={(e) => setDirectorySearch(e.target.value)}
            style={{ paddingLeft: '32px', height: '36px', fontSize: '0.825rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {(baseUsers || [])
          .filter((member) => {
            if (directoryCategory === 'professors') return profUsers.some((u) => u.id === member.id);
            if (directoryCategory === 'doctors') return drUsers.some((u) => u.id === member.id);
            if (directoryCategory === 'la') return laUsers.some((u) => u.id === member.id);
            if (directoryCategory === 'ta') return taUsers.some((u) => u.id === member.id);
            if (directoryCategory === 'ra_n112') return raN112Users.some((u) => u.id === member.id);
            if (directoryCategory === 'prototyping_ra') return prototypingRaUsers.some((u) => u.id === member.id);
            if (directoryCategory === 'admin') return adminCadreUsers.some((u) => u.id === member.id);
            if (directoryCategory === 'staff') return academicStaffUsers.some((u) => u.id === member.id);
            if (directoryCategory === 'leadership') return leadershipUsers.some((u) => u.id === member.id);
            return true;
          })
          .filter((member) => {
            if (!directorySearch.trim()) return true;
            const q = directorySearch.toLowerCase();
            return (
              member.full_name.toLowerCase().includes(q) ||
              member.email.toLowerCase().includes(q) ||
              (member.department || '').toLowerCase().includes(q) ||
              (member.title || '').toLowerCase().includes(q)
            );
          })
          .map((member) => {
            const isRaN112 = raN112Users.some((u) => u.id === member.id);
            const isProtoRa = prototypingRaUsers.some((u) => u.id === member.id);
            const isAdminCadre = adminCadreUsers.some((u) => u.id === member.id);
            const isLeadership = leadershipUsers.some((u) => u.id === member.id);
            const isProf = profUsers.some((u) => u.id === member.id);
            const isDr = drUsers.some((u) => u.id === member.id);
            const isLa = laUsers.some((u) => u.id === member.id);
            const isTa = taUsers.some((u) => u.id === member.id);

            const isProtectedLeader = member.id === 99 || member.id === 6496 || member.id === 6591;

            return (
              <div key={member.id} className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                  <img
                    src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.full_name)}`}
                    alt={member.full_name}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${
                        isRaN112
                          ? '#06b6d4'
                          : isProtoRa
                          ? '#ec4899'
                          : isAdminCadre
                          ? '#a855f7'
                          : isLeadership
                          ? '#f59e0b'
                          : isProf
                          ? '#3b82f6'
                          : isDr
                          ? '#0284c7'
                          : isLa
                          ? '#8b5cf6'
                          : isTa
                          ? '#10b981'
                          : 'rgba(59, 130, 246, 0.4)'
                      }`,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 800, textTransform: 'uppercase' }}>
                        {member.title || 'Staff'}
                      </span>
                      <span
                        className={`tag-cat ${
                          isRaN112
                            ? 'tag-cat-ra-n112'
                            : isProtoRa
                            ? 'tag-cat-proto-ra'
                            : isAdminCadre
                            ? 'tag-cat-admin'
                            : isLeadership
                            ? 'tag-cat-leadership'
                            : isProf
                            ? 'tag-cat-prof'
                            : isDr
                            ? 'tag-cat-dr'
                            : isLa
                            ? 'tag-cat-la'
                            : isTa
                            ? 'tag-cat-ta'
                            : 'tag-cat-prof'
                        }`}
                        style={{ fontSize: '0.8rem', fontWeight: 700 }}
                      >
                        {isRaN112
                          ? '🧪 RA N112'
                          : isProtoRa
                          ? '🔬 Prototyping'
                          : isAdminCadre
                          ? '🏢 Administration'
                          : isLeadership
                          ? '👑 Leadership'
                          : isProf
                          ? '🏛️ Professor'
                          : isDr
                          ? '🩺 Lecturer'
                          : isLa
                          ? '🧬 LA'
                          : isTa
                          ? '📚 TA'
                          : '🎓 Staff'}
                      </span>
                    </div>
                    <h4
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        marginTop: '4px',
                        marginBottom: '3px',
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={member.full_name}
                    >
                      {member.full_name}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                      {member.department}
                    </p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div
                  onClick={() => onViewMemberTasks && onViewMemberTasks(member.full_name)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '12px 10px',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    textAlign: 'center',
                    cursor: onViewMemberTasks ? 'pointer' : 'default',
                    transition: 'border-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (onViewMemberTasks) e.currentTarget.style.borderColor = 'var(--accent-blue)';
                  }}
                  onMouseLeave={(e) => {
                    if (onViewMemberTasks) e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  title={onViewMemberTasks ? `Click to view all tasks assigned to ${member.full_name}` : undefined}
                >
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{member.total_tasks || 0}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Assigned</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-done)' }}>{member.completed_tasks || 0}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--status-done)', fontWeight: 700, textTransform: 'uppercase' }}>Done</div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: member.overdue_tasks > 0 ? 'var(--status-overdue)' : 'var(--text-secondary)',
                      }}
                    >
                      {member.overdue_tasks || 0}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: member.overdue_tasks > 0 ? 'var(--status-overdue)' : 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Overdue</div>
                  </div>
                </div>

                {/* Contact Line */}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {member.email}
                    </span>
                  </div>
                  {member.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} style={{ flexShrink: 0, color: 'var(--text-muted)' }} />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    marginTop: 'auto',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  {isDeanOrAdmin ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {onEditMember && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onEditMember(member)}
                          title="Edit faculty member profile"
                          style={{ padding: '7px 12px', gap: '5px', fontSize: '0.825rem', fontWeight: 700 }}
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                      )}

                      {onDeleteMember && !isProtectedLeader && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onDeleteMember(member.id, member.full_name)}
                          title="Remove faculty member from directory"
                          style={{
                            padding: '7px 10px',
                            color: 'var(--status-overdue)',
                            borderColor: 'var(--status-overdue-border)',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div></div>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onAssignTaskToMember(member.id)}
                    style={{ gap: '5px', fontSize: '0.825rem', fontWeight: 700, padding: '7px 14px' }}
                  >
                    <Plus size={14} /> Assign Task
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
