'use client';

import React, { useState } from 'react';
import { Task, User } from '@/types';
import {
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Mail,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Lock,
  FileText,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';

interface WeeklyReportViewProps {
  tasks: Task[];
  currentUser: User | null;
  theme: 'dark' | 'light';
  onOpenCreateRequest: () => void;
  onOpenTaskDetails: (task: Task) => void;
  onOpenEmailDispatch?: (task?: Task, customSubject?: string, customBody?: string) => void;
  onOpenSubmissionsDrawer?: (task: Task) => void;
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({
  tasks,
  currentUser,
  theme,
  onOpenCreateRequest,
  onOpenTaskDetails,
  onOpenEmailDispatch,
  onOpenSubmissionsDrawer,
}) => {
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'due_soon' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const TRACKER_URL = 'https://docs.google.com/spreadsheets/d/18ptos5jsQWknMQUy9AEjhhyAlCvmlU_LreOlHALGUcA/edit?usp=drivesdk';

  const weeklyMemoText = `Dear Professors and Assisting Staff,

Here is this Week Tasks:

🔴 Due Soon
* Submission of Special Needs Midterm and Final Exams: Prof. Amr Ageez due date Today 15th of October at 1:00 PM.

🟡 In Progress
• Newly Hired Staff Laboratory Tracker.

Please Open the Tracker, Find your Name, and Update your Status or Add a Comment by Thursday:
👉 ${TRACKER_URL}

Thank you for your Cooperation.
Best Regards,
Faculty of Biotechnology Dean's Office
October University for Modern Sciences and Arts (MSA)`;

  const handleCopyMemo = async () => {
    try {
      await navigator.clipboard.writeText(weeklyMemoText);
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter tasks that belong to Fall 2026 or have tr / are follow-up tasks
  const fallTasks = tasks.filter((t) => {
    const isFall = Boolean(
      t.tr ||
      t.comment_type ||
      t.title.toLowerCase().includes('fall 2026') ||
      t.title.toLowerCase().includes('newly hired') ||
      t.title.toLowerCase().includes('special needs') ||
      t.title.toLowerCase().includes('lecture hall reservation') ||
      t.title.toLowerCase().includes('rubric design') ||
      t.title.toLowerCase().includes('moderation committee') ||
      t.title.toLowerCase().includes('tasks allocation')
    );
    return isFall || tasks.length <= 15;
  });

  const filteredTasks = fallTasks.filter((task) => {
    if (statusFilter === 'due_soon') {
      const isUrgentDue = task.priority === 'urgent' && task.status !== 'done';
      return isUrgentDue;
    }
    if (statusFilter === 'in_progress') {
      return task.status === 'in_progress';
    }
    if (statusFilter === 'completed') {
      return task.status === 'done';
    }
    return true;
  }).filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      (task.assignee_name && task.assignee_name.toLowerCase().includes(q)) ||
      (task.comment_type && task.comment_type.toLowerCase().includes(q))
    );
  }).sort((a, b) => (Number(a.tr) || 99) - (Number(b.tr) || 99));

  return (
    <div className="weekly-report-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── OFFICIAL MSA HEADER BANNER (Matches Excel Sheet Banner) ── */}
      <div
        className="official-fall-header"
        style={{
          background: 'linear-gradient(135deg, #164e2e 0%, #1b4332 50%, #0f2e1e 100%)',
          borderRadius: '16px',
          padding: '24px 32px',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(22, 78, 46, 0.25), 0 2px 8px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        {/* Left: MSA University Crest */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.95)',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <img
              src="/logos/msa-university.jpeg"
              alt="MSA University"
              style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', color: '#fef08a', textTransform: 'uppercase' }}>
              October University for Modern Sciences and Arts
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '2px 0 0 0', color: '#ffffff' }}>
              Faculty of Biotechnology
            </h2>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fde047', letterSpacing: '0.01em' }}>
              Follow-Up Tasks — Fall 2026
            </div>
          </div>
        </div>

        {/* Right: Faculty Emblem and Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenCreateRequest}
            className="btn"
            style={{
              background: '#f59e0b',
              color: '#000000',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
            }}
          >
            <Plus size={16} />
            <span>New Form / File Request</span>
          </button>

          <button
            onClick={handlePrint}
            className="btn"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              cursor: 'pointer',
            }}
            title="Print Official Follow-Up Tasks Dossier"
          >
            <Printer size={16} />
            <span>Print Dossier</span>
          </button>

          <img
            src="/logos/faculty-of-biotechnology.jpeg"
            alt="Faculty Seal"
            style={{
              height: '52px',
              width: '52px',
              borderRadius: '50%',
              border: '2px solid #fde047',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </div>

      {/* ── OFFICIAL WEEKLY MEMO ANNOUNCEMENT CARD ── */}
      <div
        className="glass-card"
        style={{
          padding: '24px 28px',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          background: theme === 'dark'
            ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.25) 0%, rgba(15, 23, 42, 0.45) 100%)'
            : 'linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(240, 253, 250, 0.95) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', padding: '3px 10px', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                Official Weekly Tasks Directive
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Fall 2026 Academic Term</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Weekly Academic Tasks & Compliance Directive
            </h3>
          </div>

          {/* Action Buttons for Memo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleCopyMemo}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              {copiedMemo ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedMemo ? 'Memo Copied!' : 'Copy Announcement Text'}</span>
            </button>

            {onOpenEmailDispatch && (
              <button
                onClick={() => onOpenEmailDispatch(undefined, 'Faculty Directive: Weekly Tasks & Laboratory Tracker', weeklyMemoText)}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              >
                <Mail size={14} />
                <span>Dispatch Memo via Email</span>
              </button>
            )}
          </div>
        </div>

        {/* Memo Content Box */}
        <div
          style={{
            background: 'var(--bg-inset)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border)',
            fontSize: '0.92rem',
            lineHeight: 1.6,
            color: 'var(--text-main)',
            fontFamily: 'inherit',
          }}
        >
          <p style={{ margin: '0 0 14px 0', fontWeight: 600 }}>
            Dear Professors and Assisting Staff,
          </p>
          <p style={{ margin: '0 0 14px 0', fontWeight: 700, color: 'var(--text-main)' }}>
            Here is this Week Tasks:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            {/* Due Soon Item */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: theme === 'dark' ? 'rgba(239, 68, 68, 0.18)' : '#fee2e2',
                border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.4)' : '1.5px solid #fca5a5',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '0.975rem',
                color: theme === 'dark' ? '#fca5a5' : '#7f1d1d',
              }}
            >
              <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>🔴</div>
              <div>
                <strong style={{ color: theme === 'dark' ? '#f87171' : '#991b1b', display: 'block', marginBottom: '4px', fontSize: '1.05rem', fontWeight: 800 }}>
                  Due Soon:
                </strong>
                <div style={{ lineHeight: 1.5, fontWeight: 500 }}>
                  <strong style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>Submission of Special Needs Midterm and Final Exams:</strong> Prof. Amr Ageez due date Today 15th of October at 1:00 PM.
                </div>
              </div>
            </div>

            {/* In Progress Item */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: theme === 'dark' ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7',
                border: theme === 'dark' ? '1px solid rgba(245, 158, 11, 0.4)' : '1.5px solid #fcd34d',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontSize: '0.975rem',
                color: theme === 'dark' ? '#fde047' : '#78350f',
              }}
            >
              <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>🟡</div>
              <div>
                <strong style={{ color: theme === 'dark' ? '#fbbf24' : '#92400e', display: 'block', marginBottom: '4px', fontSize: '1.05rem', fontWeight: 800 }}>
                  In Progress:
                </strong>
                <div style={{ lineHeight: 1.5, fontWeight: 500 }}>
                  <strong style={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}>Newly Hired Staff Laboratory Tracker:</strong> Please Open the Tracker, Find your Name, and Update your Status or Add a Comment by Thursday.
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Google Sheets Link Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: theme === 'dark' ? 'rgba(16, 185, 129, 0.18)' : '#dcfce7',
              border: theme === 'dark' ? '1px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #86efac',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              marginTop: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileSpreadsheet size={26} color={theme === 'dark' ? '#34d399' : '#15803d'} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: theme === 'dark' ? '#6ee7b7' : '#166534' }}>
                  Live Google Sheets Laboratory Tracker
                </div>
                <div style={{ fontSize: '0.875rem', color: theme === 'dark' ? '#cbd5e1' : '#14532d', fontWeight: 500, marginTop: '2px' }}>
                  Update your status or add a comment directly on the sheet by Thursday.
                </div>
              </div>
            </div>
            <a
              href={TRACKER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: '0.9rem',
                padding: '8px 16px',
                background: theme === 'dark' ? '#10b981' : '#15803d',
                borderColor: theme === 'dark' ? '#10b981' : '#15803d',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <ExternalLink size={16} />
              <span>👉 Open Live Tracker Sheet</span>
            </a>
          </div>

          <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Thank you for your Cooperation.<br />
            <strong>Best Regards,</strong>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('all')}
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Tasks ({fallTasks.length})
          </button>
          <button
            onClick={() => setStatusFilter('due_soon')}
            className={`btn btn-sm ${statusFilter === 'due_soon' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>🔴 Due Soon</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              ({fallTasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length})
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`btn btn-sm ${statusFilter === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>🟡 In Progress</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              ({fallTasks.filter(t => t.status === 'in_progress').length})
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`btn btn-sm ${statusFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>🟢 Completed</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              ({fallTasks.filter(t => t.status === 'done').length})
            </span>
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search tasks, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* ── FOLLOW-UP TASKS SPREADSHEET MATRIX (Matches Excel View) ── */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ background: '#1b4332', color: '#ffffff', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', width: '40px', textAlign: 'center' }}>Tr</th>
                <th style={{ padding: '12px 16px', minWidth: '240px' }}>Task</th>
                <th style={{ padding: '12px 14px', width: '100px' }}>Priority</th>
                <th style={{ padding: '12px 16px', minWidth: '180px' }}>Task Owner</th>
                <th style={{ padding: '12px 14px', width: '120px' }}>Status</th>
                <th style={{ padding: '12px 14px', width: '110px' }}>Comment</th>
                <th style={{ padding: '12px 14px', width: '95px' }}>Start Date</th>
                <th style={{ padding: '12px 14px', width: '95px' }}>Due Date</th>
                <th style={{ padding: '12px 14px', width: '95px' }}>Due Time</th>
                <th style={{ padding: '12px 14px', width: '140px' }}>Received By</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', minWidth: '150px' }}>Actions / Privacy</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, idx) => {
                const trNum = task.tr || idx + 1;
                const isUrgent = task.priority === 'urgent';
                const isDone = task.status === 'done';
                const isInProgress = task.status === 'in_progress';
                const isConfidential = Boolean(task.is_confidential);
                const isCreator = currentUser?.id === task.assigned_by_id;
                const isAssignee = currentUser?.id === task.assigned_to_id;
                const canInspect = isCreator || currentUser?.role === 'admin' || currentUser?.id === 6496;

                return (
                  <tr
                    key={task.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: theme === 'dark' 
                        ? (idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.03)')
                        : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                    }}
                  >
                    {/* Tr */}
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {trNum}
                    </td>

                    {/* Task Title & Badges */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '4px', lineHeight: 1.4 }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {task.form_link && (
                          <span style={{ color: theme === 'dark' ? '#34d399' : '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileSpreadsheet size={14} /> Google Sheet Linked
                          </span>
                        )}
                        {task.submission_type === 'file_upload' && (
                          <span style={{ color: theme === 'dark' ? '#60a5fa' : '#1d4ed8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <UploadCloud size={14} /> Deliverable Upload
                          </span>
                        )}
                        {isConfidential && (
                          <span style={{ color: theme === 'dark' ? '#f87171' : '#b91c1c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={14} /> Confidential
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.825rem',
                          fontWeight: 800,
                          backgroundColor: isUrgent 
                            ? (theme === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2')
                            : (theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7'),
                          color: isUrgent 
                            ? (theme === 'dark' ? '#fca5a5' : '#991b1b')
                            : (theme === 'dark' ? '#fde047' : '#92400e'),
                          border: isUrgent 
                            ? (theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #fca5a5')
                            : (theme === 'dark' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #fcd34d'),
                        }}
                      >
                        {isUrgent ? 'Urgent' : 'Intermediate'}
                      </span>
                    </td>

                    {/* Task Owner */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {task.assignee_avatar ? (
                          <img
                            src={task.assignee_avatar}
                            alt=""
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.25)' : '#dbeafe',
                              color: theme === 'dark' ? '#93c5fd' : '#1d4ed8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                            }}
                          >
                            {task.assignee_name?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            {task.assignee_name || 'Unassigned'}
                          </div>
                          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {task.assignee_title || ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          fontSize: '0.825rem',
                          fontWeight: 800,
                          backgroundColor: isDone
                            ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7')
                            : isInProgress
                            ? (theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe')
                            : (theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : '#f1f5f9'),
                          color: isDone 
                            ? (theme === 'dark' ? '#6ee7b7' : '#166534')
                            : isInProgress 
                            ? (theme === 'dark' ? '#93c5fd' : '#1e40af')
                            : 'var(--text-secondary)',
                          border: isDone
                            ? (theme === 'dark' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #86efac')
                            : isInProgress
                            ? (theme === 'dark' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid #93c5fd')
                            : '1px solid var(--border)',
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: isDone ? '#10b981' : isInProgress ? '#3b82f6' : 'var(--text-secondary)',
                          }}
                        />
                        {isDone ? 'Completed' : isInProgress ? 'In progress' : 'Pending'}
                      </span>
                    </td>

                    {/* Comment */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontSize: '0.925rem', fontWeight: 600 }}>
                      {task.comment_type || 'Comment'}
                    </td>

                    {/* Start Date */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.925rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {task.start_date || (task.created_at ? new Date(task.created_at).toLocaleDateString() : '10/2/2026')}
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'm/d/yyyy'}
                    </td>

                    {/* Due Time */}
                    <td style={{ padding: '14px 16px', color: isUrgent && !isDone ? (theme === 'dark' ? '#f87171' : '#b91c1c') : 'var(--text-secondary)', fontSize: '0.925rem', fontWeight: isUrgent ? 800 : 600, whiteSpace: 'nowrap' }}>
                      {task.due_time || 'Not Specified'}
                    </td>

                    {/* Received By */}
                    <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontSize: '0.925rem', fontWeight: 600 }}>
                      {task.received_by || (isDone ? 'Prof. Dr. Gehan Safwat' : '—')}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        {/* If external link attached, provide quick jump */}
                        {task.form_link && (
                          <a
                            href={task.form_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
                            title="Open Google Sheet / Form"
                          >
                            <ExternalLink size={14} />
                            <span>Sheet</span>
                          </a>
                        )}

                        {/* If confidential and user is creator / leadership: inspect submissions */}
                        {isConfidential && canInspect && onOpenSubmissionsDrawer && (
                          <button
                            onClick={() => onOpenSubmissionsDrawer(task)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              fontWeight: 700,
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              color: theme === 'dark' ? '#f87171' : '#b91c1c',
                            }}
                            title="Inspect Submissions (Only visible to you)"
                          >
                            <Lock size={12} />
                            <span>Submissions</span>
                          </button>
                        )}

                        {/* Standard Details / Complete Button */}
                        <button
                          onClick={() => onOpenTaskDetails(task)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        >
                          {isAssignee && !isDone ? 'Submit' : 'View'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
