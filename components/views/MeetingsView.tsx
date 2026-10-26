'use client';

import React, { useState } from 'react';
import { Meeting, User, DeanAvailabilitySlot } from '@/types';
import {
  Calendar,
  MapPin,
  UserCheck,
  FileText,
  Plus,
  Search,
  Zap,
  Award,
  Trash2,
  Edit2,
  Users,
  Clock,
  CheckCircle2,
  Settings,
  AlertCircle,
} from 'lucide-react';

interface MeetingsViewProps {
  meetings: Meeting[];
  currentUser: User | null;
  onOpenCreateMeeting: () => void;
  onOpenEditMeeting?: (meeting: Meeting) => void;
  onOpenInspectMoM: (meeting: Meeting) => void;
  onDeleteMeeting: (meetingId: number, meetingTitle: string) => void;
  onOpenTaskDetails?: (taskId: number) => void;
  onOpenDeanBriefing?: (meeting: Meeting) => void;
  onOpenRequestMeetingWithDean?: () => void;
  onOpenDeanAvailabilitySettings?: () => void;
  onApproveMeetingSlot?: (meetingId: number, optionId: string, notes?: string) => Promise<void>;
  onDeclineMeeting?: (meetingId: number, notes?: string) => Promise<void>;
  deanSlots?: DeanAvailabilitySlot[];
}

export const MeetingsView: React.FC<MeetingsViewProps> = ({
  meetings,
  currentUser,
  onOpenCreateMeeting,
  onOpenEditMeeting,
  onOpenInspectMoM,
  onDeleteMeeting,
  onOpenTaskDetails,
  onOpenDeanBriefing,
  onOpenRequestMeetingWithDean,
  onOpenDeanAvailabilitySettings,
  onApproveMeetingSlot,
  onDeclineMeeting,
  deanSlots = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'presidential_delegation' | 'faculty_board' | 'committee' | 'departmental'>('all');

  const isDeanOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.id === 99 ||
    currentUser?.id === 6496 ||
    currentUser?.id === 6591 ||
    currentUser?.role === 'dean' ||
    currentUser?.role === 'vice_dean';

  // Metrics
  const totalMeetings = meetings.length;
  const presidentialCount = meetings.filter(m => m.type === 'presidential_delegation').length;
  const facultyBoardCount = meetings.filter(m => m.type === 'faculty_board').length;
  const committeeSessionCount = meetings.filter(m => m.type === 'committee').length;
  
  const allActionItems = meetings.flatMap(m => m.action_items || []);
  const totalActionItems = allActionItems.length;
  const convertedActionItems = allActionItems.filter(ai => ai.status === 'converted' || ai.status === 'completed' || !!ai.task_id).length;

  // Pending Meeting Requests for Dean Gehan (Proposing 3 Options)
  const pendingDeanMeetings = meetings.filter(m => {
    if (m.status !== 'pending_dean_approval') return false;
    if (isDeanOrAdmin) return true;
    return m.created_by_id === currentUser?.id || m.attendees?.some(a => a.user_id === currentUser?.id);
  });

  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [deanNotesInput, setDeanNotesInput] = useState<{ [id: number]: string }>({});

  // Filtered meetings
  const filteredMeetings = meetings.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = m.title.toLowerCase().includes(query);
    const locationMatch = m.location.toLowerCase().includes(query);
    const chairMatch = m.chair.toLowerCase().includes(query);
    const objMatch = (m.objective || '').toLowerCase().includes(query);
    const attendeeMatch = m.attendees?.some(a => a.name.toLowerCase().includes(query));
    const decisionMatch = m.decisions?.some(d => d.toLowerCase().includes(query));
    const agendaMatch = m.agenda?.some(ag => ag.toLowerCase().includes(query));

    return titleMatch || locationMatch || chairMatch || objMatch || attendeeMatch || decisionMatch || agendaMatch;
  });

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'presidential_delegation':
        return {
          label: '🤝 Presidential Delegation',
          bg: 'rgba(139, 92, 246, 0.15)',
          border: '#8b5cf6',
          color: 'var(--status-revision)',
        };
      case 'faculty_board':
        return {
          label: '🏛️ Faculty Board Council',
          bg: 'rgba(59, 130, 246, 0.15)',
          border: '#3b82f6',
          color: 'var(--status-progress)',
        };
      case 'committee':
        return {
          label: '🏛️ Standing Committee Session',
          bg: 'rgba(245, 158, 11, 0.15)',
          border: '#f59e0b',
          color: 'var(--status-pending)',
        };
      default:
        return {
          label: '👥 Departmental Session',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '#10b981',
          color: 'var(--status-done)',
        };
    }
  };

  return (
    <div>
      {/* Intro & Metrics Header */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-10px', top: '-20px', fontSize: '110px', opacity: 0.04, pointerEvents: 'none', userSelect: 'none' }}>
          🤝
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.4rem' }}>🤝</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                Presidential Delegations & Meeting Minutes (MoM)
              </h3>
              <span style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: 'var(--status-revision)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                fontSize: '0.85rem',
                fontWeight: 800,
                padding: '3px 12px',
                borderRadius: '999px',
              }}>
                {totalMeetings} Formal Sessions
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Document official proceedings, high-level presidential delegations representing the Faculty of Biotechnology with the University President, and faculty board councils. Record deliberations, formal resolutions, and dispatch action items directly into live faculty tasks.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {/* 1. Request Meeting with Dean Gehan (Any Member) */}
            {onOpenRequestMeetingWithDean && (
              <button
                className="btn btn-primary"
                onClick={onOpenRequestMeetingWithDean}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderColor: '#059669',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  padding: '10px 16px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Calendar size={18} />
                <span>Request Meeting with Dean Gehan</span>
              </button>
            )}

            {/* 2. Dean Availability Settings (Dean & Admin Only) */}
            {isDeanOrAdmin && onOpenDeanAvailabilitySettings && (
              <button
                className="btn btn-secondary"
                onClick={onOpenDeanAvailabilitySettings}
                style={{
                  padding: '10px 16px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Settings size={17} />
                <span>Dean Availability Settings</span>
              </button>
            )}

            {/* 3. Record New Session / MoM */}
            <button
              className="btn btn-secondary"
              onClick={onOpenCreateMeeting}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                borderColor: '#7c3aed',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25)',
                color: '#fff',
                padding: '10px 16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={18} />
              <span>Record New Session (MoM)</span>
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'var(--bg-inset)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Total Sessions</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{totalMeetings}</div>
          </div>
          <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--status-revision)', textTransform: 'uppercase', fontWeight: 700 }}>🤝 Presidential Delegations</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-revision)', marginTop: '2px' }}>{presidentialCount}</div>
          </div>
          <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--status-progress)', textTransform: 'uppercase', fontWeight: 700 }}>🏛️ Faculty Board Councils</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-progress)', marginTop: '2px' }}>{facultyBoardCount}</div>
          </div>
          <div style={{ padding: '14px 18px', borderRadius: '10px', backgroundColor: 'rgba(236, 72, 153, 0.12)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <span style={{ fontSize: '0.8rem', color: '#db2777', textTransform: 'uppercase', fontWeight: 700 }}>⚡ Action Items Dispatched</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#db2777', marginTop: '2px' }}>
              {convertedActionItems} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalActionItems} live tasks</span>
            </div>
          </div>
        </div>

        {/* PENDING DEAN MEETING REQUESTS (3 OPTIONS SELECTION) */}
        {pendingDeanMeetings.length > 0 && (
          <div
            style={{
              marginTop: '20px',
              padding: '22px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(139, 92, 246, 0.1))',
              border: '1.5px solid var(--status-pending-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>📬</span>
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--status-pending)' }}>
                    {isDeanOrAdmin
                      ? `Action Required: Pending Meeting Requests for Prof. Dr. Gehan (${pendingDeanMeetings.length})`
                      : `Your Meeting Requests Pending Dean Confirmation (${pendingDeanMeetings.length})`}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '3px 0 0 0', fontWeight: 500 }}>
                    {isDeanOrAdmin
                      ? 'Requesters have proposed 3 time slot options. Select exactly 1 option to confirm and schedule at the Dean\'s Office.'
                      : 'Prof. Dr. Gehan Safwat is reviewing your 3 proposed options. You will receive a notification upon approval.'}
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.825rem', fontWeight: 800, background: 'var(--status-pending-bg)', color: 'var(--status-pending)', padding: '5px 14px', borderRadius: '999px', border: '1px solid var(--status-pending-border)' }}>
                Venue: Dean&apos;s Office (Building A, Room 301)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pendingDeanMeetings.map(m => (
                <div
                  key={m.id}
                  style={{
                    padding: '18px 20px',
                    borderRadius: '12px',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                          {m.title}
                        </span>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--status-revision)', padding: '3px 10px', borderRadius: '6px', fontWeight: 800, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                          Requested by {m.created_by_name}
                        </span>
                        {m.hat_name && (
                          <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--status-progress)', padding: '3px 10px', borderRadius: '6px', fontWeight: 700, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            {m.hat_name}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                        {m.objective}
                      </p>
                    </div>

                    {isDeanOrAdmin && onDeclineMeeting && (
                      <button
                        type="button"
                        onClick={() => onDeclineMeeting(m.id, deanNotesInput[m.id])}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.825rem', color: 'var(--status-overdue)', borderColor: 'var(--status-overdue-border)', fontWeight: 700 }}
                      >
                        Decline Request
                      </button>
                    )}
                  </div>

                  {/* 3 Options Side-by-Side Display */}
                  <div>
                    <div style={{ fontSize: '0.825rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '8px' }}>
                      Proposed 3 Time Slot Options (Choose 1 to approve):
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                      {(m.time_options || []).map((opt, idx) => (
                        <div
                          key={opt.id || idx}
                          style={{
                            padding: '14px',
                            borderRadius: '10px',
                            background: idx === 0 ? 'rgba(139, 92, 246, 0.1)' : idx === 1 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            border: `1.5px solid ${idx === 0 ? 'rgba(139, 92, 246, 0.4)' : idx === 1 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: idx === 0 ? 'var(--status-revision)' : idx === 1 ? 'var(--status-progress)' : 'var(--status-done)' }}>
                              {opt.label || `Option ${idx + 1}`}
                            </div>
                            <div style={{ fontSize: '0.975rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                              📅 {opt.date}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                              ⏰ {opt.time_slot}
                            </div>
                            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                              📍 {opt.location || "Dean's Office"}
                            </div>
                          </div>

                          {isDeanOrAdmin && onApproveMeetingSlot && (
                            <button
                              type="button"
                              disabled={approvingId === m.id}
                              onClick={async () => {
                                setApprovingId(m.id);
                                await onApproveMeetingSlot(m.id, opt.id, deanNotesInput[m.id]);
                                setApprovingId(null);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{
                                background: idx === 0 ? '#8b5cf6' : idx === 1 ? '#3b82f6' : '#10b981',
                                borderColor: 'transparent',
                                fontSize: '0.785rem',
                                fontWeight: 800,
                                padding: '7px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              <CheckCircle2 size={15} />
                              <span>{approvingId === m.id ? 'Approving...' : `Approve Option ${idx + 1}`}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional Notes from Dean */}
                  {isDeanOrAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Add optional directive or note for requester (e.g. 'Please bring the updated curriculum syllabus')..."
                        value={deanNotesInput[m.id] || ''}
                        onChange={(e) => setDeanNotesInput(prev => ({ ...prev, [m.id]: e.target.value }))}
                        style={{ fontSize: '0.8rem', height: '34px' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls & Search */}
        <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px', height: '38px', fontSize: '0.85rem' }}
              placeholder="Search delegations, attendees, decisions, agenda..."
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
              className={`btn btn-sm ${typeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTypeFilter('all')}
              style={{ fontSize: '0.785rem', padding: '6px 12px' }}
            >
              All Sessions ({meetings.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${typeFilter === 'presidential_delegation' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTypeFilter('presidential_delegation')}
              style={{ fontSize: '0.785rem', padding: '6px 12px' }}
            >
              🤝 Presidential ({presidentialCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${typeFilter === 'faculty_board' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTypeFilter('faculty_board')}
              style={{ fontSize: '0.785rem', padding: '6px 12px' }}
            >
              🏛️ Faculty Board ({facultyBoardCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${typeFilter === 'committee' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTypeFilter('committee')}
              style={{ fontSize: '0.785rem', padding: '6px 12px' }}
            >
              🏛️ Committees ({committeeSessionCount})
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {filteredMeetings.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>📋</span>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
            No Sessions Found
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 16px' }}>
            {searchQuery
              ? `No sessions matching "${searchQuery}". Try clearing search filters.`
              : 'No formal proceedings recorded in this category yet.'}
          </p>
          <button className="btn btn-primary" onClick={onOpenCreateMeeting}>
            + Record New Session
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px' }}>
          {filteredMeetings.map((meeting) => {
            const style = getTypeStyle(meeting.type);
            const totalAi = meeting.action_items?.length || 0;
            const convertedAi = meeting.action_items?.filter(ai => ai.status === 'converted' || ai.status === 'completed' || !!ai.task_id).length || 0;

            return (
              <div
                key={meeting.id}
                className="glass-card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        background: style.bg,
                        border: `1.5px solid ${style.border}`,
                        color: style.color,
                        fontSize: '0.825rem',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '999px',
                      }}
                    >
                      {style.label}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 600,
                        }}
                      >
                        <Calendar size={14} />
                        {new Date(meeting.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>

                      {isDeanOrAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {onOpenEditMeeting && (
                            <button
                              type="button"
                              onClick={() => onOpenEditMeeting(meeting)}
                              title="Edit Session Details"
                              style={{
                                background: 'var(--bg-inset)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '5px',
                                borderRadius: '6px',
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteMeeting(meeting.id, meeting.title)}
                            title="Delete Session"
                            style={{
                              background: 'var(--status-overdue-bg)',
                              border: '1px solid var(--status-overdue-border)',
                              color: 'var(--status-overdue)',
                              cursor: 'pointer',
                              padding: '5px',
                              borderRadius: '6px',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h4
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      lineHeight: 1.4,
                      marginBottom: '10px',
                    }}
                  >
                    {meeting.title}
                  </h4>

                  {/* Status indicator for Dean Requested Meetings */}
                  {meeting.status === 'pending_dean_approval' ? (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'var(--status-pending-bg)',
                        border: '1px solid var(--status-pending-border)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="var(--status-pending)" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--status-pending)', fontWeight: 800 }}>
                          Pending Dean Approval (3 Options Submitted)
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--status-pending)', fontWeight: 700 }}>
                        Venue: Dean&apos;s Office
                      </span>
                    </div>
                  ) : meeting.selected_option_id ? (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'var(--status-done-bg)',
                        border: '1px solid var(--status-done-border)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <CheckCircle2 size={16} color="var(--status-done)" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--status-done)', fontWeight: 800 }}>
                        Confirmed by Dean Gehan: {new Date(meeting.date).toLocaleDateString()} at Dean&apos;s Office
                      </span>
                    </div>
                  ) : null}

                  {/* Location & Chair Meta */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '14px',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '16px',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={14} color="var(--text-muted)" />
                      <span style={{ fontWeight: 600 }}>{meeting.location}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserCheck size={14} color="var(--text-muted)" />
                      <span style={{ fontWeight: 600 }}>Chair: {meeting.chair}</span>
                    </span>
                  </div>

                  {/* Attendees */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '8px' }}>
                      Quorum Attendees ({meeting.attendees?.length || 0})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(meeting.attendees || []).slice(0, 4).map((att, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-inset)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {att.name.split(' ').slice(0, 2).join(' ')}
                        </span>
                      ))}
                      {(meeting.attendees?.length || 0) > 4 && (
                        <span
                          style={{
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--bg-inset)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          +{(meeting.attendees?.length || 0) - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Decisions & Action Items Counter */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-inset)',
                      border: '1px solid var(--border)',
                      marginBottom: '16px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-pending)', fontWeight: 700 }}>
                      <Award size={16} color="var(--status-pending)" />
                      <span>{meeting.decisions?.length || 0} Resolutions</span>
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#db2777', fontWeight: 700 }}>
                      <Zap size={16} color="#ec4899" />
                      <span>{convertedAi} / {totalAi} Live Tasks</span>
                    </span>
                  </div>

                  {/* Presidential Delegation: Dean Gehan Briefing Status & Action */}
                  {meeting.type === 'presidential_delegation' && (
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: meeting.dean_briefing?.status === 'completed'
                          ? 'var(--status-done-bg)'
                          : meeting.dean_briefing?.required
                          ? 'var(--status-progress-bg)'
                          : 'var(--bg-inset)',
                        border: `1.5px solid ${
                          meeting.dean_briefing?.status === 'completed'
                            ? 'var(--status-done-border)'
                            : meeting.dean_briefing?.required
                            ? 'var(--status-progress-border)'
                            : 'var(--border)'
                        }`,
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🤝 Briefing with Dean Prof. Dr. Gehan:</span>
                          <span style={{
                            color: meeting.dean_briefing?.status === 'completed' ? 'var(--status-done)' : 'var(--status-progress)',
                            fontWeight: 800,
                            textTransform: 'capitalize'
                          }}>
                            {meeting.dean_briefing?.status === 'completed'
                              ? 'Minutes Recorded & Signed'
                              : meeting.dean_briefing?.required
                              ? `${meeting.dean_briefing.phase || 'Pre-Meeting'} Briefing Scheduled`
                              : 'Not Yet Scheduled'}
                          </span>
                        </div>
                        {meeting.dean_briefing?.briefing_date && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px', fontWeight: 500 }}>
                            Session Date: {new Date(meeting.dean_briefing.briefing_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {onOpenDeanBriefing && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => onOpenDeanBriefing(meeting)}
                          style={{
                            fontSize: '0.825rem',
                            padding: '6px 12px',
                            fontWeight: 800,
                            borderColor: 'var(--accent-blue)',
                            color: 'var(--accent-blue)',
                          }}
                        >
                          {meeting.dean_briefing?.minutes ? 'View/Edit Minutes' : 'Schedule Briefing'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Recurrence Indicator */}
                  {meeting.recurrence && meeting.recurrence.pattern !== 'none' && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--status-revision)', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🔁 Recurring Series: {meeting.recurrence.pattern.toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onOpenInspectMoM(meeting)}
                    style={{
                      flex: 1,
                      fontSize: '0.875rem',
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                    }}
                  >
                    <FileText size={16} />
                    <span>View Minutes of Meeting (MoM)</span>
                  </button>
                  {meeting.type === 'presidential_delegation' && onOpenDeanBriefing && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onOpenDeanBriefing(meeting)}
                      title="Briefing Session with Dean Prof. Dr. Gehan Safwat"
                      style={{
                        fontSize: '0.875rem',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        borderColor: 'rgba(59, 130, 246, 0.35)',
                        color: 'var(--accent-blue)',
                        fontWeight: 700,
                      }}
                    >
                      <span>🤝 Briefing with Dean Gehan</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
