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

  const filterBySearch = (users: any[]) => {
    if (!directorySearch.trim()) return users || [];
    const q = directorySearch.toLowerCase();
    return (users || []).filter(
      (m) =>
        (m.full_name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q) ||
        (m.title || '').toLowerCase().includes(q)
    );
  };

  const sections = [
    {
      id: 'leadership',
      title: '👑 Executive Leadership & Deanship',
      subtitle: 'Dean, Vice Deans, and Executive Academic Leadership',
      users: leadershipUsers || [],
      color: '#f59e0b',
      badgeClass: 'tag-cat-leadership',
    },
    {
      id: 'professors',
      title: '🏛️ Professors & Associate Professors',
      subtitle: 'Senior Academic Faculty Cadre & Department Chairs',
      users: profUsers || [],
      color: '#3b82f6',
      badgeClass: 'tag-cat-prof',
    },
    {
      id: 'doctors',
      title: '🩺 Doctors & Lecturers',
      subtitle: 'Academic Faculty Lecturers & Course Coordinators',
      users: drUsers || [],
      color: '#0284c7',
      badgeClass: 'tag-cat-dr',
    },
    {
      id: 'la',
      title: '🧬 Assistant Lecturers (L.A.)',
      subtitle: 'Assistant Lecturers & Senior Academic Staff',
      users: laUsers || [],
      color: '#8b5cf6',
      badgeClass: 'tag-cat-la',
    },
    {
      id: 'ta',
      title: '📚 Teaching Assistants (T.A.)',
      subtitle: 'Teaching Assistants & Academic Demonstrators',
      users: taUsers || [],
      color: '#10b981',
      badgeClass: 'tag-cat-ta',
    },
    {
      id: 'ra_n112',
      title: '🧪 Research Cadre — N112 Laboratory Specialists',
      subtitle: 'Specialized N112 Biotechnology Research Cadre',
      users: raN112Users || [],
      color: '#06b6d4',
      badgeClass: 'tag-cat-ra-n112',
    },
    {
      id: 'prototyping_ra',
      title: '🔬 Prototyping Research Assistants',
      subtitle: 'Prototyping & Innovation Laboratory Cadre',
      users: prototypingRaUsers || [],
      color: '#ec4899',
      badgeClass: 'tag-cat-proto-ra',
    },
    {
      id: 'admin',
      title: '🏢 Administrative & Operational Staff',
      subtitle: 'Administrative Cadre, Secretarial Support & Student Services',
      users: adminCadreUsers || [],
      color: '#a855f7',
      badgeClass: 'tag-cat-admin',
    },
  ];

  const renderMemberCard = (member: any) => {
    const isRaN112 = (raN112Users || []).some((u) => u.id === member.id);
    const isProtoRa = (prototypingRaUsers || []).some((u) => u.id === member.id);
    const isAdminCadre = (adminCadreUsers || []).some((u) => u.id === member.id);
    const isLeadership = (leadershipUsers || []).some((u) => u.id === member.id);
    const isProf = (profUsers || []).some((u) => u.id === member.id);
    const isDr = (drUsers || []).some((u) => u.id === member.id);
    const isLa = (laUsers || []).some((u) => u.id === member.id);
    const isTa = (taUsers || []).some((u) => u.id === member.id);
    const isProtectedLeader = member.id === 99 || member.id === 6496 || member.id === 6591;

    const borderColor = isRaN112
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
      : 'rgba(59, 130, 246, 0.4)';

    const tagText = isRaN112
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
      : '🎓 Staff';

    return (
      <div key={member.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
          <img
            src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.full_name)}`}
            alt={member.full_name}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `2px solid ${borderColor}`,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontWeight: 800, textTransform: 'uppercase' }}>
                {member.title || 'Staff'}
              </span>
              <span className="tag-cat" style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', border: `1px solid ${borderColor}50`, color: borderColor, background: `${borderColor}15` }}>
                {tagText}
              </span>
            </div>
            <h4
              style={{
                fontSize: '1.08rem',
                fontWeight: 800,
                marginTop: '4px',
                marginBottom: '2px',
                color: 'var(--text-main)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={member.full_name}
            >
              {member.full_name}
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
              {member.department || 'Faculty of Biotechnology'}
            </p>
          </div>
        </div>

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Mail size={13} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</span>
          </div>
          {member.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={13} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>{member.phone}</span>
            </div>
          )}
        </div>

        {/* View tasks shortcut & Action buttons */}
        <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          {onViewMemberTasks ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onViewMemberTasks(member.full_name)}
              style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700 }}
              title="Filter tasks assigned to this faculty member"
            >
              <span>📋 View Tasks</span>
            </button>
          ) : <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isDeanOrAdmin && onEditMember && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onEditMember(member)}
                style={{ padding: '5px 9px', fontSize: '0.78rem' }}
                title="Edit member"
              >
                <Edit2 size={13} />
              </button>
            )}

            {isDeanOrAdmin && onDeleteMember && !isProtectedLeader && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onDeleteMember(member.id, member.full_name)}
                style={{ padding: '5px 9px', fontSize: '0.78rem', color: '#ef4444' }}
                title="Remove member"
              >
                <Trash2 size={13} />
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onAssignTaskToMember(member.id)}
              style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={13} />
              <span>Assign</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

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
            Faculty Staff & Department Cadres
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
            Official directory organized into distinct academic ranks: Leadership, Professors, Lecturers, L.A., T.A., and Administration ({baseUsers.length} total members).
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
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`chip-filter ${directoryCategory === 'all' ? 'active' : ''}`}
            onClick={() => setDirectoryCategory('all')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🌐 All Ranks ({baseUsers.length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'leadership' ? 'active-leadership' : ''}`}
            onClick={() => setDirectoryCategory('leadership')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            👑 Leadership ({(leadershipUsers || []).length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'professors' ? 'active-prof' : ''}`}
            onClick={() => setDirectoryCategory('professors')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🏛️ Professors ({(profUsers || []).length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'doctors' ? 'active-dr' : ''}`}
            onClick={() => setDirectoryCategory('doctors')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🩺 Doctors / Lecturers ({(drUsers || []).length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'la' ? 'active-la' : ''}`}
            onClick={() => setDirectoryCategory('la')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🧬 LA ({(laUsers || []).length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'ta' ? 'active-ta' : ''}`}
            onClick={() => setDirectoryCategory('ta')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            📚 TA ({(taUsers || []).length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'ra_n112' ? 'active-ra-n112' : ''}`}
            onClick={() => setDirectoryCategory('ra_n112')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🧪 RA N112 ({(raN112Users || []).length})
          </button>
          <button
            className={`chip-filter ${directoryCategory === 'admin' ? 'active-admin' : ''}`}
            onClick={() => setDirectoryCategory('admin')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            🏢 Administration ({(adminCadreUsers || []).length})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search faculty by name, email, or title..."
            value={directorySearch}
            onChange={(e) => setDirectorySearch(e.target.value)}
            style={{ paddingLeft: '32px', height: '36px', fontSize: '0.825rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Render Distinct Separated Sections */}
      {sections
        .filter((sec) => directoryCategory === 'all' || directoryCategory === sec.id)
        .map((sec) => {
          const matchedUsers = filterBySearch(sec.users);
          if (matchedUsers.length === 0) return null;

          return (
            <div key={sec.id} style={{ marginBottom: '36px' }}>
              {/* Distinct Section Separator Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'var(--bg-inset, rgba(255, 255, 255, 0.03))',
                  borderLeft: `5px solid ${sec.color}`,
                  borderTop: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {sec.title}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {sec.subtitle}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    padding: '3px 12px',
                    borderRadius: '999px',
                    background: `${sec.color}20`,
                    color: sec.color,
                    border: `1px solid ${sec.color}40`,
                  }}
                >
                  {matchedUsers.length} Members
                </span>
              </div>

              {/* Cards Grid for this Department / Rank */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                {matchedUsers.map(renderMemberCard)}
              </div>
            </div>
          );
        })}
    </div>
  );
};
