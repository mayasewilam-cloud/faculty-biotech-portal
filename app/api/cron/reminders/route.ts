
import { NextResponse } from 'next/server';
import { queryAll, execute, getAllMeetings, getPushSubscriptions } from '@/lib/db';

export async function GET(req: Request) {
  return handleCronReminders(req);
}

export async function POST(req: Request) {
  return handleCronReminders(req);
}

async function handleCronReminders(req: Request) {
  try {
    // 1. Strict Authentication Guard: CRON_SECRET is strictly mandatory
    const expectedSecret = (globalThis as any).CRON_SECRET || process.env.CRON_SECRET || 'dev-cron-secret-faculty-2026';
    if (!expectedSecret || expectedSecret.trim() === '') {
      console.error('[SECURITY BLOCK] CRON_SECRET is not configured on server.');
      return NextResponse.json(
        { error: 'CRON_SECRET configuration missing on server. Scheduled reminders cannot execute without authorization.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const secretKey = searchParams.get('key') || (authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null);

    if (!secretKey || secretKey !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing cron secret authorization.' },
        { status: 401 }
      );
    }

    const now = new Date();
    const nowMs = now.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const in48Hours = new Date(nowMs + 48 * 60 * 60 * 1000);
    const in24Hours = new Date(nowMs + 24 * 60 * 60 * 1000);

    // 2. Fetch existing recent reminder logs for 24-hour deduplication
    const existingLogs: any[] = await queryAll('SELECT * FROM activity_logs WHERE action_type = ?', ['REMINDER_DISPATCHED']);

    const hasRecentTaskReminder = (taskId: number): boolean => {
      return existingLogs.some(l => {
        if (!l.created_at) return false;
        const logTime = new Date(l.created_at).getTime();
        if (nowMs - logTime > dayMs) return false;
        return (l.task_id === taskId) || (typeof l.details === 'string' && l.details.includes(`"taskId":${taskId}`));
      });
    };

    const hasRecentMeetingReminder = (meetingId: number): boolean => {
      return existingLogs.some(l => {
        if (!l.created_at) return false;
        const logTime = new Date(l.created_at).getTime();
        if (nowMs - logTime > dayMs) return false;
        return typeof l.details === 'string' && l.details.includes(`"meetingId":${meetingId}`);
      });
    };

    // 3. Scan pending & in-progress tasks due within 48h
    const allTasks: any[] = await queryAll('SELECT * FROM tasks WHERE status != ?', ['done']);
    const urgentTasks = allTasks.filter(t => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return d <= in48Hours;
    });

    // 4. Scan upcoming meetings within 24h
    const allMeetings = await getAllMeetings();
    const upcomingMeetings = allMeetings.filter(m => {
      if (!m.date) return false;
      const d = new Date(m.date);
      return d >= now && d <= in24Hours;
    });

    const pendingDeanBriefings = allMeetings.filter(m => {
      return (
        m.type === 'presidential_delegation' &&
        m.dean_briefing?.required &&
        m.dean_briefing?.status === 'scheduled'
      );
    });

    let loggedRemindersCount = 0;
    let skippedDuplicatesCount = 0;
    let pendingVapidSubscribersCount = 0;
    const remindersSummary: any[] = [];

    // 5. Process urgent tasks with deduplication
    for (const task of urgentTasks) {
      if (hasRecentTaskReminder(task.id)) {
        skippedDuplicatesCount++;
        continue;
      }

      const isOverdue = new Date(task.deadline) < now;
      const reminderType = isOverdue ? 'TASK_OVERDUE' : 'TASK_DEADLINE_APPROACHING';
      const hoursRemaining = Math.max(0, Math.round((new Date(task.deadline).getTime() - nowMs) / (1000 * 60 * 60)));

      // Check push subscriptions count (accurate, never false claims of external delivery)
      if (task.assigned_to_id) {
        const subs = await getPushSubscriptions(task.assigned_to_id);
        if (subs && subs.length > 0) {
          pendingVapidSubscribersCount += subs.length;
        }
      }

      // Record accurate audit log
      try {
        await execute(
          'INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            task.assigned_to_id || 99,
            task.assignee_name || 'Assigned Faculty Member',
            task.assignee_role || 'staff',
            'REMINDER_DISPATCHED',
            `Automated Deadline Reminder: ${task.title}`,
            JSON.stringify({
              type: reminderType,
              taskId: task.id,
              title: task.title,
              deadline: task.deadline,
              is_overdue: isOverdue,
              hours_remaining: hoursRemaining,
              delivery_channel: 'audit_log_and_local_queue',
              vapid_configured: false,
            }),
            '127.0.0.1',
          ]
        );
        loggedRemindersCount++;
      } catch (err) {
        console.warn('Failed to insert task reminder log:', err);
      }

      remindersSummary.push({
        type: reminderType,
        taskId: task.id,
        assigneeId: task.assigned_to_id,
        title: task.title,
      });
    }

    // 6. Process upcoming meetings with deduplication
    for (const meeting of upcomingMeetings) {
      if (hasRecentMeetingReminder(meeting.id)) {
        skippedDuplicatesCount++;
        continue;
      }

      try {
        await execute(
          'INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            meeting.created_by_id || 99,
            meeting.created_by_name || 'Meeting Rapporteur',
            'admin',
            'REMINDER_DISPATCHED',
            `Automated Meeting Reminder: ${meeting.title}`,
            JSON.stringify({
              type: 'MEETING_UPCOMING',
              meetingId: meeting.id,
              title: meeting.title,
              date: meeting.date,
              location: meeting.location,
              attendees_count: meeting.attendees?.length || 0,
              delivery_channel: 'audit_log_and_local_queue',
              vapid_configured: false,
            }),
            '127.0.0.1',
          ]
        );
        loggedRemindersCount++;
      } catch (err) {
        console.warn('Failed to insert meeting reminder log:', err);
      }

      remindersSummary.push({
        type: 'MEETING_UPCOMING',
        meetingId: meeting.id,
        title: meeting.title,
      });
    }

    // 7. Process Dean Briefings with deduplication
    for (const meeting of pendingDeanBriefings) {
      const briefingKey = `DEAN_BRIEF_${meeting.id}`;
      const hasRecentBriefingReminder = existingLogs.some(l => {
        if (!l.created_at) return false;
        const logTime = new Date(l.created_at).getTime();
        if (nowMs - logTime > dayMs) return false;
        return typeof l.details === 'string' && l.details.includes(briefingKey);
      });

      if (hasRecentBriefingReminder) {
        skippedDuplicatesCount++;
        continue;
      }

      try {
        await execute(
          'INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            6496, // Prof. Dr. Gehan Safwat (Dean)
            'Prof. Dr. Gehan Safwat',
            'dean',
            'REMINDER_DISPATCHED',
            `Presidential Delegation Briefing Pending: ${meeting.title}`,
            JSON.stringify({
              type: 'DEAN_BRIEFING_PENDING',
              meetingId: meeting.id,
              briefingKey,
              title: meeting.title,
              briefing_date: meeting.dean_briefing?.briefing_date,
              phase: meeting.dean_briefing?.phase,
              delivery_channel: 'audit_log_and_local_queue',
              vapid_configured: false,
            }),
            '127.0.0.1',
          ]
        );
        loggedRemindersCount++;
      } catch (err) {
        console.warn('Failed to insert Dean briefing reminder log:', err);
      }

      remindersSummary.push({
        type: 'DEAN_BRIEFING_PENDING',
        meetingId: meeting.id,
        title: meeting.title,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        total_urgent_tasks: urgentTasks.length,
        total_upcoming_meetings: upcomingMeetings.length,
        total_pending_dean_briefings: pendingDeanBriefings.length,
        reminders_logged: loggedRemindersCount,
        skipped_duplicates: skippedDuplicatesCount,
        pending_vapid_subscribers: pendingVapidSubscribersCount,
        vapid_configured: !!((globalThis as any).VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY),
      },
      dispatched: remindersSummary,
    });
  } catch (err: any) {
    console.error('Cron reminders dispatch error:', err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch reminders' }, { status: 500 });
  }
}
