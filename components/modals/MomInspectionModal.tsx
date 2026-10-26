'use client';

import React, { useState } from 'react';
import { Meeting, MeetingActionItem, User } from '@/types';
import { PrintableMomDossier } from '@/components/reports/PrintableMomDossier';
import {
  X,
  Calendar,
  MapPin,
  UserCheck,
  CheckCircle2,
  FileText,
  Clock,
  Printer,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Award,
} from 'lucide-react';

interface MomInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  currentUser: User | null;
  onConvertActionItem: (meetingId: number, actionItemId: string) => Promise<void>;
  onOpenTaskDetails?: (taskId: number) => void;
}

export const MomInspectionModal: React.FC<MomInspectionModalProps> = ({
  isOpen,
  onClose,
  meeting,
  currentUser,
  onConvertActionItem,
  onOpenTaskDetails,
}) => {
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [viewMode, setViewMode] = useState<'interactive' | 'official_dossier'>('interactive');

  if (!isOpen || !meeting) return null;

  const pendingActionItems = (meeting.action_items || []).filter(
    (a) => !(a.status === 'converted' || a.status === 'completed' || !!a.task_id)
  );

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      for (const item of pendingActionItems) {
        await onConvertActionItem(meeting.id, item.id);
      }
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleConvert = async (actionItemId: string) => {
    try {
      setConvertingId(actionItemId);
      await onConvertActionItem(meeting.id, actionItemId);
    } finally {
      setConvertingId(null);
    }
  };

  const getMeetingTypeBadge = (type: string) => {
    switch (type) {
      case 'presidential_delegation':
        return { label: '🤝 Presidential Delegation', bg: 'var(--status-revision-bg)', border: 'var(--status-revision-border)', color: 'var(--status-revision)' };
      case 'faculty_board':
        return { label: '🏛️ Faculty Board Council', bg: 'var(--status-progress-bg)', border: 'var(--status-progress-border)', color: 'var(--status-progress)' };
      case 'committee':
        return { label: '🎩 Specialized Committee', bg: 'var(--status-pending-bg)', border: 'var(--status-pending-border)', color: 'var(--status-pending)' };
      default:
        return { label: '👥 Departmental Session', bg: 'var(--status-done-bg)', border: 'var(--status-done-border)', color: 'var(--status-done)' };
    }
  };

  const badge = getMeetingTypeBadge(meeting.type);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            background: 'var(--bg-inset)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: badge.bg,
                  border: `1px solid ${badge.border}`,
                  color: badge.color,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                }}
              >
                {badge.label}
              </span>
              {meeting.hat_name && (
                <span
                  style={{
                    background: 'var(--status-revision-bg)',
                    color: 'var(--status-revision)',
                    border: '1px solid var(--status-revision-border)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}
                >
                  🎩 {meeting.hat_name}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                <Calendar size={13} />
                {new Date(meeting.date).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
              {meeting.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (viewMode !== 'official_dossier') {
                  setViewMode('official_dossier');
                  setTimeout(() => window.print(), 150);
                } else {
                  window.print();
                }
              }}
              style={{
                fontSize: '0.775rem',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: '#93c5fd',
                borderColor: 'rgba(59, 130, 246, 0.4)',
              }}
              title="Print Official University Dossier"
            >
              <Printer size={15} />
              <span>Print Official Dossier</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: 'var(--text-muted)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            backgroundColor: 'var(--bg-inset)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('interactive')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: viewMode === 'interactive' ? '1px solid var(--status-progress-border)' : '1px solid transparent',
              background: viewMode === 'interactive' ? 'var(--status-progress-bg)' : 'transparent',
              color: viewMode === 'interactive' ? 'var(--status-progress)' : 'var(--text-secondary)',
              fontSize: '0.825rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={14} />
            <span>Interactive Governance View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('official_dossier')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: viewMode === 'official_dossier' ? '1px solid var(--status-done-border)' : '1px solid transparent',
              background: viewMode === 'official_dossier' ? 'var(--status-done-bg)' : 'transparent',
              color: viewMode === 'official_dossier' ? 'var(--status-done)' : 'var(--text-secondary)',
              fontSize: '0.825rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={14} />
            <span>📜 Official Letterhead Dossier (Print Ready)</span>
          </button>
        </div>

        {/* Modal Body Container */}
        {viewMode === 'official_dossier' ? (
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg-secondary)' }}>
            <PrintableMomDossier meeting={meeting} />
          </div>
        ) : (
          <>
            <div className="printable-dossier" style={{ display: 'none' }}>
              <PrintableMomDossier meeting={meeting} />
            </div>
            {/* Modal Body */}
            <div className="no-print" style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Metadata Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-inset)',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Venue</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <MapPin size={15} color="var(--status-pending)" />
                <span>{meeting.location}</span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Chairperson</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <Shield size={15} color="var(--accent-blue)" />
                <span>{meeting.chair}</span>
              </div>
            </div>
            {meeting.rapporteur && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Rapporteur / Secretary</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <FileText size={15} color="var(--status-revision)" />
                  <span>{meeting.rapporteur}</span>
                </div>
              </div>
            )}
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Quorum & Roster</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <UserCheck size={15} color="var(--status-done)" />
                <span>{meeting.attendees?.length || 0} Official Attendees</span>
              </div>
            </div>
          </div>

          {/* Objective */}
          {meeting.objective && (
            <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--status-progress-bg)', border: '1px solid var(--status-progress-border)', borderLeft: '4px solid var(--accent-blue)' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Session Objective & Institutional Mandate
              </div>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.55, fontWeight: 600 }}>
                {meeting.objective}
              </p>
            </div>
          )}

          {/* Attendees Roster */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <UserCheck size={16} color="var(--accent-blue)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-main)', margin: 0 }}>
                Official Delegation & Attendees Roster ({meeting.attendees?.length || 0})
              </h4>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {meeting.attendees?.map((att, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-inset)',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#ffffff',
                    }}
                  >
                    {att.name.charAt(0)}
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{att.name}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '6px', fontWeight: 600 }}>
                      ({att.role})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda */}
          {meeting.agenda && meeting.agenda.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Layers size={16} color="var(--status-pending)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-main)', margin: 0 }}>
                  Adopted Agenda Points
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {meeting.agenda.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-inset)',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem',
                      color: 'var(--text-main)',
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        background: 'var(--status-pending-bg)',
                        color: 'var(--status-pending)',
                        border: '1px solid var(--status-pending-border)',
                        borderRadius: '6px',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ lineHeight: 1.45 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Narrative Minutes of Meeting */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <FileText size={16} color="var(--status-done)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-main)', margin: 0 }}>
                Deliberations & Minutes Record (MoM)
              </h4>
            </div>
            <div
              style={{
                padding: '18px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-inset)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                fontSize: '0.925rem',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
                fontWeight: 500,
              }}
            >
              {meeting.minutes_body || 'No narrative minutes recorded.'}
            </div>
          </div>

          {/* Formal Decisions Taken */}
          {meeting.decisions && meeting.decisions.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Award size={16} color="var(--status-pending)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-main)', margin: 0 }}>
                  Official Resolutions & Decisions ({meeting.decisions.length})
                </h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {meeting.decisions.map((dec, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--status-pending-bg)',
                      border: '1px solid var(--status-pending-border)',
                      fontSize: '0.875rem',
                      color: 'var(--text-main)',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={16} color="var(--status-pending)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, lineHeight: 1.45 }}>{dec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items Matrix */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="var(--status-revision)" />
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-main)', margin: 0 }}>
                  Mandated Action Items & Presidential Tasks ({meeting.action_items?.length || 0})
                </h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {meeting.action_items?.filter(a => a.status === 'converted' || a.status === 'completed').length || 0} of {meeting.action_items?.length || 0} Dispatched
                </span>
                {pendingActionItems.length > 0 && (
                  <button
                    type="button"
                    disabled={isSyncingAll}
                    onClick={handleSyncAll}
                    className="btn btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Zap size={13} />
                    <span>{isSyncingAll ? 'Dispatching...' : `Sync All (${pendingActionItems.length}) to Tasks`}</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {meeting.action_items?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  No individual action items assigned for this session.
                </div>
              ) : (
                meeting.action_items?.map((item) => {
                  const isConverted = item.status === 'converted' || item.status === 'completed' || !!item.task_id;
                  const isCurrentConverting = convertingId === item.id;

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        backgroundColor: isConverted ? 'var(--status-done-bg)' : 'var(--bg-inset)',
                        border: isConverted ? '1px solid var(--status-done-border)' : '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '240px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {item.title}
                          </span>
                          {item.pillar_code && (
                            <span
                              style={{
                                background: 'var(--status-progress-bg)',
                                color: 'var(--status-progress)',
                                border: '1px solid var(--status-progress-border)',
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}
                            >
                              Pillar {item.pillar_code}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor:
                                item.priority === 'urgent'
                                  ? 'var(--status-overdue-bg)'
                                  : item.priority === 'high'
                                  ? 'var(--status-pending-bg)'
                                  : 'var(--bg-secondary)',
                              color:
                                item.priority === 'urgent'
                                  ? 'var(--status-overdue)'
                                  : item.priority === 'high'
                                  ? 'var(--status-pending)'
                                  : 'var(--text-secondary)',
                              border:
                                item.priority === 'urgent'
                                  ? '1px solid var(--status-overdue-border)'
                                  : item.priority === 'high'
                                  ? '1px solid var(--status-pending-border)'
                                  : '1px solid var(--border)',
                            }}
                          >
                            {item.priority}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span>👤 <strong style={{ color: 'var(--text-main)' }}>{item.assigned_to_name}</strong> ({item.department})</span>
                          <span>⏰ Due: <strong style={{ color: 'var(--text-main)' }}>{new Date(item.deadline).toLocaleDateString()}</strong></span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isConverted ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'var(--status-done-bg)',
                                color: 'var(--status-done)',
                                border: '1px solid var(--status-done-border)',
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                              }}
                            >
                              <CheckCircle2 size={13} />
                              {item.task_id ? `Live Task #${item.task_id}` : 'Live Faculty Task'}
                            </span>
                            {item.task_id && onOpenTaskDetails && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => onOpenTaskDetails(item.task_id!)}
                                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                              >
                                View Task
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={isCurrentConverting}
                            onClick={() => handleConvert(item.id)}
                            style={{
                              background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                              borderColor: '#d946ef',
                              boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
                              fontSize: '0.8rem',
                              padding: '6px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 700,
                            }}
                          >
                            <Zap size={14} />
                            <span>{isCurrentConverting ? 'Creating Task...' : '⚡ Convert to Live Task'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
          </>
        )}

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-inset)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Recorded by <strong style={{ color: 'var(--text-main)' }}>{meeting.created_by_name}</strong> • Formal Record ID #{meeting.id}
          </span>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 20px', fontWeight: 700 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
