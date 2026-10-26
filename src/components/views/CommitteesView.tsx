'use client';

import React, { useState } from 'react';
import { FacultyCommittee, User, Task } from '@/types';
import {
  Building2,
  Plus,
  Search,
  Shield,
  Edit2,
  Trash2,
  UserPlus,
  Check,
  FileText,
  Calendar,
  X,
  Users,
} from 'lucide-react';

interface CommitteesViewProps {
  committees: FacultyCommittee[];
  currentUser: User | null;
  tasks?: Task[];
  onOpenCreateCommittee: () => void;
  onOpenEditCommittee: (committee: FacultyCommittee) => void;
  onDeleteCommittee: (committeeId: number, committeeName: string) => void;
  onOpenAddMember: (committee: FacultyCommittee) => void;
  onRemoveMember: (committeeId: number, userId: number, userName: string, committeeName: string) => void;
  onViewCommitteeMeetings: (committeeName: string) => void;
  onScheduleCommitteeMeeting: (committee: FacultyCommittee) => void;
  onScheduleMeetingWithDean?: (committee: FacultyCommittee) => void;
  onScheduleInformationSession?: (committee: FacultyCommittee) => void;
  onRecordCommitteeMoM?: (committee: FacultyCommittee) => void;
  onOpenCreateCommitteeTask?: (committee: FacultyCommittee) => void;
  onViewCommitteeTasks?: (committeeId: number) => void;
}

export const CommitteesView: React.FC<CommitteesViewProps> = ({
  committees,
  currentUser,
  tasks = [],
  onOpenCreateCommittee,
  onOpenEditCommittee,
  onDeleteCommittee,
  onOpenAddMember,
  onRemoveMember,
  onViewCommitteeMeetings,
  onScheduleCommitteeMeeting,
  onScheduleMeetingWithDean,
  onScheduleInformationSession,
  onRecordCommitteeMoM,
  onOpenCreateCommitteeTask,
  onViewCommitteeTasks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'standing' | 'statutory' | 'council'>('all');
  const [committeeToDelete, setCommitteeToDelete] = useState<{ id: number; name: string } | null>(null);

  const isDeanOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.id === 99 ||
    currentUser?.id === 6496 ||
    currentUser?.id === 6591 ||
    currentUser?.role === 'dean' ||
    currentUser?.role === 'vice_dean';

  const standingCount = committees.filter(c => c.category === 'standing').length;
  const statutoryCount = committees.filter(c => c.category === 'statutory').length;
  const councilCount = committees.filter(c => c.category === 'council').length;

  const filteredCommittees = committees.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.name_ar && c.name_ar.toLowerCase().includes(q)) ||
      c.code.toLowerCase().includes(q) ||
      c.chair_name.toLowerCase().includes(q) ||
      (c.decree_ref && c.decree_ref.toLowerCase().includes(q)) ||
      c.members?.some(m => m.name.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      {/* Intro Header Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-10px', top: '-20px', fontSize: '110px', opacity: 0.04, pointerEvents: 'none', userSelect: 'none' }}>
          🏛️
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.4rem' }}>🏛️</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                Official Faculty Standing Committees (لجان الكلية الرسمية)
              </h3>
              <span style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--status-progress)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                fontSize: '0.85rem',
                fontWeight: 800,
                padding: '3px 12px',
                borderRadius: '999px',
              }}>
                {committees.length} Statutory Bodies
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Institutional governance bodies established under University and Faculty Council bylaws. Chaired by the Dean or executive leadership, these committees govern quality assurance, examination moderation, biosafety protocols, academic advising, and curriculum benchmarking.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (committees.length > 0 && onScheduleMeetingWithDean) {
                  onScheduleMeetingWithDean(committees[0]);
                } else if (committees.length > 0) {
                  onScheduleCommitteeMeeting(committees[0]);
                }
              }}
              style={{
                padding: '9px 16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                color: 'var(--accent-blue)',
                borderColor: 'rgba(59, 130, 246, 0.4)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                fontSize: '0.85rem'
              }}
              title="Schedule an executive meeting with Dean Prof. Dr. Gehan Safwat"
            >
              <Calendar size={16} />
              <span>{isDeanOrAdmin ? "Meet with Committee" : "Meet with Prof. Gehan"}</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                if (committees.length > 0 && onScheduleInformationSession) {
                  onScheduleInformationSession(committees[0]);
                } else if (committees.length > 0) {
                  onScheduleCommitteeMeeting(committees[0]);
                }
              }}
              style={{
                padding: '9px 16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                color: '#10b981',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                fontSize: '0.85rem'
              }}
              title="Schedule an information or briefing session for faculty and students"
            >
              <span>📢 Info Session to People</span>
            </button>

            {isDeanOrAdmin && (
              <button
                className="btn btn-primary"
                onClick={onOpenCreateCommittee}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderColor: '#2563eb',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
                  padding: '9px 16px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem'
                }}
              >
                <Plus size={16} />
                <span>Create Official Committee</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Category Filters */}
        <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '420px', minWidth: '260px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '38px', fontSize: '0.85rem' }}
              placeholder="Search committees, decrees, or faculty members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '9px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              type="button"
              className={`btn btn-sm ${categoryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter('all')}
              style={{ fontSize: '0.785rem', padding: '6px 14px' }}
            >
              All Committees ({committees.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${categoryFilter === 'standing' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter('standing')}
              style={{ fontSize: '0.785rem', padding: '6px 14px' }}
            >
              🏛️ Standing ({standingCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${categoryFilter === 'statutory' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter('statutory')}
              style={{ fontSize: '0.785rem', padding: '6px 14px' }}
            >
              📜 Statutory Boards ({statutoryCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${categoryFilter === 'council' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCategoryFilter('council')}
              style={{ fontSize: '0.785rem', padding: '6px 14px' }}
            >
              🎓 Councils ({councilCount})
            </button>
          </div>
        </div>
      </div>

      {/* Committees Grid */}
      {filteredCommittees.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🏛️</span>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
            No Committees Found
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px' }}>
            {searchQuery
              ? `No official committees match "${searchQuery}". Try clearing search filters.`
              : 'No committees configured in this category.'}
          </p>
          {isDeanOrAdmin && (
            <button className="btn btn-primary" onClick={onOpenCreateCommittee}>
              + Create Committee
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '22px' }}>
          {filteredCommittees.map((comm) => (
            <div
              key={comm.id}
              className="glass-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                borderTop: `4px solid ${comm.color || '#3b82f6'}`,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-card)',
                position: 'relative',
              }}
            >
              <div>
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: comm.color || '#3b82f6',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.825rem',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}>
                      {comm.code}
                    </span>
                    <span style={{
                      background: 'var(--bg-inset)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                    }}>
                      {(comm.category || 'standing').toUpperCase()}
                    </span>
                  </div>

                  {/* Actions for Dean: Edit & Delete */}
                  {isDeanOrAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => onOpenEditCommittee(comm)}
                        title="Edit Committee"
                        style={{
                          background: 'var(--bg-inset)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommitteeToDelete({ id: comm.id, name: comm.name })}
                        title="Delete Committee"
                        style={{
                          background: 'var(--status-overdue-bg)',
                          border: '1px solid var(--status-overdue-border)',
                          color: 'var(--status-overdue)',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title & Arabic Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.9rem', lineHeight: 1 }}>{comm.icon || '🏛️'}</span>
                  <div>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                      {comm.name}
                    </h4>
                    {comm.name_ar && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '3px', direction: 'rtl', textAlign: 'left' }}>
                        {comm.name_ar}
                      </div>
                    )}
                  </div>
                </div>

                {/* Legal Decree Reference */}
                {comm.decree_ref && (
                  <div style={{
                    padding: '8px 14px',
                    background: 'var(--bg-inset)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${comm.color || '#3b82f6'}`,
                    border: '1px solid var(--border)',
                    borderLeftWidth: '4px',
                    marginBottom: '16px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>Decree: </span>
                    {comm.decree_ref}
                  </div>
                )}

                {/* Leadership: Chair & Rapporteur */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px 12px', background: 'var(--status-progress-bg)', borderRadius: '8px', border: '1px solid var(--status-progress-border)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--status-progress)', fontWeight: 800 }}>Committee Chair</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{comm.chair_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>{comm.chair_title}</div>
                  </div>

                  <div style={{ padding: '10px 12px', background: 'var(--status-revision-bg)', borderRadius: '8px', border: '1px solid var(--status-revision-border)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--status-revision)', fontWeight: 800 }}>Rapporteur</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{comm.rapporteur_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 500 }}>{comm.rapporteur_title}</div>
                  </div>
                </div>

                {/* Mandates */}
                {comm.mandates && comm.mandates.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '8px' }}>
                      Statutory Mandates
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {comm.mandates.slice(0, 3).map((mandate, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          <Check size={16} color={comm.color || '#3b82f6'} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{mandate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Appointed Faculty Members */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 800 }}>
                      Official Appointed Members ({comm.members?.length || 0})
                    </span>

                    {isDeanOrAdmin && (
                      <button
                        type="button"
                        onClick={() => onOpenAddMember(comm)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-blue)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 800,
                        }}
                      >
                        <UserPlus size={14} />
                        <span>Appoint Member</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(comm.members || []).map((m) => (
                      <span
                        key={m.user_id}
                        style={{
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'var(--bg-inset)',
                          color: 'var(--text-main)',
                          border: '1px solid var(--border)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                        title={`${m.title} ${m.name} (${m.role})`}
                      >
                        <span>{m.name.split(' ').slice(0, 3).join(' ')}</span>
                        {isDeanOrAdmin && (
                          <button
                            type="button"
                            onClick={() => onRemoveMember(comm.id, m.user_id, m.name, comm.name)}
                            title="Remove Member"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--status-overdue)',
                              cursor: 'pointer',
                              padding: '0',
                              lineHeight: 1,
                              fontWeight: 800,
                              fontSize: '0.9rem',
                            }}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statutory Deliverables & Tasks Block */}
              {(() => {
                const commTasks = (tasks || []).filter(t => t.committee_id === comm.id);
                const pendingTasks = commTasks.filter(t => t.status !== 'done');
                return (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px 14px',
                    background: 'var(--bg-inset)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={14} color="var(--accent-blue)" />
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 800 }}>
                          Statutory Deliverables ({commTasks.length})
                        </span>
                      </div>
                      {pendingTasks.length > 0 ? (
                        <span style={{ fontSize: '0.72rem', background: 'var(--status-pending-bg)', color: 'var(--status-pending)', border: '1px solid var(--status-pending-border)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                          {pendingTasks.length} Pending
                        </span>
                      ) : commTasks.length > 0 ? (
                        <span style={{ fontSize: '0.72rem', background: 'var(--status-done-bg)', color: 'var(--status-done)', border: '1px solid var(--status-done-border)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                          All Completed
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No tasks assigned</span>
                      )}
                    </div>

                    {commTasks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {commTasks.slice(0, 3).map(task => (
                          <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', gap: '8px' }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                              • {task.title}
                            </span>
                            <span style={{ color: task.status === 'done' ? 'var(--status-done)' : 'var(--text-secondary)', fontSize: '0.75rem', flexShrink: 0 }}>
                              {task.status === 'done' ? '✓ Completed' : new Date(task.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        {commTasks.length > 3 && onViewCommitteeTasks && (
                          <button
                            type="button"
                            onClick={() => onViewCommitteeTasks(comm.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.75rem', textAlign: 'left', padding: '2px 0', fontWeight: 700 }}
                          >
                            + View all {commTasks.length} deliverables →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        No statutory deliverables currently queued for this committee.
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Actions Footer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {onOpenCreateCommitteeTask && isDeanOrAdmin && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onOpenCreateCommitteeTask(comm)}
                    style={{ fontSize: '0.875rem', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                    title="Dispatch statutory task to this committee"
                  >
                    <Plus size={15} />
                    <span>Assign Task</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onViewCommitteeMeetings(comm.name.split(' ')[0])}
                  style={{ flex: 1, fontSize: '0.875rem', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700 }}
                >
                  <FileText size={16} />
                  <span>View Sessions & MoM</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onRecordCommitteeMoM ? onRecordCommitteeMoM(comm) : onScheduleCommitteeMeeting(comm)}
                  style={{ fontSize: '0.875rem', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderColor: 'rgba(37, 99, 235, 0.3)', color: 'var(--accent-blue)' }}
                  title="Record & publish official Minutes of Meeting (MoM) for this committee"
                >
                  <FileText size={15} />
                  <span>Record MoM</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onScheduleMeetingWithDean ? onScheduleMeetingWithDean(comm) : onScheduleCommitteeMeeting(comm)}
                  style={{
                    fontSize: '0.825rem',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    color: 'var(--accent-blue)',
                    borderColor: 'rgba(59, 130, 246, 0.35)',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)'
                  }}
                  title="Schedule / Request executive meeting with Dean Prof. Dr. Gehan Safwat"
                >
                  <Calendar size={15} />
                  <span>{isDeanOrAdmin ? "Meet with Committee" : "Meet w/ Prof. Gehan"}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onScheduleInformationSession ? onScheduleInformationSession(comm) : onScheduleCommitteeMeeting(comm)}
                  style={{
                    fontSize: '0.825rem',
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderColor: '#059669',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                  title="Schedule an information session to give guidelines or announcements to faculty staff & students"
                >
                  <span>📢 Info Session to People</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CENTERED CONFIRMATION MODAL: ABOLISH COMMITTEE ── */}
      {committeeToDelete && (
        <div
          className="modal-overlay"
          onClick={() => setCommitteeToDelete(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 9, 20, 0.88)',
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
            onClick={e => e.stopPropagation()}
            style={{
              width: '94%',
              maxWidth: '460px',
              padding: '26px',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-secondary, #ffffff)',
              border: '1.5px solid var(--border)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              color: 'var(--text-main)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Abolish Official Committee?
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  This action removes the committee and archives its mandates.
                </p>
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.5, background: 'var(--bg-inset)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
              Are you sure you want to abolish / remove the official standing committee:
              <div style={{ fontWeight: 800, marginTop: '4px', color: '#ef4444' }}>
                &ldquo;{committeeToDelete.name}&rdquo;
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCommitteeToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onDeleteCommittee(committeeToDelete.id, committeeToDelete.name);
                  setCommitteeToDelete(null);
                }}
                style={{
                  background: '#ef4444',
                  borderColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  padding: '9px 18px'
                }}
              >
                Yes, Abolish Committee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
