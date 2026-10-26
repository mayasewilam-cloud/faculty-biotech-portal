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
 * Filter tasks by user role & privacy permissions:
 * - Dean / Admin / Leadership: Sees all institutional tasks
 * - Regular faculty members: Only see tasks assigned to them, created by them, or owned by them
 */
export function filterTasksByScope(tasks: Task[], currentUser: User | null, isDean: boolean): Task[] {
  if (isDean || !currentUser) return tasks;
  return tasks.filter(
    (t) =>
      t.assigned_to_id === currentUser.id ||
      t.task_owner_id === currentUser.id ||
      t.assigned_by_id === currentUser.id
  );
}

/**
 * Single source of truth for filtering tasks by status:
 * Supported statuses:
 * - 'all': All tasks
 * - 'done': Completed deliverables
 * - 'awaiting_dean': Completed deliverables awaiting Dean sign-off
 * - 'in_progress': Active tasks currently in progress
 * - 'pending': Tasks not started yet and not overdue
 * - 'overdue': Tasks past their deadline
 * - 'revision_requested': Tasks returned with Dean revision directives
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
  // 1. Role scope (prevent cross-user leak for normal faculty members)
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
