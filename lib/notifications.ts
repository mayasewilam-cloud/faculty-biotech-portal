import crypto from 'node:crypto';
import { sendEmail, isSmtpConfigured, verifySmtpConnection } from './email';
import { loadStateFromDisk, saveStateToDisk, FacultyPersistedState } from './storage';
import { isPgConfigured, pgQueryAll, pgQueryFirst, pgExecute } from './neon_pg';

export type NotificationType =
  | 'account_setup'
  | 'password_recovery'
  | 'task_dispatch'
  | 'multi_member_assignment'
  | 'supervisor_assignment'
  | 'deadline_reminder'
  | 'revision_requested'
  | 'dean_approval'
  | 'system';

export type QueueItemStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'permanently_failed';

export interface InAppNotification {
  id: string;
  user_id: number;
  user_email: string;
  title: string;
  message: string;
  type: NotificationType;
  related_task_id: number | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface QueuedEmail {
  id: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  body_html: string;
  body_text?: string;
  notification_type: NotificationType;
  related_task_id: number | null;
  status: QueueItemStatus;
  attempt_count: number;
  max_attempts: number;
  idempotency_key: string;
  created_at: string;
  last_attempt_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  smtp_message_id: string | null;
}

// Global in-memory cache for fast lookups (synchronized with storage)
const g = globalThis as any;
if (!g.__inAppNotifications) g.__inAppNotifications = [];
if (!g.__emailNotificationQueue) g.__emailNotificationQueue = [];

let isProcessingQueue = false;

// ─────────────────────────────────────────────────────────────
// 1. IN-APP NOTIFICATION ENGINE
// ─────────────────────────────────────────────────────────────

export async function createInAppNotification(params: {
  userId: number;
  userEmail: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedTaskId?: number | null;
  link?: string | null;
}): Promise<InAppNotification> {
  const newNotif: InAppNotification = {
    id: `notif_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    user_id: Number(params.userId),
    user_email: params.userEmail.toLowerCase().trim(),
    title: params.title,
    message: params.message,
    type: params.type,
    related_task_id: params.relatedTaskId ? Number(params.relatedTaskId) : null,
    link: params.link || (params.relatedTaskId ? `/?taskId=${params.relatedTaskId}` : null),
    is_read: false,
    read_at: null,
    created_at: new Date().toISOString(),
  };

  if (isPgConfigured()) {
    try {
      await pgExecute(
        `INSERT INTO notifications (id, user_id, user_email, title, message, type, related_task_id, link, is_read, read_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)`,
        [
          newNotif.id,
          newNotif.user_id,
          newNotif.user_email,
          newNotif.title,
          newNotif.message,
          newNotif.type,
          newNotif.related_task_id,
          newNotif.link,
          newNotif.created_at,
        ]
      );
      return newNotif;
    } catch (pgErr) {
      console.warn('PG createInAppNotification fallback:', pgErr);
    }
  }

  const state = await loadStateFromDisk();
  const notifications: InAppNotification[] = state?.notifications || g.__inAppNotifications || [];

  notifications.unshift(newNotif);
  g.__inAppNotifications = notifications;

  if (state) {
    state.notifications = notifications;
    await saveStateToDisk(state);
  }

  return newNotif;
}

export async function getNotificationsForUser(
  userId: number,
  userEmail?: string,
  isAdmin: boolean = false
): Promise<{ notifications: InAppNotification[]; unreadCount: number }> {
  const normEmail = userEmail ? userEmail.toLowerCase().trim() : null;

  if (isPgConfigured()) {
    try {
      const rows = normEmail
        ? await pgQueryAll(
            'SELECT * FROM notifications WHERE user_id = ? OR LOWER(user_email) = ? ORDER BY created_at DESC LIMIT 100',
            [userId, normEmail]
          )
        : await pgQueryAll(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
            [userId]
          );
      const mapped: InAppNotification[] = rows.map((r: any) => ({
        id: r.id,
        user_id: Number(r.user_id),
        user_email: r.user_email,
        title: r.title,
        message: r.message,
        type: r.type,
        related_task_id: r.related_task_id ? Number(r.related_task_id) : null,
        link: r.link ? String(r.link).replace('/dashboard/tasks', '/') : null,
        is_read: Boolean(r.is_read),
        read_at: r.read_at || null,
        created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      }));
      return {
        notifications: mapped,
        unreadCount: mapped.filter(n => !n.is_read).length,
      };
    } catch (pgErr) {
      console.warn('PG getNotificationsForUser fallback:', pgErr);
    }
  }

  const state = await loadStateFromDisk();
  const allNotifs: InAppNotification[] = state?.notifications || g.__inAppNotifications || [];

  // Strict role-based isolation:
  // Faculty users can ONLY see notifications specifically addressed to their user_id or user_email.
  // Dean / Admin can view their own, or full log if requested explicitly.
  const userNotifs = allNotifs.filter(n => {
    if (n.user_id === userId) return true;
    if (normEmail && n.user_email === normEmail) return true;
    return false;
  });

  const unreadCount = userNotifs.filter(n => !n.is_read).length;

  return {
    notifications: userNotifs,
    unreadCount,
  };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  if (isPgConfigured()) {
    try {
      const target = await pgQueryFirst('SELECT * FROM notifications WHERE id = ?', [notificationId]);
      if (!target) {
        return { success: false, error: 'Notification not found' };
      }
      if (Number(target.user_id) !== userId && userId !== 6496 && userId !== 99) {
        return { success: false, error: 'Unauthorized: Cannot modify notification of another user' };
      }
      await pgExecute('UPDATE notifications SET is_read = 1, read_at = ? WHERE id = ?', [
        new Date().toISOString(),
        notificationId,
      ]);
      return { success: true };
    } catch (pgErr) {
      console.warn('PG markNotificationAsRead fallback:', pgErr);
    }
  }

  const state = await loadStateFromDisk();
  const notifications: InAppNotification[] = state?.notifications || g.__inAppNotifications || [];

  const target = notifications.find(n => n.id === notificationId);
  if (!target) {
    return { success: false, error: 'Notification not found' };
  }

  // Cross-user modification protection
  if (target.user_id !== userId && userId !== 6496 && userId !== 99) {
    return { success: false, error: 'Unauthorized: Cannot modify notification of another user' };
  }

  target.is_read = true;
  target.read_at = new Date().toISOString();

  g.__inAppNotifications = notifications;
  if (state) {
    state.notifications = notifications;
    await saveStateToDisk(state);
  }

  return { success: true };
}

export async function markAllNotificationsAsRead(
  userId: number,
  userEmail?: string
): Promise<{ count: number }> {
  const normEmail = userEmail ? userEmail.toLowerCase().trim() : null;
  const now = new Date().toISOString();

  if (isPgConfigured()) {
    try {
      const res = normEmail
        ? await pgExecute(
            'UPDATE notifications SET is_read = 1, read_at = ? WHERE (user_id = ? OR LOWER(user_email) = ?) AND is_read = 0',
            [now, userId, normEmail]
          )
        : await pgExecute(
            'UPDATE notifications SET is_read = 1, read_at = ? WHERE user_id = ? AND is_read = 0',
            [now, userId]
          );
      return { count: res.changes || 0 };
    } catch (pgErr) {
      console.warn('PG markAllNotificationsAsRead fallback:', pgErr);
    }
  }

  const state = await loadStateFromDisk();
  const notifications: InAppNotification[] = state?.notifications || g.__inAppNotifications || [];

  let count = 0;

  for (const n of notifications) {
    if ((n.user_id === userId || (normEmail && n.user_email === normEmail)) && !n.is_read) {
      n.is_read = true;
      n.read_at = now;
      count++;
    }
  }

  g.__inAppNotifications = notifications;
  if (state) {
    state.notifications = notifications;
    await saveStateToDisk(state);
  }

  return { count };
}

// ─────────────────────────────────────────────────────────────
// 2. PERSISTENT NOTIFICATION QUEUE (Outbound Email)
// ─────────────────────────────────────────────────────────────

export async function enqueueNotificationEmail(params: {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  notificationType: NotificationType;
  relatedTaskId?: number | null;
  idempotencyKey?: string;
  maxAttempts?: number;
}): Promise<{ item: QueuedEmail; isDuplicate: boolean }> {
  const state = await loadStateFromDisk();
  const queue: QueuedEmail[] = state?.notification_queue || g.__emailNotificationQueue || [];

  // Generate or use provided idempotency key
  const idempotencyKey = params.idempotencyKey ||
    crypto.createHash('sha256')
      .update(`${params.notificationType}:${params.recipientEmail.toLowerCase()}:${params.subject}:${params.relatedTaskId || 'none'}`)
      .digest('hex');

  // Check for duplicate send using idempotency key
  const existing = queue.find(q => q.idempotency_key === idempotencyKey);
  if (existing) {
    return { item: existing, isDuplicate: true };
  }

  const newItem: QueuedEmail = {
    id: `queue_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    recipient_name: params.recipientName,
    recipient_email: params.recipientEmail.toLowerCase().trim(),
    subject: params.subject,
    body_html: params.bodyHtml,
    body_text: params.bodyText,
    notification_type: params.notificationType,
    related_task_id: params.relatedTaskId ? Number(params.relatedTaskId) : null,
    status: 'pending',
    attempt_count: 0,
    max_attempts: params.maxAttempts || 3,
    idempotency_key: idempotencyKey,
    created_at: new Date().toISOString(),
    last_attempt_at: null,
    sent_at: null,
    error_message: null,
    smtp_message_id: null,
  };

  queue.push(newItem);
  g.__emailNotificationQueue = queue;

  if (state) {
    state.notification_queue = queue;
    await saveStateToDisk(state);
  }

  return { item: newItem, isDuplicate: false };
}

export async function processNotificationQueue(options?: {
  batchSize?: number;
}): Promise<{
  processed: number;
  sent: number;
  failed: number;
  permanentlyFailed: number;
  results: Array<{ id: string; status: QueueItemStatus; error?: string; messageId?: string }>;
}> {
  if (isProcessingQueue) {
    return { processed: 0, sent: 0, failed: 0, permanentlyFailed: 0, results: [] };
  }

  isProcessingQueue = true;
  const batchSize = options?.batchSize || 10;
  const results: Array<{ id: string; status: QueueItemStatus; error?: string; messageId?: string }> = [];

  let sent = 0;
  let failed = 0;
  let permanentlyFailed = 0;

  try {
    const state = await loadStateFromDisk();
    const queue: QueuedEmail[] = state?.notification_queue || g.__emailNotificationQueue || [];

    // Eligible items: status = 'pending' OR ('failed' AND attempt_count < max_attempts)
    const pendingItems = queue
      .filter(item => item.status === 'pending' || (item.status === 'failed' && item.attempt_count < item.max_attempts))
      .slice(0, batchSize);

    if (pendingItems.length === 0) {
      return { processed: 0, sent: 0, failed: 0, permanentlyFailed: 0, results: [] };
    }

    // Check SMTP status once per batch
    const smtpAvailable = isSmtpConfigured();

    for (const item of pendingItems) {
      item.status = 'processing';
      item.attempt_count += 1;
      item.last_attempt_at = new Date().toISOString();

      if (!smtpAvailable) {
        item.status = 'pending';
        item.error_message = 'SMTP transport unconfigured on server. Queued for background delivery.';
        results.push({ id: item.id, status: 'pending', error: item.error_message });
        continue;
      }

      // Execute real SMTP send
      const sendResult = await sendEmail({
        to: item.recipient_email,
        subject: item.subject,
        html: item.body_html,
        text: item.body_text,
      });

      if (sendResult.success) {
        item.status = 'sent';
        item.sent_at = new Date().toISOString();
        item.smtp_message_id = sendResult.messageId || null;
        item.error_message = null;
        sent++;
        results.push({ id: item.id, status: 'sent', messageId: sendResult.messageId });
      } else {
        item.error_message = sendResult.error || 'SMTP delivery failure';
        if (item.attempt_count >= item.max_attempts) {
          item.status = 'permanently_failed';
          permanentlyFailed++;
        } else {
          item.status = 'failed';
          failed++;
        }
        results.push({ id: item.id, status: item.status, error: item.error_message });
      }
    }

    g.__emailNotificationQueue = queue;
    if (state) {
      state.notification_queue = queue;
      await saveStateToDisk(state);
    }
  } finally {
    isProcessingQueue = false;
  }

  return {
    processed: results.length,
    sent,
    failed,
    permanentlyFailed,
    results,
  };
}

export async function getQueueStatus(): Promise<{
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  permanently_failed: number;
  recentItems: QueuedEmail[];
}> {
  const state = await loadStateFromDisk();
  const queue: QueuedEmail[] = state?.notification_queue || g.__emailNotificationQueue || [];

  return {
    total: queue.length,
    pending: queue.filter(q => q.status === 'pending').length,
    processing: queue.filter(q => q.status === 'processing').length,
    sent: queue.filter(q => q.status === 'sent').length,
    failed: queue.filter(q => q.status === 'failed').length,
    permanently_failed: queue.filter(q => q.status === 'permanently_failed').length,
    recentItems: queue.slice(-20).reverse(),
  };
}
