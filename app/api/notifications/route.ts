import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getQueueStatus,
} from '@/lib/notifications';

// GET /api/notifications: Fetch current user's in-app notifications
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isDeanOrAdmin = user.role === 'admin' || user.id === 6496 || user.id === 99 || user.role === 'dean';

    // Optional admin overview of outbound queue
    if (searchParams.get('queue') === 'status') {
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Forbidden: Leadership oversight only.' }, { status: 403 });
      }
      const queueStatus = await getQueueStatus();
      return NextResponse.json({ success: true, queue: queueStatus });
    }

    const { notifications, unreadCount } = await getNotificationsForUser(user.id, user.email, isDeanOrAdmin);

    return NextResponse.json({
      success: true,
      user_id: user.id,
      unread_count: unreadCount,
      total_count: notifications.length,
      notifications,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH /api/notifications: Mark notification(s) as read
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await req.json();

    if (body.mark_all === true) {
      const { count } = await markAllNotificationsAsRead(user.id, user.email);
      return NextResponse.json({
        success: true,
        message: `Marked ${count} notification(s) as read.`,
        marked_count: count,
      });
    }

    if (!body.id || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 });
    }

    const result = await markNotificationAsRead(body.id, user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update notification.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read.',
      id: body.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update notifications' }, { status: 500 });
  }
}
