'use client';

import React, { useState, useMemo } from 'react';
import { Task, Hat, User } from '@/types';
import { isTaskOverdue, isTaskAwaitingDeanReview } from '@/lib/taskFilters';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Eye,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Shield,
  ShieldCheck,
  Layers,
  ArrowUpDown,
  Building2,
  FolderOpen
} from 'lucide-react';

interface TasksTableViewProps {
  tasks: Task[];
  hats: Hat[];
  currentUser: User | null;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onRequestDeanMeeting?: (task: Task) => void;
  onNewTaskClick: () => void;
  onOpenImportModal?: () => void;
  onDeanApprove?: (taskId: number, feedback?: string) => Promise<void> | void;
}

function formatDateToMDY(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const y = d.getFullYear();
    return `${m}/${day}/${y}`;
  } catch {
    return dateStr;
  }
}

export const TasksTableView: React.FC<TasksTableViewProps> = ({
  tasks,
  hats,
  currentUser,
  statusFilter = 'all',
  onStatusFilterChange,
  onSelectTask,
  onUpdateTask,
  onRequestDeanMeeting,
  onNewTaskClick,
  onOpenImportModal,
  onDeanApprove,
}) => {
  const [search, setSearch] = useState('');
  const [selectedHat, setSelectedHat] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(statusFilter || 'all');

  React.useEffect(() => {
    if (statusFilter !== undefined) {
      setSelectedStatus(statusFilter);
    }
  }, [statusFilter]);

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    if (onStatusFilterChange) {
      onStatusFilterChange(val);
    }
  };
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [sortField, setSortField] = useState<'tr' | 'deadline' | 'title' | 'status' | 'owner' | 'priority'>('tr');
  const [sortAsc, setSortAsc] = useState(true);

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

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.department) set.add(t.department);
      if (t.assignee_department) set.add(t.assignee_department);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Unique owners for filter
  const taskOwners = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.task_owner_name) set.add(t.task_owner_name);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Unique assignees for filter
  const taskAssignees = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.assignee_name) set.add(t.assignee_name);
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => {
      // 0. Privacy guard for normal members
      if (!isDean && currentUser) {
        const isRelated =
          t.assigned_to_id === currentUser.id ||
          t.task_owner_id === currentUser.id ||
          t.assigned_by_id === currentUser.id;
        if (!isRelated) return false;
      }

      // Hat Filter
      if (selectedHat !== 'all' && t.hat_id !== selectedHat) return false;

      // Status Filter
      if (selectedStatus === 'done' && t.status !== 'done') return false;
      if (selectedStatus === 'awaiting_dean' && !isTaskAwaitingDeanReview(t)) return false;
      if (selectedStatus === 'in_progress' && t.status !== 'in_progress') return false;
      if (selectedStatus === 'overdue' && !isTaskOverdue(t, now)) return false;
      if (selectedStatus === 'pending' && (t.status !== 'pending' || isTaskOverdue(t, now))) return false;
      if (selectedStatus === 'revision_requested' && t.status !== 'revision_requested') return false;

      // Dept Filter
      if (selectedDept !== 'all' && t.department !== selectedDept && t.assignee_department !== selectedDept) {
        return false;
      }

      // Priority Filter
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;

      // Owner Filter
      if (selectedOwner !== 'all' && t.task_owner_name !== selectedOwner) return false;

      // Assignee Filter
      if (selectedAssignee !== 'all' && t.assignee_name !== selectedAssignee) return false;

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = (t.title || '').toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchAssignee = (t.assignee_name || '').toLowerCase().includes(q);
        const matchOwner = (t.task_owner_name || '').toLowerCase().includes(q);
        const matchHat = (t.hat_name || '').toLowerCase().includes(q);
        const matchTr = t.tr ? String(t.tr).includes(q) : false;
        const matchNotes = (t.completion_notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAssignee && !matchOwner && !matchHat && !matchTr && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === 'tr') {
        cmp = (a.tr || 9999) - (b.tr || 9999);
      } else if (sortField === 'deadline') {
        const da = a.deadline ? new Date(a.deadline).getTime() : 0;
        const db = b.deadline ? new Date(b.deadline).getTime() : 0;
        cmp = da - db;
      } else if (sortField === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '');
      } else if (sortField === 'owner') {
        cmp = (a.task_owner_name || '').localeCompare(b.task_owner_name || '');
      } else if (sortField === 'priority') {
        const pOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        cmp = (pOrder[a.priority || 'medium'] || 2) - (pOrder[b.priority || 'medium'] || 2);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [tasks, isDean, currentUser, selectedHat, selectedStatus, selectedDept, selectedPriority, selectedOwner, selectedAssignee, search, sortField, sortAsc]);

  const handleExportSpreadsheet = () => {
    const headers = [
      'Tr',
      'Task',
      'Priority',
      'Task Owner',
      'Status',
      'Comment',
      'Start date',
      'Due date',
      'Due Time',
      'Received By',
      'Google Drive Link',
      'Attached File',
      'Action Plan'
    ];

    const rows = filteredTasks.map(t => [
      t.tr || t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      (t.priority || 'flexible').toUpperCase(),
      `"${(t.task_owner_name || 'Dean Office').replace(/"/g, '""')}"`,
      t.status.toUpperCase(),
      `"${(t.completion_notes || t.description || '').replace(/"/g, '""')}"`,
      formatDateToMDY(t.created_at || t.start_date),
      formatDateToMDY(t.deadline),
      t.due_time || 'Not Specified',
      `"${(t.received_by || 'Prof. Ashraf / Prof. Gehan Safwat').replace(/"/g, '""')}"`,
      `"${t.drive_link || ''}"`,
      `"${t.attachment_url || ''}"`,
      `"${(t.action_plan || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Faculty_of_Biotechnology_FollowUp_Tasks_Fall_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: 'tr' | 'deadline' | 'title' | 'status' | 'owner' | 'priority') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── 1. INSTITUTIONAL HEADER BANNER ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #072618 0%, #154734 50%, #0c3322 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid #1e6b4c',
          boxShadow: '0 8px 24px rgba(7, 38, 24, 0.45)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left: MSA University Crest & Typography */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1f6b4a 0%, #0e3f2b 100%)',
              border: '2px solid #eab308',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              flexShrink: 0
            }}
          >
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fde047', lineHeight: 1 }}>MSA</span>
            <span style={{ fontSize: '0.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>BIO</span>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px', color: '#fde047', textTransform: 'uppercase' }}>
              October University for Modern Sciences and Arts
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600 }}>
              جامعة أكتوبر للعلوم الحديثة والآداب • كلية التكنولوجيا الحيوية
            </div>
          </div>
        </div>

        {/* Center: Faculty Title */}
        <div style={{ textAlign: 'center', zIndex: 1, padding: '0 16px' }}>
          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 900,
              margin: 0,
              color: '#ffffff',
              letterSpacing: '0.5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <span>Faculty Tasks & Operational Directives</span>
          </h2>
          <div style={{ fontSize: '0.78rem', color: '#86efac', fontWeight: 600, marginTop: '3px' }}>
            Interactive Directives Matrix with Color-Coded Priorities & Cloud Deliverables
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
          {onOpenImportModal && isDean && (
            <button
              onClick={onOpenImportModal}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700 }}
              title="Paste cells directly from Excel or import CSV"
            >
              <FileSpreadsheet size={14} style={{ color: '#10b981' }} />
              <span>Import / Sync Excel</span>
            </button>
          )}

          <button
            onClick={handleExportSpreadsheet}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700 }}
            title="Download visible tasks as Excel CSV"
          >
            <Download size={14} />
            <span>Export (.csv)</span>
          </button>

          <button
            onClick={onNewTaskClick}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#154734', borderColor: '#1e6b4c' }}
          >
            <Plus size={14} />
            <span>Upload Task</span>
          </button>
        </div>
      </div>

      {/* ── 2. FILTER & SEARCH CONTROL BAR ── */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          borderRadius: '14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', gridColumn: 'span 2' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search tasks by title, owner, assignee, or TR#..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '0.86rem', height: '38px' }}
          />
        </div>

        {/* Hat Filter */}
        <div>
          <select
            className="form-input"
            value={selectedHat}
            onChange={(e) => setSelectedHat(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={{ fontSize: '0.84rem', height: '38px' }}
          >
            <option value="all">🎩 All Faculty Hats ({hats.length})</option>
            {hats.map(h => (
              <option key={h.id} value={h.id}>
                {h.icon || '🎓'} {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            className="form-input"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{ fontSize: '0.84rem', height: '38px' }}
          >
            <option value="all">🎯 All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🔵 Intermediate</option>
            <option value="medium">🟢 Flexible</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            className="form-input"
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              fontSize: '0.84rem',
              height: '38px',
              borderColor: selectedStatus !== 'all' ? 'var(--accent-blue)' : undefined,
              backgroundColor: selectedStatus !== 'all' ? 'rgba(37, 99, 235, 0.08)' : undefined,
              fontWeight: selectedStatus !== 'all' ? 700 : 500,
            }}
          >
            <option value="all">⚡ All Statuses</option>
            <option value="done">🟢 Completed / Verified</option>
            <option value="awaiting_dean">⏳ Awaiting Dean Review</option>
            <option value="in_progress">🟡 In Progress</option>
            <option value="overdue">🔴 Overdue</option>
            <option value="pending">⚪ Pending Action</option>
            <option value="revision_requested">🔄 Needs Revision</option>
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <select
            className="form-input"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{ fontSize: '0.84rem', height: '38px' }}
          >
            <option value="all">🏢 All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Task Owner Filter */}
        <div>
          <select
            className="form-input"
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            style={{ fontSize: '0.84rem', height: '38px' }}
          >
            <option value="all">👑 All Task Owners ({taskOwners.length})</option>
            {taskOwners.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Assigned Staff Filter */}
        <div>
          <select
            className="form-input"
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            style={{
              fontSize: '0.84rem',
              height: '38px',
              borderColor: selectedAssignee !== 'all' ? 'var(--accent-blue)' : undefined,
              backgroundColor: selectedAssignee !== 'all' ? 'rgba(37, 99, 235, 0.08)' : undefined,
              fontWeight: selectedAssignee !== 'all' ? 700 : 500,
            }}
          >
            <option value="all">👤 All Assigned Staff ({taskAssignees.length})</option>
            {taskAssignees.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {(selectedHat !== 'all' || selectedStatus !== 'all' || selectedDept !== 'all' || selectedPriority !== 'all' || selectedOwner !== 'all' || selectedAssignee !== 'all' || search) && (
          <div>
            <button
              onClick={() => {
                setSelectedHat('all');
                handleStatusChange('all');
                setSelectedDept('all');
                setSelectedPriority('all');
                setSelectedOwner('all');
                setSelectedAssignee('all');
                setSearch('');
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', height: '38px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ── 3. MODERN COLOR-CODED TASKS TABLE (GENEROUS SPACING & GOOD TYPOGRAPHY) ── */}
      <div
        className="glass-card"
        style={{
          padding: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        {/* Count summary bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <div>
            {selectedAssignee !== 'all' ? (
              <span>
                Tasks assigned to <strong style={{ color: 'var(--text-main)' }}>{selectedAssignee}</strong>: <strong style={{ color: 'var(--accent-blue)' }}>{filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}</strong>
              </span>
            ) : search.trim() || selectedHat !== 'all' || selectedStatus !== 'all' || selectedDept !== 'all' || selectedPriority !== 'all' || selectedOwner !== 'all' ? (
              <span>
                Showing <strong style={{ color: 'var(--text-main)' }}>{filteredTasks.length}</strong> matching task{filteredTasks.length === 1 ? '' : 's'} <span style={{ color: 'var(--text-muted)' }}>({tasks.length} total across all staff)</span>
              </span>
            ) : (
              <span>
                Total Directives: <strong style={{ color: 'var(--text-main)' }}>{tasks.length}</strong> active tasks
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span>Urgent</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
              <span>Intermediate</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>Flexible</span>
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.88rem',
              textAlign: 'left'
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--bg-inset)',
                  borderBottom: '2px solid var(--border)',
                  userSelect: 'none'
                }}
              >
                {/* TR */}
                <th
                  onClick={() => handleSort('tr')}
                  style={{
                    padding: '14px 16px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    width: '75px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Sort by TR Number"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>TR #</span>
                    {sortField === 'tr' && <ArrowUpDown size={12} />}
                  </div>
                </th>

                {/* Task Directive */}
                <th
                  onClick={() => handleSort('title')}
                  style={{
                    padding: '14px 18px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    minWidth: '280px',
                  }}
                  title="Sort by Task Title"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Task Directive & Focus Area</span>
                    {sortField === 'title' && <ArrowUpDown size={12} />}
                  </div>
                </th>

                {/* Priority */}
                <th
                  onClick={() => handleSort('priority')}
                  style={{
                    padding: '14px 16px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    width: '130px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Sort by Priority"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Priority</span>
                    {sortField === 'priority' && <ArrowUpDown size={12} />}
                  </div>
                </th>

                {/* Status */}
                <th
                  onClick={() => handleSort('status')}
                  style={{
                    padding: '14px 16px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    width: '145px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Sort by Status"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Status</span>
                    {sortField === 'status' && <ArrowUpDown size={12} />}
                  </div>
                </th>

                {/* Faculty Hat */}
                <th
                  style={{
                    padding: '14px 16px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    minWidth: '160px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Faculty Hat (Category)
                </th>

                {/* Task Owner */}
                <th
                  onClick={() => handleSort('owner')}
                  style={{
                    padding: '14px 16px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    minWidth: '160px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Sort by Task Owner"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Task Owner (Lead)</span>
                    {sortField === 'owner' && <ArrowUpDown size={12} />}
                  </div>
                </th>

                {/* Assignee */}
                <th
                  style={{
                    padding: '14px 16px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    minWidth: '170px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Responsible Staff
                </th>

                {/* Deadline & Time */}
                <th
                  onClick={() => handleSort('deadline')}
                  style={{
                    padding: '14px 16px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    minWidth: '150px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Sort by Deadline"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Deadline & Time</span>
                    {sortField === 'deadline' && <ArrowUpDown size={12} />}
                  </div>
                </th>

                {/* Deliverables / Cloud */}
                <th
                  style={{
                    padding: '14px 16px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    minWidth: '160px',
                  }}
                >
                  Deliverables & Drive
                </th>

                {/* Actions */}
                <th
                  style={{
                    padding: '14px 16px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    textAlign: 'right',
                    minWidth: '190px',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📂</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>No Tasks Match Your Active Filters</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>Try resetting your search query or switching to All Hats.</div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => {
                  const now = new Date();
                  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
                  const isOverdue = deadlineDate !== null && deadlineDate < now && task.status !== 'done';

                  // Explicit Color-Coded Priority Badges
                  let priorityBadge = (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <span>🟢</span>
                      <span>Flexible</span>
                    </span>
                  );

                  if (task.priority === 'urgent') {
                    priorityBadge = (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.35)'
                        }}
                      >
                        <span>🔴</span>
                        <span>Urgent</span>
                      </span>
                    );
                  } else if (task.priority === 'high' || (task.priority as string) === 'intermediate') {
                    priorityBadge = (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.35)'
                        }}
                      >
                        <span>🔵</span>
                        <span>Intermediate</span>
                      </span>
                    );
                  }

                  // Explicit Color-Coded Status Badges
                  let statusBadge = (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.35)'
                      }}
                    >
                      <Clock size={13} />
                      <span>Pending</span>
                    </span>
                  );

                  if (task.status === 'done') {
                    if (task.dean_acknowledged === 1) {
                      statusBadge = (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '999px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              backgroundColor: 'rgba(34, 197, 94, 0.16)',
                              color: '#16a34a',
                              border: '1.5px solid rgba(34, 197, 94, 0.45)',
                              width: 'fit-content'
                            }}
                          >
                            <CheckCircle2 size={14} />
                            <span>Completed</span>
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={13} />
                            <span>Approved by Dean</span>
                          </span>
                        </div>
                      );
                    } else {
                      statusBadge = (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 12px',
                              borderRadius: '999px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              backgroundColor: 'rgba(245, 158, 11, 0.14)',
                              color: '#d97706',
                              border: '1.5px solid rgba(245, 158, 11, 0.45)',
                              width: 'fit-content'
                            }}
                          >
                            <Clock size={14} />
                            <span>Completed</span>
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span>⏳ Awaiting Dean Approval</span>
                          </span>
                        </div>
                      );
                    }
                  } else if (isOverdue) {
                    statusBadge = (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(239, 68, 68, 0.14)',
                          color: '#dc2626',
                          border: '1.5px solid rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        <AlertTriangle size={14} />
                        <span>Overdue</span>
                      </span>
                    );
                  } else if (task.status === 'in_progress') {
                    statusBadge = (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(59, 130, 246, 0.14)',
                          color: '#2563eb',
                          border: '1.5px solid rgba(59, 130, 246, 0.4)'
                        }}
                      >
                        <Clock size={14} />
                        <span>In Progress</span>
                      </span>
                    );
                  } else if (task.status === 'revision_requested') {
                    statusBadge = (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '999px',
                            fontSize: '0.82rem',
                            fontWeight: 800,
                            backgroundColor: 'rgba(139, 92, 246, 0.14)',
                            color: '#7c3aed',
                            border: '1.5px solid rgba(139, 92, 246, 0.4)',
                            width: 'fit-content'
                          }}
                        >
                          <RotateCcw size={14} />
                          <span>Needs Revision</span>
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7c3aed' }}>
                          <span>🔄 Mandated by Dean</span>
                        </span>
                      </div>
                    );
                  }

                  // Relative deadline warning
                  let deadlineWarning = null;
                  if (deadlineDate && task.status !== 'done') {
                    const diffHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                    if (diffHours < 0) {
                      deadlineWarning = <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.72rem' }}>⚠️ Overdue</span>;
                    } else if (diffHours <= 24) {
                      deadlineWarning = <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.72rem' }}>⏳ Due Today</span>;
                    } else if (diffHours <= 72) {
                      deadlineWarning = <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.72rem' }}>🗓️ In 3 Days</span>;
                    }
                  }

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        borderBottom: '1px solid var(--border)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover, rgba(59, 130, 246, 0.06))')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)')}
                    >
                      {/* TR Number */}
                      <td style={{ padding: '16px', fontWeight: 800, color: 'var(--accent-blue)', fontSize: '0.88rem' }}>
                        {task.tr ? `TR-${String(task.tr).padStart(2, '0')}` : `#${task.id}`}
                      </td>

                      {/* Task Directive with High-Contrast Clear Font */}
                      <td style={{ padding: '16px 18px', maxWidth: '340px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.98rem', lineHeight: 1.4 }}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.35,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '320px'
                            }}>
                              {task.description}
                            </span>
                          )}
                          {task.is_confidential === 1 && (
                            <span style={{ width: 'fit-content', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontWeight: 800 }}>
                              🔒 Confidential
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority (Stated Color Codes) */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        {priorityBadge}
                      </td>

                      {/* Status (Stated Color Codes) */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        {statusBadge}
                      </td>

                      {/* Faculty Hat */}
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(139, 92, 246, 0.12)',
                            color: task.hat_color || '#a855f7',
                            border: `1px solid ${task.hat_color ? `${task.hat_color}40` : 'rgba(139, 92, 246, 0.3)'}`,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span>{task.hat_icon || '🎓'}</span>
                          <span>{task.hat_name || 'General'}</span>
                        </span>
                      </td>

                      {/* Task Owner */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {task.task_owner_name || 'Dean Office'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                          👑 Task Leader
                        </div>
                      </td>

                      {/* Responsible Staff */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--accent-blue)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.76rem',
                              flexShrink: 0
                            }}
                          >
                            {(task.assignee_name || 'U').charAt(0)}
                          </div>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {task.assignee_name || 'Unassigned'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {task.assignee_department || task.department || 'Academic Staff'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Deadline & Time */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isOverdue ? '#ef4444' : 'var(--text-main)' }}>
                          {formatDateToMDY(task.deadline)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          {task.due_time && task.due_time !== 'Not Specified' && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                              ⏰ {task.due_time}
                            </span>
                          )}
                          {deadlineWarning}
                        </div>
                      </td>

                      {/* Deliverables & Drive */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {task.drive_link ? (
                            <a
                              href={task.drive_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                color: '#10b981',
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                width: 'fit-content'
                              }}
                              title="Google Drive Folder (Unlimited file size upload)"
                            >
                              <FolderOpen size={12} />
                              <span>Google Drive</span>
                              <ExternalLink size={10} />
                            </a>
                          ) : null}

                          {task.attachment_url && (
                            <a
                              href={task.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                color: 'var(--accent-blue)',
                                textDecoration: 'none',
                                fontWeight: 700
                              }}
                            >
                              <FileText size={12} />
                              <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {task.attachment_name || 'Deliverable'}
                              </span>
                            </a>
                          )}

                          {!task.drive_link && !task.attachment_url && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              None uploaded
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => onSelectTask(task)}
                            style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 }}
                            title="Inspect details & action plan"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => onUpdateTask(task)}
                            style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700 }}
                            title="Update status, submit notes, or attach files"
                          >
                            <span>Update</span>
                          </button>

                          {/* Dean Approval Quick Action or Approved Status */}
                          {task.dean_acknowledged === 1 ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                              }}
                              title="Officially approved by Dean Prof. Dr. Gehan Safwat"
                            >
                              <ShieldCheck size={12} />
                              <span>Approved</span>
                            </span>
                          ) : isDean && task.status === 'done' && onDeanApprove ? (
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => onDeanApprove(task.id, 'Approved by Dean Prof. Dr. Gehan Safwat')}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                backgroundColor: '#10b981',
                                borderColor: '#10b981',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="One-click Dean Approval for this completed deliverable"
                            >
                              <ShieldCheck size={13} />
                              <span>✅ Approve</span>
                            </button>
                          ) : null}

                          {onRequestDeanMeeting && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => onRequestDeanMeeting(task)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                backgroundColor: isDean ? 'rgba(37, 99, 235, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                borderColor: isDean ? 'rgba(37, 99, 235, 0.3)' : 'rgba(234, 179, 8, 0.3)',
                                color: isDean ? '#2563eb' : '#eab308'
                              }}
                              title={isDean ? `Schedule meeting with ${task.assignee_name || 'assignee'} regarding this task` : "Request meeting with Prof. Gehan Safwat regarding this task"}
                            >
                              <span>{isDean ? "📅 Meet Assignee" : "📅 Meet Dean"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
