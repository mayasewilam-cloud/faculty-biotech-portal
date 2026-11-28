'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Task, Hat, User } from '@/types';
import { isTaskOverdue, isTaskAwaitingDeanReview, isUserAssignedToTask, parseAssignedMembers } from '@/lib/taskFilters';
import { FALL_2026_CATEGORIES } from '@/lib/fall_2026_categories';
import { ManageAssigneesModal } from '@/components/modals/ManageAssigneesModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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
  FolderOpen,
  RefreshCw,
  Trash2,
  UserMinus
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
  allUsers?: any[];
  onRefreshTasks?: () => void;
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
  allUsers = [],
  onRefreshTasks,
}) => {
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

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'my_tasks' | 'supervising' | 'all_tasks'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('faculty_scope_filter');
      if (saved === 'my_tasks' || saved === 'supervising' || saved === 'all_tasks') return saved;
    }
    return isDean ? 'all_tasks' : 'my_tasks';
  });

  // Leadership always views 'all_tasks' so college directives are never hidden
  useEffect(() => {
    if (isDean) {
      setScopeFilter('all_tasks');
    }
  }, [isDean]);
  const [manageAssigneesTask, setManageAssigneesTask] = useState<Task | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(statusFilter || 'all');
  const [localSyncing, setLocalSyncing] = useState(false);

  const handleSyncSheet = async () => {
    try {
      setLocalSyncing(true);
      const res = await fetch('/api/tasks/sync-sheet', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.message && data.message.includes('standalone')) {
          alert(data.message);
        }
        if (onRefreshTasks) onRefreshTasks();
        else window.location.reload();
      } else {
        alert(data.error || 'Notice: Google Sheet is unconfigured. All portal tasks are safely maintained locally.');
      }
    } catch (err: any) {
      alert('Notice: Operating in offline mode. All tasks preserved locally.');
    } finally {
      setLocalSyncing(false);
    }
  };

  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'delete' | 'leave';
    taskId: number;
    title: string;
  } | null>(null);

  const handleQuickMarkDone = async (taskId: number) => {
    if (busyTaskId === taskId) return;
    setBusyTaskId(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done', completion_notes: 'Marked completed directly from portal' }),
      });
      if (res.ok) {
        alert('Task marked as Done!');
        if (onRefreshTasks) onRefreshTasks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleQuickDeleteTask = (taskId: number, title: string) => {
    setConfirmState({ isOpen: true, type: 'delete', taskId, title });
  };

  const handleQuickLeaveTask = (taskId: number, title: string) => {
    setConfirmState({ isOpen: true, type: 'leave', taskId, title });
  };

  const executeConfirmedAction = async () => {
    if (!confirmState) return;
    const { type, taskId } = confirmState;
    setBusyTaskId(taskId);
    try {
      if (type === 'delete') {
        const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete task');
        alert('Task deleted successfully.');
      } else {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'leave_task' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to leave task');
        alert('You removed yourself from this task.');
      }
      setConfirmState(null);
      if (onRefreshTasks) onRefreshTasks();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleSaveAssignees = async (taskId: number, newMembers: string[]) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_members: newMembers,
        }),
      });
      if (!res.ok) throw new Error('Failed to update task assignees');
      if (onRefreshTasks) onRefreshTasks();
    } catch (err: any) {
      alert(err.message || 'Error updating assignees');
    }
  };

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [openRowMenuId, setOpenRowMenuId] = useState<number | null>(null);
  const [groupTeamTasks, setGroupTeamTasks] = useState<boolean>(isDean);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  // Persist active filters in sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedStatus = sessionStorage.getItem('faculty_status_filter');
      const savedCat = sessionStorage.getItem('faculty_category_filter');
      const savedPri = sessionStorage.getItem('faculty_priority_filter');
      const savedSearch = sessionStorage.getItem('faculty_search_filter');
      if (savedStatus && !statusFilter) setSelectedStatus(savedStatus);
      if (savedCat) setSelectedCategory(savedCat);
      if (savedPri) setSelectedPriority(savedPri);
      if (savedSearch) setSearch(savedSearch);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('faculty_scope_filter', scopeFilter);
      sessionStorage.setItem('faculty_status_filter', selectedStatus);
      sessionStorage.setItem('faculty_category_filter', selectedCategory);
      sessionStorage.setItem('faculty_priority_filter', selectedPriority);
      sessionStorage.setItem('faculty_search_filter', search);
    } catch {}
  }, [scopeFilter, selectedStatus, selectedCategory, selectedPriority, search]);

  // Compute multi-member group progress (X / Y Done)
  const groupProgressMap = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const t of tasks) {
      if (!t.group_id) continue;
      const cur = map.get(t.group_id) || { total: 0, done: 0 };
      cur.total += 1;
      if (t.status === 'done') cur.done += 1;
      map.set(t.group_id, cur);
    }
    return map;
  }, [tasks]);

  const activeAdvancedFilterCount = [
    selectedCategory !== 'all',
    selectedPriority !== 'all',
    selectedDept !== 'all',
    selectedOwner !== 'all',
    selectedAssignee !== 'all',
  ].filter(Boolean).length;

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
      // 0. Scope filter: Assigned to Me vs Supervising/Dispatched vs All Faculty
      if (scopeFilter === 'my_tasks' && currentUser) {
        if (!isUserAssignedToTask(t, currentUser)) return false;
      } else if (scopeFilter === 'supervising' && currentUser) {
        const isSup = t.assigned_by_id === currentUser.id || t.task_owner_id === currentUser.id;
        if (!isSup) return false;
      }

      // Category Filter (Fall 2026 Categories)
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

      // Status Filter
      if (selectedStatus === 'done' && t.status !== 'done') return false;
      if (selectedStatus === 'awaiting_dean' && !isTaskAwaitingDeanReview(t)) return false;
      if (selectedStatus === 'in_progress' && t.status !== 'in_progress') return false;
      if (selectedStatus === 'overdue' && !isTaskOverdue(t, now)) return false;
      if (selectedStatus === 'due_today') {
        if (t.status === 'done' || !t.deadline) return false;
        const d = new Date(t.deadline);
        if (d.toDateString() !== now.toDateString()) return false;
      }
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
        const matchCategory = (t.category || '').toLowerCase().includes(q);
        const matchMembers = parseAssignedMembers(t.assigned_members).some((m: string) => m.toLowerCase().includes(q));
        const matchTr = t.tr ? String(t.tr).includes(q) : false;
        const matchNotes = (t.completion_notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAssignee && !matchOwner && !matchCategory && !matchMembers && !matchTr && !matchNotes) {
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
  }, [tasks, isDean, currentUser, scopeFilter, selectedCategory, selectedStatus, selectedDept, selectedPriority, selectedOwner, selectedAssignee, search, sortField, sortAsc]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTasks.length, scopeFilter, selectedCategory, selectedStatus, selectedDept, selectedPriority, selectedOwner, selectedAssignee, search]);

  // Consolidate parallel group_id tasks into 1 row when Group Team Tasks is enabled (Dean/Supervising)
  const groupedChildrenMap = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filteredTasks) {
      if (!t.group_id) continue;
      const arr = map.get(t.group_id) || [];
      arr.push(t);
      map.set(t.group_id, arr);
    }
    return map;
  }, [filteredTasks]);

  const displayTasks = useMemo(() => {
    if (!groupTeamTasks || scopeFilter === 'my_tasks') return filteredTasks;
    const seenGroups = new Set<string>();
    const out: Task[] = [];
    for (const t of filteredTasks) {
      if (t.group_id && (groupedChildrenMap.get(t.group_id)?.length || 0) > 1) {
        if (seenGroups.has(t.group_id)) continue;
        seenGroups.add(t.group_id);
      }
      out.push(t);
    }
    return out;
  }, [filteredTasks, groupTeamTasks, scopeFilter, groupedChildrenMap]);

  const quickChipCounts = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    let overdue = 0;
    let dueToday = 0;
    let awaiting = 0;
    for (const t of tasks) {
      if (scopeFilter === 'my_tasks' && currentUser && !isUserAssignedToTask(t, currentUser)) continue;
      if (isTaskOverdue(t, now)) overdue++;
      if (t.status !== 'done' && t.deadline && new Date(t.deadline).toDateString() === todayStr) dueToday++;
      if (isTaskAwaitingDeanReview(t)) awaiting++;
    }
    return { overdue, dueToday, awaiting };
  }, [tasks, scopeFilter, currentUser]);

  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(displayTasks.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedTasks = useMemo(() => {
    if (pageSize === 0) return displayTasks;
    const start = (safePage - 1) * pageSize;
    return displayTasks.slice(start, start + pageSize);
  }, [displayTasks, safePage, pageSize]);

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

        {/* Center-Right: 3-Way Scope Toggle (Assigned to Me / Supervising / All Faculty) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', zIndex: 1, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setScopeFilter('my_tasks')}
            className={`btn btn-sm ${scopeFilter === 'my_tasks' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 800, padding: '7px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <span>👤 Assigned to Me</span>
            <span style={{ padding: '1px 6px', borderRadius: '999px', fontSize: '0.7rem', backgroundColor: scopeFilter === 'my_tasks' ? 'rgba(255,255,255,0.25)' : 'rgba(59,130,246,0.15)', color: scopeFilter === 'my_tasks' ? '#fff' : 'var(--accent-blue)' }}>
              {tasks.filter(t => isUserAssignedToTask(t, currentUser)).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter('supervising')}
            className={`btn btn-sm ${scopeFilter === 'supervising' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 800, padding: '7px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
          >
            <span>📋 Supervising</span>
            <span style={{ padding: '1px 6px', borderRadius: '999px', fontSize: '0.7rem', backgroundColor: scopeFilter === 'supervising' ? 'rgba(255,255,255,0.25)' : 'rgba(59,130,246,0.15)', color: scopeFilter === 'supervising' ? '#fff' : 'var(--accent-blue)' }}>
              {tasks.filter(t => currentUser && (t.assigned_by_id === currentUser.id || t.task_owner_id === currentUser.id)).length}
            </span>
          </button>

          {isDean && (
            <button
              type="button"
              onClick={() => setScopeFilter('all_tasks')}
              className={`btn btn-sm ${scopeFilter === 'all_tasks' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontWeight: 800, padding: '7px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
            >
              <span>🌐 All Faculty</span>
              <span style={{ padding: '1px 6px', borderRadius: '999px', fontSize: '0.7rem', backgroundColor: scopeFilter === 'all_tasks' ? 'rgba(255,255,255,0.25)' : 'rgba(59,130,246,0.15)', color: scopeFilter === 'all_tasks' ? '#fff' : 'var(--accent-blue)' }}>
                {tasks.length}
              </span>
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
          <button
            onClick={handleSyncSheet}
            disabled={localSyncing}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              color: '#10b981',
            }}
            title="Fetch live directives directly from Google Sheet"
          >
            <RefreshCw size={14} className={localSyncing ? 'animate-spin' : ''} />
            <span>{localSyncing ? 'Syncing...' : 'Sync Google Sheet'}</span>
          </button>
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
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search tasks by title, coordinator, assignee, or TR#..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '0.86rem', height: '38px', width: '100%' }}
            />
          </div>

          <select
            className="form-input"
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              fontSize: '0.84rem',
              height: '38px',
              width: 'auto',
              minWidth: '205px',
              borderColor: selectedStatus !== 'all' ? 'var(--accent-blue)' : undefined,
              backgroundColor: selectedStatus !== 'all' ? 'rgba(37, 99, 235, 0.08)' : undefined,
              fontWeight: selectedStatus !== 'all' ? 700 : 500,
            }}
          >
            <option value="all">⚡ All Statuses</option>
            <option value="done">🟢 Completed / Verified</option>
            <option value="awaiting_dean">⏳ Submitted (Pending Sign-Off)</option>
            <option value="in_progress">🟡 In Progress</option>
            <option value="overdue">🔴 Overdue</option>
            <option value="due_today">📅 Due Today</option>
            <option value="pending">⚪ Pending Action</option>
            <option value="revision_requested">🔄 Revision Requested</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowMoreFilters((v) => !v)}
            style={{
              height: '38px',
              padding: '0 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: activeAdvancedFilterCount > 0 ? 'var(--accent-blue)' : undefined,
            }}
          >
            <Filter size={14} />
            <span>More Filters{activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''}</span>
            {showMoreFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedDept !== 'all' || selectedPriority !== 'all' || selectedOwner !== 'all' || selectedAssignee !== 'all' || search) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                handleStatusChange('all');
                setSelectedDept('all');
                setSelectedPriority('all');
                setSelectedOwner('all');
                setSelectedAssignee('all');
                setSearch('');
              }}
              className="btn btn-secondary btn-sm"
              style={{ height: '38px', padding: '0 12px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Reset
            </button>
          )}
        </div>

        {/* 1-Click Quick Filter Chips + Group Team Tasks Toggle */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleStatusChange(selectedStatus === 'overdue' ? 'all' : 'overdue')}
              className="btn btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: '0.76rem',
                fontWeight: 700,
                borderRadius: '999px',
                backgroundColor: selectedStatus === 'overdue' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                color: '#f87171',
              }}
            >
              🔴 Overdue ({quickChipCounts.overdue})
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(selectedStatus === 'due_today' ? 'all' : 'due_today')}
              className="btn btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: '0.76rem',
                fontWeight: 700,
                borderRadius: '999px',
                backgroundColor: selectedStatus === 'due_today' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.08)',
                borderColor: 'rgba(59, 130, 246, 0.35)',
                color: '#60a5fa',
              }}
            >
              📅 Due Today ({quickChipCounts.dueToday})
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(selectedStatus === 'awaiting_dean' ? 'all' : 'awaiting_dean')}
              className="btn btn-sm"
              style={{
                padding: '4px 10px',
                fontSize: '0.76rem',
                fontWeight: 700,
                borderRadius: '999px',
                backgroundColor: selectedStatus === 'awaiting_dean' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.08)',
                borderColor: 'rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
              }}
            >
              ⏳ Pending Sign-Off ({quickChipCounts.awaiting})
            </button>
          </div>

          {scopeFilter !== 'my_tasks' && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={groupTeamTasks}
                onChange={(e) => setGroupTeamTasks(e.target.checked)}
              />
              <span>Group Multi-Member Directives</span>
            </label>
          )}
        </div>

        {showMoreFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>


        {/* Academic Category Filter (Fall 2026) */}
        <div>
          <select
            className="form-input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ fontSize: '0.84rem', height: '38px' }}
          >
            <option value="all">📂 All Academic Categories ({FALL_2026_CATEGORIES.length})</option>
            {FALL_2026_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
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
            ) : search.trim() || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedDept !== 'all' || selectedPriority !== 'all' || selectedOwner !== 'all' ? (
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

        <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
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

                {/* Academic Category */}
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
                  Academic Category
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
                    <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>Try resetting your search query or switching to All Categories.</div>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task, idx) => {
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
                    <React.Fragment key={task.id}>
                    <tr
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

                      {/* Academic Category */}
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '999px',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--accent-blue)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span>📂</span>
                          <span>{task.category || 'General Directive'}</span>
                        </span>
                      </td>

                      {/* Task Owner */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                          {task.task_owner_name || 'Dean Office'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                          👑 Lead / Coordinator
                        </div>
                      </td>

                      {/* Responsible Staff */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

                          {/* Team Progress Pill & Expandable Team Breakdown */}
                          {task.group_id && groupProgressMap.get(task.group_id) && groupProgressMap.get(task.group_id)!.total > 1 && (() => {
                            const gp = groupProgressMap.get(task.group_id!)!;
                            const allDone = gp.done === gp.total;
                            const isExpanded = expandedGroupIds.has(task.group_id!);
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  width: 'fit-content',
                                  backgroundColor: allDone ? 'rgba(16, 185, 129, 0.14)' : 'rgba(59, 130, 246, 0.12)',
                                  color: allDone ? '#10b981' : '#60a5fa',
                                  border: allDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                                }}>
                                  Team: {gp.done} / {gp.total} Done
                                </span>
                                {groupTeamTasks && scopeFilter !== 'my_tasks' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedGroupIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(task.group_id!)) next.delete(task.group_id!);
                                        else next.add(task.group_id!);
                                        return next;
                                      });
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: '1px solid var(--border)',
                                      borderRadius: '6px',
                                      padding: '1px 7px',
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      color: 'var(--accent-blue)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {isExpanded ? 'Hide Team ▲' : `View Team (${gp.total}) ▼`}
                                  </button>
                                )}
                              </div>
                            );
                          })()}

                          {/* Multiple Assigned Members Pills */}
                          {(() => {
                            const membersList = parseAssignedMembers(task.assigned_members);
                            if (membersList.length === 0) return null;
                            return (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
                                {membersList.map((member, mIdx) => (
                                  <span
                                    key={mIdx}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '1px 6px',
                                      borderRadius: '999px',
                                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                      color: 'var(--text-main)',
                                      border: '1px solid rgba(59, 130, 246, 0.25)',
                                      fontWeight: 600,
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {member}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Quick Team Management Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setManageAssigneesTask(task);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, width: 'fit-content' }}
                            title="Add or remove team members for this task"
                          >
                            <span>👥 Edit Team ({parseAssignedMembers(task.assigned_members).length || 1})</span>
                          </button>
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
                          {task.google_form_url ? (
                            <a
                              href={task.google_form_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 9px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(99, 102, 241, 0.16)',
                                border: '1px solid rgba(99, 102, 241, 0.4)',
                                color: '#818cf8',
                                textDecoration: 'none',
                                fontWeight: 800,
                                fontSize: '0.76rem',
                                width: 'fit-content'
                              }}
                              title="Open Google Form for this Task"
                            >
                              <span>📝 Open Google Form</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : null}
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
                      <td style={{ padding: '16px', textAlign: 'right', position: 'relative' }}>
                        <div
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}
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

                          {/* Quick Mark Done for Dean or Task Owner */}
                          {task.status !== 'done' && (isDean || currentUser?.id === task.assigned_to_id || currentUser?.id === task.task_owner_id || currentUser?.full_name === task.task_owner_name) && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              disabled={busyTaskId === task.id}
                              onClick={() => handleQuickMarkDone(task.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                borderColor: 'rgba(16, 185, 129, 0.3)',
                                color: '#10b981',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Mark Done directly in portal"
                            >
                              <CheckCircle2 size={12} />
                              <span>Done</span>
                            </button>
                          )}

                          {/* Compact More Actions Menu (Leave / Delete) */}
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setOpenRowMenuId((prev) => (prev === task.id ? null : task.id))}
                              style={{ padding: '4px 8px', fontSize: '0.82rem', fontWeight: 800 }}
                              title="More task actions"
                            >
                              ⋯
                            </button>
                            {openRowMenuId === task.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '110%',
                                  zIndex: 40,
                                  minWidth: '175px',
                                  backgroundColor: 'var(--card-bg, #0f172a)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '10px',
                                  padding: '6px',
                                  boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  textAlign: 'left',
                                }}
                              >
                                {(currentUser?.id === task.assigned_to_id || isUserAssignedToTask(task, currentUser)) && (
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => {
                                      setOpenRowMenuId(null);
                                      handleQuickLeaveTask(task.id, task.title);
                                    }}
                                    style={{
                                      justifyContent: 'flex-start',
                                      gap: '6px',
                                      fontSize: '0.78rem',
                                      color: '#f59e0b',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      padding: '6px 8px',
                                    }}
                                  >
                                    <UserMinus size={13} />
                                    <span>Leave Task</span>
                                  </button>
                                )}
                                {(isDean || currentUser?.id === task.assigned_to_id || currentUser?.id === task.task_owner_id || currentUser?.full_name === task.task_owner_name) && (
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() => {
                                      setOpenRowMenuId(null);
                                      handleQuickDeleteTask(task.id, task.title);
                                    }}
                                    style={{
                                      justifyContent: 'flex-start',
                                      gap: '6px',
                                      fontSize: '0.78rem',
                                      color: '#ef4444',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      padding: '6px 8px',
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete Task</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

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
                              <span>Verified by Dean</span>
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
                    {groupTeamTasks && scopeFilter !== 'my_tasks' && task.group_id && expandedGroupIds.has(task.group_id) && (groupedChildrenMap.get(task.group_id)?.length || 0) > 1 && (
                      <tr style={{ backgroundColor: 'rgba(15, 23, 42, 0.35)' }}>
                        <td colSpan={10} style={{ padding: '10px 24px 16px 48px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Individual Team Member Progress ({groupedChildrenMap.get(task.group_id)!.length} Members):
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                            {groupedChildrenMap.get(task.group_id)!.map((memberTask) => (
                              <div
                                key={memberTask.id}
                                onClick={() => onSelectTask(memberTask)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  backgroundColor: 'var(--card-bg, rgba(15,23,42,0.5))',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                  cursor: 'pointer',
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {memberTask.assignee_name || 'Faculty Member'}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    Due: {formatDateToMDY(memberTask.deadline)}
                                  </div>
                                </div>
                                <span
                                  className={`badge badge-${memberTask.status === 'done' ? 'done' : memberTask.status === 'in_progress' ? 'in_progress' : 'pending'}`}
                                  style={{ fontSize: '0.68rem', padding: '2px 7px' }}
                                >
                                  {memberTask.status === 'done'
                                    ? (memberTask.dean_acknowledged === 1 ? 'Verified' : 'Submitted')
                                    : (memberTask.status || 'pending').replace('_', ' ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile-Friendly Card View (<= 768px) */}
        <div className="mobile-only-cards">
          {paginatedTasks.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              No matching directives found.
            </div>
          ) : (
            paginatedTasks.map((task) => {
              const now = new Date();
              const overdue = isTaskOverdue(task, now);
              const awaitingDean = isTaskAwaitingDeanReview(task);
              const gp = task.group_id ? groupProgressMap.get(task.group_id) : null;
              const isBusy = busyTaskId === task.id;
              const statusLabel = task.status === 'done'
                ? (task.dean_acknowledged === 1 ? 'Verified by Dean' : 'Submitted (Pending Sign-Off)')
                : overdue
                  ? 'Overdue'
                  : (task.status || 'pending').replace('_', ' ').toUpperCase();

              return (
                <div
                  key={`mob-${task.id}`}
                  onClick={() => onSelectTask(task)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: overdue ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid var(--border)',
                    backgroundColor: 'var(--bg-inset, rgba(15, 23, 42, 0.45))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                      TR #{task.tr || task.id} • {(task.priority || 'medium').toUpperCase()}
                    </span>
                    <span
                      className={`badge badge-${task.status === 'done' ? 'done' : overdue ? 'urgent' : task.status === 'in_progress' ? 'in_progress' : 'pending'}`}
                      style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35 }}>
                    {task.title}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>👤 {task.assignee_name || 'Unassigned'}</span>
                    <span>•</span>
                    <span style={{ color: overdue ? '#f87171' : 'var(--text-secondary)', fontWeight: overdue ? 700 : 500 }}>
                      📅 {formatDateToMDY(task.deadline)}
                    </span>
                    {gp && gp.total > 1 && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#60a5fa', fontWeight: 700 }}>
                          Team: {gp.done}/{gp.total} Done
                        </span>
                      </>
                    )}
                  </div>

                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--border)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onUpdateTask(task)}
                      style={{ flex: '1 1 auto', fontSize: '0.78rem', fontWeight: 700, justifyContent: 'center' }}
                    >
                      Update
                    </button>
                    {task.status !== 'done' && (isDean || currentUser?.id === task.assigned_to_id || currentUser?.id === task.task_owner_id || currentUser?.full_name === task.task_owner_name) && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        disabled={isBusy}
                        onClick={() => handleQuickMarkDone(task.id)}
                        style={{
                          flex: '1 1 auto',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          justifyContent: 'center',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          borderColor: 'rgba(16, 185, 129, 0.35)',
                          color: '#10b981',
                        }}
                      >
                        Done
                      </button>
                    )}
                    {isDean && awaitingDean && onDeanApprove && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => onDeanApprove(task.id, 'Approved by Dean Prof. Dr. Gehan Safwat')}
                        style={{
                          flex: '1 1 auto',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          justifyContent: 'center',
                          backgroundColor: '#10b981',
                          borderColor: '#10b981',
                          color: '#ffffff',
                        }}
                      >
                        Approve
                      </button>
                    )}
                    {(currentUser?.id === task.assigned_to_id || isUserAssignedToTask(task, currentUser)) && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleQuickLeaveTask(task.id, task.title)}
                        style={{ fontSize: '0.75rem', color: '#f59e0b' }}
                      >
                        Leave
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {filteredTasks.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'rgba(15, 23, 42, 0.25)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>
                Showing{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {pageSize === 0 ? 1 : (safePage - 1) * pageSize + 1}
                </strong>
                –
                <strong style={{ color: 'var(--text-main)' }}>
                  {pageSize === 0 ? filteredTasks.length : Math.min(safePage * pageSize, filteredTasks.length)}
                </strong>{' '}
                of <strong style={{ color: 'var(--text-main)' }}>{filteredTasks.length}</strong> tasks
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="form-input"
                style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
                aria-label="Tasks per page"
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value={0}>Show All</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  Previous
                </button>
                <span style={{ padding: '0 6px', fontWeight: 600, color: 'var(--text-main)' }}>
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* In-App Confirmation Modal (Replaces native browser confirm) */}
      <ConfirmModal
        isOpen={Boolean(confirmState?.isOpen)}
        title={confirmState?.type === 'delete' ? 'Delete Task' : 'Remove Yourself from Task'}
        message={
          confirmState?.type === 'delete'
            ? `Are you sure you want to permanently delete "${confirmState?.title}"?`
            : `Are you sure you want to remove yourself from "${confirmState?.title}"? Your name will be removed from the assigned team.`
        }
        confirmLabel={confirmState?.type === 'delete' ? 'Delete Task' : 'Leave Task'}
        variant={confirmState?.type === 'delete' ? 'danger' : 'warning'}
        isBusy={busyTaskId !== null}
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmState(null)}
      />

      {/* Interactive Modal to Include/Exclude Task Team Members */}
      {manageAssigneesTask && (
        <ManageAssigneesModal
          isOpen={!!manageAssigneesTask}
          task={manageAssigneesTask}
          allUsers={allUsers}
          onClose={() => setManageAssigneesTask(null)}
          onSave={handleSaveAssignees}
        />
      )}
    </div>
  );
};
