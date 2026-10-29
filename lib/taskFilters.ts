/**
 * Safely parse assigned_members into string[] whether it's an array, JSON string, or comma-separated string
 */
export function parseAssignedMembers(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
        }
      } catch {}
    }
    return trimmed.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return [];
}

import { Task, User } from '@/types';

/**
 * Safely parse a date string into a Date object or null
 */
export function parseSafeDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Determine if a task is overdue (past deadline and not marked as done)
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.status === 'done') return false;
  const d = parseSafeDate(task.deadline);
  return d !== null && d < now;
}

/**
 * Determine if a task is completed and awaiting Dean Prof. Dr. Gehan Safwat's formal review
 */
export function isTaskAwaitingDeanReview(task: Task): boolean {
  return task.status === 'done' && task.dean_acknowledged !== 1;
}

/**
 * Single source of truth for matching any assigned member to a task
 * Supports direct ID, email, assignee_name, and multi-member assigned_members array
 */
export function isUserAssignedToTask(task: Task, user: User | null): boolean {
  if (!user) return false;

  // 1. Direct ID matching (assigned_to, owner, or creator)
  if (task.assigned_to_id === user.id || task.task_owner_id === user.id || task.assigned_by_id === user.id) {
    return true;
  }

  const userFullName = (user.full_name || '').toLowerCase().trim();
  const userEmail = (user.email || '').toLowerCase().trim();

  // 2. Direct Assignee Name or Email
  if (task.assignee_email && userEmail && task.assignee_email.toLowerCase() === userEmail) {
    return true;
  }
  if (task.assignee_name && userFullName) {
    const aLower = task.assignee_name.toLowerCase().trim();
    if (aLower === userFullName || aLower.includes(userFullName) || userFullName.includes(aLower)) {
      return true;
    }
  }

  // 3. Multi-Member assigned_members array or JSON/comma string
  if (task.assigned_members) {
    const members = parseAssignedMembers(task.assigned_members);

    const uClean = userFullName.replace(/^(prof\.|dr\.|la\.|ta\.|ms\.|mrs\.|mr\.)\s*/, '').trim();

    for (const m of members) {
      if (!m) continue;
      const mLower = m.toLowerCase().trim();
      if (mLower === userFullName || userFullName.includes(mLower) || mLower.includes(userFullName)) {
        return true;
      }
      const mClean = mLower.replace(/^(prof\.|dr\.|la\.|ta\.|ms\.|mrs\.|mr\.)\s*/, '').trim();
      if (mClean && uClean && (mClean === uClean || mClean.includes(uClean) || uClean.includes(mClean))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Filter tasks by user role & privacy permissions:
 * - Dean / Admin / Leadership: Sees all institutional tasks
 * - Regular faculty members: Only see tasks assigned to them (multi-member dispatch supported)
 */
export function filterTasksByScope(tasks: Task[], currentUser: User | null, isDean: boolean): Task[] {
  if (isDean || !currentUser) return tasks;
  return tasks.filter((t) => isUserAssignedToTask(t, currentUser));
}

/**
 * Single source of truth for filtering tasks by status:
 */
export function filterTasksByStatus(tasks: Task[], statusFilter: string, now: Date = new Date()): Task[] {
  if (!statusFilter || statusFilter === 'all') return tasks;

  return tasks.filter((t) => {
    const overdue = isTaskOverdue(t, now);

    switch (statusFilter) {
      case 'done':
        return t.status === 'done';
      case 'awaiting_dean':
        return isTaskAwaitingDeanReview(t);
      case 'in_progress':
        return t.status === 'in_progress';
      case 'overdue':
        return overdue;
      case 'pending':
        return t.status === 'pending' && !overdue;
      case 'revision_requested':
        return t.status === 'revision_requested';
      default:
        return t.status === statusFilter;
    }
  });
}

export interface TaskMetrics {
  totalCount: number;
  doneCount: number;
  inProgressCount: number;
  overdueCount: number;
  awaitingDeanReviewCount: number;
  pendingCount: number;
  revisionRequestedCount: number;
  completionRate: number;
}

/**
 * Single source of truth for KPI counts used across Overview, Analytics, and Badges
 */
export function calculateTaskMetrics(
  tasks: Task[],
  currentUser: User | null,
  isDean: boolean,
  now: Date = new Date()
): TaskMetrics {
  // 1. Role scope (strictly scopes to user's assigned tasks for staff)
  const scoped = filterTasksByScope(tasks, currentUser, isDean);
  // 2. Ignore sub-tasks in high-level KPI cards to prevent count inflation
  const topTasks = scoped.filter((t) => !t.parent_task_id);

  const totalCount = topTasks.length;
  const doneCount = topTasks.filter((t) => t.status === 'done').length;
  const inProgressCount = topTasks.filter((t) => t.status === 'in_progress').length;
  const overdueCount = topTasks.filter((t) => isTaskOverdue(t, now)).length;
  const awaitingDeanReviewCount = topTasks.filter((t) => isTaskAwaitingDeanReview(t)).length;
  const pendingCount = topTasks.filter((t) => t.status === 'pending' && !isTaskOverdue(t, now)).length;
  const revisionRequestedCount = topTasks.filter((t) => t.status === 'revision_requested').length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return {
    totalCount,
    doneCount,
    inProgressCount,
    overdueCount,
    awaitingDeanReviewCount,
    pendingCount,
    revisionRequestedCount,
    completionRate,
  };
}
