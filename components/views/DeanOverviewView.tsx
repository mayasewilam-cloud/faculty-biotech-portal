'use client';

import React, { useMemo, useState } from 'react';
import { Task, Hat, User, AnalyticsData, Meeting, FacultyCommittee } from '@/types';
import { calculateTaskMetrics, filterTasksByScope } from '@/lib/taskFilters';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  FileSpreadsheet,
  Download,
  Award,
  FileText,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  ArrowRight,
  Plus,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface DeanOverviewViewProps {
  tasks: Task[];
  hats: Hat[];
  currentUser: User | null;
  analytics?: AnalyticsData | null;
  meetings?: Meeting[];
  committees?: FacultyCommittee[];
  onSelectTask: (task: Task) => void;
  onNavigateToTasks?: (statusFilter?: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenAccreditationDossier?: () => void;
  onOpenImportModal?: () => void;
  onDeanApprove?: (taskId: number) => void;
  onScheduleMeeting?: (task?: Task, committee?: FacultyCommittee) => void;
}

function getTaskStatusColors(status: string, isOverdue: boolean) {
  if (status === 'done') return { bg: 'rgba(34,197,94,0.14)', text: '#16a34a', dot: '#22c55e', icon: <CheckCircle2 size={16} />, label: 'Done' };
  if (isOverdue) return { bg: 'rgba(239,68,68,0.14)', text: '#dc2626', dot: '#ef4444', icon: <AlertTriangle size={16} />, label: 'Overdue' };
  if (status === 'in_progress') return { bg: 'rgba(59,130,246,0.14)', text: '#2563eb', dot: '#3b82f6', icon: <Clock size={16} />, label: 'In Progress' };
  if (status === 'revision_requested') return { bg: 'rgba(139,92,246,0.14)', text: '#7c3aed', dot: '#8b5cf6', icon: <RotateCcw size={16} />, label: 'Needs Revision' };
  return { bg: 'rgba(100,116,139,0.14)', text: '#475569', dot: '#94a3b8', icon: <Clock size={16} />, label: 'Pending' };
}

export const DeanOverviewView: React.FC<DeanOverviewViewProps> = ({
  tasks,
  hats,
  currentUser,
  analytics,
  meetings = [],
  committees = [],
  onSelectTask,
  onNavigateToTasks,
  onNavigateToTab,
  onOpenAccreditationDossier,
  onOpenImportModal,
  onDeanApprove,
  onScheduleMeeting,
}) => {
  const [showFollowUpModal, setShowFollowUpModal] = useState<boolean>(false);

  const now = useMemo(() => new Date(), []);

  const isDean = useMemo(() => {
    return (
      currentUser?.role === 'admin' ||
      currentUser?.role === 'dean' ||
      currentUser?.role === 'vice_dean' ||
      currentUser?.id === 99 ||
      currentUser?.id === 6496 ||
      currentUser?.id === 6591
    );
  }, [currentUser]);

  // Unified task metrics & scoping (single source of truth)
  const scopedTasks = useMemo(() => {
    return filterTasksByScope(tasks, currentUser, isDean).filter((t) => !t.parent_task_id);
  }, [tasks, currentUser, isDean]);

  const metrics = useMemo(() => {
    return calculateTaskMetrics(tasks, currentUser, isDean, now);
  }, [tasks, currentUser, isDean, now]);

  const {
    totalCount,
    doneCount,
    inProgressCount,
    overdueCount,
    awaitingDeanReviewCount,
    pendingCount,
    completionRate,
  } = metrics;

  // Follow-Up Tasks (Fall 2026 file)
  const followUpTasks = useMemo(() => scopedTasks.filter((t: any) => t.tr != null || (t as any).source === "portal"), [scopedTasks]);

  // Recent portal-dispatched tasks to display immediately on Overview
  const recentPortalTasks = useMemo(() => {
    return scopedTasks.filter((t: any) => t.source === "portal" || (!t.month_sheet && Number(t.id) > 100))
      .slice(0, 5);
  }, [scopedTasks]);
  const followUpDone = followUpTasks.filter(t => t.status === 'done').length;
  const followUpPending = followUpTasks.filter(t => t.status !== 'done').length;
  const followUpOverdue = followUpTasks.filter(t => t.status !== 'done' && t.deadline && new Date(t.deadline) < now).length;

  // Upcoming executive sessions & meetings (Prof. Nader, Committees, Direct reviews)
  const upcomingMeetings = useMemo(() => {
    if (!meetings || meetings.length === 0) return [];
    return [...meetings]
      .filter(m => m.status !== 'rejected')
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 4);
  }, [meetings]);

  // Tasks awaiting Dean Review and Critical Deadlines
  const awaitingReviewTasks = useMemo(() => {
    return scopedTasks.filter(t => t.status === 'done' && !t.dean_acknowledged).slice(0, 4);
  }, [scopedTasks]);

  const urgentApproachingTasks = useMemo(() => {
    return scopedTasks
      .filter(t => t.status !== 'done' && (t.priority === 'urgent' || (t.deadline && new Date(t.deadline) < now)))
      .slice(0, 3);
  }, [scopedTasks, now]);

  const formatMeetingDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    return d.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Export end-of-semester report: Hats and the people/tasks under each hat
  const handleExportSemesterHatsReport = () => {
    const headers = ['Hat Name', 'Task Title', 'Responsible Staff', 'Role / Title', 'Department', 'Priority', 'Status', 'Deadline', 'Completed Date'];
    const rows: string[][] = [];

    for (const hat of hats) {
      const hatTasks = scopedTasks.filter(t => t.hat_id === hat.id);
      if (hatTasks.length === 0) {
        rows.push([
          `"${hat.name}"`,
          '"No tasks recorded"',
          '""',
          '""',
          '""',
          '""',
          '"pending"',
          '""',
          '""'
        ]);
      } else {
        for (const t of hatTasks) {
          rows.push([
            `"${hat.name}"`,
            `"${(t.title || '').replace(/"/g, '""')}"`,
            `"${(t.assignee_name || '').replace(/"/g, '""')}"`,
            `"${(t.assignee_title || '').replace(/"/g, '""')}"`,
            `"${(t.department || t.assignee_department || '').replace(/"/g, '""')}"`,
            t.priority || 'medium',
            t.status,
            t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB') : 'None',
            t.completed_at ? new Date(t.completed_at).toLocaleDateString('en-GB') : 'N/A'
          ]);
        }
      }
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Faculty_Biotechnology_Hats_and_Staff_Semester_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── HEADER & WORKFLOW CONTROLS ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            {isDean ? "Faculty Overview" : "My Overview"}
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {isDean
              ? "Key performance metrics and progress across faculty operations"
              : "Summary of your active deliverables and deadlines"}
          </p>
        </div>

        {/* Dean Action Buttons: Export & Excel Sync */}
        {isDean && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/tasks/sync-sheet', { method: 'POST' });
                  const data = await res.json();
                  if (data.success) {
                    window.location.reload();
                  } else {
                    alert('Sync error: ' + (data.error || 'Failed to sync with Google Sheet'));
                  }
                } catch (e: any) {
                  alert('Error syncing sheet: ' + e.message);
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '6px 12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: '#10b981',
              }}
              title="Sync live directives directly from Task Follow-Up Google Sheet"
            >
              <RefreshCw size={14} />
              <span>Sync Google Sheet</span>
            </button>
            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, padding: '6px 12px' }}
                title="Update tasks directly from your Excel spreadsheet"
              >
                <FileSpreadsheet size={15} style={{ color: '#10b981' }} />
                <span>Import Excel</span>
              </button>
            )}

            <button
              onClick={handleExportSemesterHatsReport}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600, padding: '6px 12px' }}
              title="Download end-of-semester file linking hats to assigned staff"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 1. EXECUTIVE 6 KPI METRICS TILES (HIGH CONTRAST & READABLE FONTS) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
        gap: '16px'
      }}>
        {/* 1. TOTAL TASKS UPLOADED */}
        <div
          className="glass-card"
          onClick={() => onNavigateToTasks && onNavigateToTasks('all')}
          style={{
            padding: '20px 22px',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to view all tasks in Tasks tab"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              {isDean ? 'TOTAL TASKS UPLOADED' : 'MY ASSIGNED TASKS'}
            </span>
            <FileText size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '2.3rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{isDean ? 'Across all departments' : 'In your active queue'}</span>
            <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>View Tasks &rarr;</span>
          </div>
        </div>

        {/* 2. COMPLETED & VERIFIED */}
        <div
          className="glass-card"
          onClick={() => onNavigateToTasks && onNavigateToTasks('done')}
          style={{
            padding: '20px 22px',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to view completed tasks in Tasks tab"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              COMPLETED & VERIFIED
            </span>
            <CheckCircle2 size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '2.3rem', fontWeight: 900, color: '#16a34a', lineHeight: 1.1 }}>
            {doneCount}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#16a34a', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{completionRate}% completion rate</span>
            <span style={{ fontWeight: 800 }}>View Tasks &rarr;</span>
          </div>
        </div>

        {/* 3. AWAITING DEAN REVIEW */}
        <div
          className="glass-card"
          onClick={() => onNavigateToTasks && onNavigateToTasks('awaiting_dean')}
          style={{
            padding: '20px 22px',
            borderRadius: '16px',
            background: awaitingDeanReviewCount > 0 ? 'rgba(245, 158, 11, 0.08)' : undefined,
            border: awaitingDeanReviewCount > 0 ? '1.5px solid rgba(245, 158, 11, 0.45)' : undefined,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to review submissions in Tasks tab"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: awaitingDeanReviewCount > 0 ? '#d97706' : 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              AWAITING DEAN REVIEW
            </span>
            <Award size={18} color={awaitingDeanReviewCount > 0 ? '#d97706' : 'var(--text-muted)'} />
          </div>
          <div style={{ fontSize: '2.3rem', fontWeight: 900, color: awaitingDeanReviewCount > 0 ? '#d97706' : 'var(--text-main)', lineHeight: 1.1 }}>
            {awaitingDeanReviewCount}
          </div>
          <div style={{ fontSize: '0.85rem', color: awaitingDeanReviewCount > 0 ? '#b45309' : 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{awaitingDeanReviewCount > 0 ? 'Pending Dean sign-off' : 'All verified'}</span>
            <span style={{ fontWeight: 800, color: '#d97706' }}>Review &rarr;</span>
          </div>
        </div>

        {/* 4. IN PROGRESS */}
        <div
          className="glass-card"
          onClick={() => onNavigateToTasks && onNavigateToTasks('in_progress')}
          style={{
            padding: '20px 22px',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to view in-progress tasks in Tasks tab"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              IN PROGRESS
            </span>
            <Clock size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '2.3rem', fontWeight: 900, color: '#2563eb', lineHeight: 1.1 }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Active updates logged</span>
            <span style={{ color: '#2563eb', fontWeight: 800 }}>Track &rarr;</span>
          </div>
        </div>

        {/* 5. PENDING ACTION */}
        <div
          className="glass-card"
          onClick={() => onNavigateToTasks && onNavigateToTasks('pending')}
          style={{
            padding: '20px 22px',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to view pending tasks in Tasks tab"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              PENDING ACTION
            </span>
            <RotateCcw size={18} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '2.3rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Awaiting commencement</span>
            <span style={{ color: 'var(--accent-blue)', fontWeight: 800 }}>View &rarr;</span>
          </div>
        </div>

        {/* 6. OVERDUE TASKS */}
        <div
          className="glass-card"
          onClick={() => onNavigateToTasks && onNavigateToTasks('overdue')}
          style={{
            padding: '20px 22px',
            borderRadius: '16px',
            background: overdueCount > 0 ? 'rgba(239, 68, 68, 0.08)' : undefined,
            border: overdueCount > 0 ? '1.5px solid rgba(239, 68, 68, 0.45)' : undefined,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Click to view overdue tasks in Tasks tab"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: overdueCount > 0 ? '#dc2626' : 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              OVERDUE TASKS
            </span>
            <AlertTriangle size={18} color={overdueCount > 0 ? '#dc2626' : '#94a3b8'} />
          </div>
          <div style={{ fontSize: '2.3rem', fontWeight: 900, color: overdueCount > 0 ? '#dc2626' : 'var(--text-main)', lineHeight: 1.1 }}>
            {overdueCount}
          </div>
          <div style={{ fontSize: '0.85rem', color: overdueCount > 0 ? '#dc2626' : 'var(--text-secondary)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{overdueCount > 0 ? 'Requires follow-up' : 'All on schedule'}</span>
            <span style={{ color: '#dc2626', fontWeight: 800 }}>Inspect &rarr;</span>
          </div>
        </div>
      </div>

      {/* ── 2. EXECUTIVE DASHBOARD: UPCOMING SESSIONS & PENDING ACTIONS (2 COLUMNS) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {/* LEFT COLUMN: UPCOMING SESSIONS & HIGH-LEVEL MEETINGS */}
        <div className="glass-card" style={{
          padding: '22px 24px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '18px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📅</span>
                  <span>Upcoming Sessions & Meetings</span>
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Presidential briefings, committee sessions & reviews
                </p>
              </div>

              {onScheduleMeeting && (
                <button
                  type="button"
                  onClick={() => onScheduleMeeting()}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '5px 10px',
                    borderRadius: '8px'
                  }}
                  title="Schedule a new meeting or session"
                >
                  <Plus size={14} />
                  <span>New Meeting</span>
                </button>
              )}
            </div>

            {upcomingMeetings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {upcomingMeetings.map((m) => {
                  const isPresidential =
                    m.type === 'presidential_delegation' ||
                    /nader|presidential/i.test(m.title) ||
                    /nader/i.test(m.chair);
                  const isCommittee = m.type === 'committee' || !!m.committee_id;

                  const badgeColor = isPresidential
                    ? { bg: 'rgba(168, 85, 247, 0.12)', text: '#9333ea', border: 'rgba(168, 85, 247, 0.3)', label: '🏛️ Presidential' }
                    : isCommittee
                    ? { bg: 'rgba(59, 130, 246, 0.12)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.3)', label: '👥 Committee' }
                    : { bg: 'rgba(16, 185, 129, 0.12)', text: '#059669', border: 'rgba(16, 185, 129, 0.3)', label: '🤝 Review Session' };

                  return (
                    <div
                      key={m.id}
                      onClick={() => onNavigateToTab && onNavigateToTab('calendar')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'var(--bg-inset, rgba(0,0,0,0.02))',
                        border: '1.5px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = badgeColor.text)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: badgeColor.bg,
                          color: badgeColor.text,
                          border: `1px solid ${badgeColor.border}`
                        }}>
                          {badgeColor.label}
                        </span>

                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {formatMeetingDate(m.date)}
                        </span>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.35 }}>
                        {m.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {m.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />
                            <span>{m.location}</span>
                          </span>
                        )}
                        {m.chair && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={12} />
                            <span>Chair: {m.chair}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'var(--bg-inset)',
                border: '1.5px dashed var(--border)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Calendar size={28} color="var(--text-secondary)" />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  No sessions scheduled for today
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Schedule upcoming presidential briefings or standing committee sessions.
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onNavigateToTab && onNavigateToTab('calendar')}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--accent-blue)',
                padding: '5px 12px'
              }}
            >
              <span>Open Full Calendar</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab && onNavigateToTab('meetings')}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '5px 12px'
              }}
            >
              <span>Meeting Minutes (MoM)</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: NEEDS PROF. GEHAN'S ACTION */}
        <div className="glass-card" style={{
          padding: '22px 24px',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '18px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚡</span>
                  <span>{isDean ? "Needs Prof. Gehan's Action" : "Needs Your Action"}</span>
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Deliverables awaiting review and critical deadlines
                </p>
              </div>

              {(awaitingReviewTasks.length > 0 || urgentApproachingTasks.length > 0) && (
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: awaitingReviewTasks.length > 0 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: awaitingReviewTasks.length > 0 ? '#b45309' : '#dc2626',
                  border: awaitingReviewTasks.length > 0 ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)'
                }}>
                  {awaitingReviewTasks.length + urgentApproachingTasks.length} Pending
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* SUBSECTION 0: RECENTLY DISPATCHED DIRECTIVES */}
              {recentPortalTasks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ⚡ Recently Dispatched Directives ({recentPortalTasks.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateToTasks && onNavigateToTasks('all')}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      View All →
                    </button>
                  </div>
                  {recentPortalTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      style={{
                        padding: '11px 13px',
                        borderRadius: '12px',
                        background: 'rgba(59, 130, 246, 0.06)',
                        border: '1.5px solid rgba(59, 130, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.tr && <span style={{ color: 'var(--accent-blue)', marginRight: '6px' }}>#{t.tr}</span>}
                          {t.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>👥 {t.assignee_name || (Array.isArray(t.assigned_members) && t.assigned_members[0]) || 'Staff'}</span>
                          <span>•</span>
                          <span>📅 Due: {t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB') : 'Open'}</span>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: '999px',
                        background: 'rgba(59, 130, 246, 0.14)',
                        color: 'var(--accent-blue)',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        whiteSpace: 'nowrap',
                        textTransform: 'uppercase'
                      }}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* SUBSECTION 1: AWAITING DEAN REVIEW */}
              {awaitingReviewTasks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Deliverables Awaiting Review ({awaitingReviewTasks.length})
                  </div>
                  {awaitingReviewTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(234, 179, 8, 0.06)',
                        border: '1.5px solid rgba(234, 179, 8, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div
                          onClick={() => onSelectTask(t)}
                          style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', lineHeight: 1.35 }}
                          title="Click to inspect deliverable"
                        >
                          {t.title}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <span>👤 {t.assignee_name || 'Staff Member'}</span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isDean && onDeanApprove && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeanApprove(t.id);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{
                                padding: '3px 8px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                backgroundColor: 'rgba(34, 197, 94, 0.14)',
                                borderColor: 'rgba(34, 197, 94, 0.4)',
                                color: '#16a34a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="One-click Dean Approval"
                            >
                              <ShieldCheck size={12} />
                              <span>Approve</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onSelectTask(t)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.74rem', fontWeight: 700 }}
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SUBSECTION 2: URGENT / OVERDUE */}
              {urgentApproachingTasks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Critical Deadlines & Overdue ({urgentApproachingTasks.length})
                  </div>
                  {urgentApproachingTasks.map((t) => {
                    const isOverdue = t.deadline && new Date(t.deadline) < now;
                    return (
                      <div
                        key={t.id}
                        onClick={() => onSelectTask(t)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: isOverdue ? 'rgba(239, 68, 68, 0.06)' : 'rgba(234, 179, 8, 0.05)',
                          border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'rgba(234, 179, 8, 0.25)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {t.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            👤 {t.assignee_name || 'Staff'} &middot; <strong style={{ color: isOverdue ? '#dc2626' : '#b45309' }}>Due: {t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'No Date'}</strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}
                        >
                          View
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* EMPTY STATE IF NOTHING PENDING */}
              {awaitingReviewTasks.length === 0 && urgentApproachingTasks.length === 0 && (
                <div style={{
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'var(--bg-inset)',
                  border: '1.5px dashed var(--border)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={28} color="#16a34a" />
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    All deliverables verified & up to date
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    No pending approvals or overdue items requiring action.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => onNavigateToTasks && onNavigateToTasks(awaitingReviewTasks.length > 0 ? 'awaiting_dean' : 'all')}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--accent-blue)',
                padding: '5px 12px'
              }}
            >
              <span>View Tasks Table</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── FOLLOW-UP TASKS INSPECTION MODAL ── */}
      {showFollowUpModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(5, 9, 20, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowFollowUpModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary, #ffffff)',
              border: '1.5px solid var(--border)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '780px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{
              padding: '22px 26px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>📋</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Official Follow-Up Directives (Master File)
                  </h3>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    {followUpDone} of {followUpTasks.length} directives completed &middot; {followUpPending} pending
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowFollowUpModal(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', padding: '6px',
                  borderRadius: '8px', display: 'flex', alignItems: 'center',
                }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '18px 26px 26px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {followUpTasks.map((task: any) => {
                  const isOverdue = task.status !== 'done' && task.deadline && new Date(task.deadline) < now;
                  const statusStyle = getTaskStatusColors(task.status, !!isOverdue);
                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        setShowFollowUpModal(false);
                        onSelectTask(task);
                      }}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '14px',
                        background: 'var(--bg-secondary, rgba(255,255,255,0.04))',
                        border: '1.5px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                          {task.tr && <span style={{ color: 'var(--accent-blue)', marginRight: '6px' }}>#{task.tr}</span>}
                          {task.title}
                        </div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {statusStyle.icon}
                          <span>{statusStyle.label}</span>
                        </div>
                      </div>

                      {task.description && (
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                          {task.description}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px', paddingTop: '6px', borderTop: '1px dashed var(--border)', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                        <span>👤 {task.assignee_name}</span>
                        {task.department && <span>🏢 {task.department}</span>}
                        {task.deadline && (
                          <span style={{ color: isOverdue ? '#ef4444' : 'inherit', fontWeight: isOverdue ? 800 : 500 }}>
                            📅 Due {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            {isOverdue && ' ⚠️'}
                          </span>
                        )}
                        {task.received_by && <span>📥 Received: {task.received_by}</span>}
                      </div>

                      {task.completion_notes && (
                        <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          <strong>Notes:</strong> {task.completion_notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
