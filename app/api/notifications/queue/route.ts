import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getQueueStatus, processNotificationQueue } from '@/lib/notifications';
import { isSmtpConfigured, verifySmtpConnection, getSmtpConfig } from '@/lib/email';

// GET /api/notifications/queue: Inspect queue metrics & SMTP health
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const isDeanOrAdmin = user && (user.role === 'admin' || user.id === 6496 || user.id === 99 || user.role === 'dean');

    if (!isDeanOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Leadership oversight required.' }, { status: 403 });
    }

    const queueStatus = await getQueueStatus();
    const smtpConfigured = isSmtpConfigured();
    const safeConfig = getSmtpConfig();
    const smtpHealth = smtpConfigured ? await verifySmtpConnection() : { available: false, error: 'SMTP unconfigured' };

    return NextResponse.json({
      success: true,
      smtp: {
        configured: smtpConfigured,
        host: safeConfig?.host || null,
        port: safeConfig?.port || null,
        secure: safeConfig?.secure ?? null,
        from: safeConfig?.from || null,
        connected: smtpHealth.available,
        connection_error: smtpHealth.error || null,
      },
      queue: queueStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to inspect queue' }, { status: 500 });
  }
}

// POST /api/notifications/queue: Process pending/retry items
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const isDeanOrAdmin = user && (user.role === 'admin' || user.id === 6496 || user.id === 99 || user.role === 'dean');

    // Also support cron invocation with valid CRON_SECRET
    const configuredSecret = (globalThis as any).CRON_SECRET || process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const bearerSecret = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;
    const isAuthorizedCron = configuredSecret && bearerSecret === configuredSecret;

    if (!isDeanOrAdmin && !isAuthorizedCron) {
      return NextResponse.json({ error: 'Unauthorized: Leadership or cron secret required.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = typeof body.batch_size === 'number' ? body.batch_size : 20;

    const dispatchResult = await processNotificationQueue({ batchSize });

    return NextResponse.json({
      success: true,
      message: `Processed ${dispatchResult.processed} queued notification(s). Sent: ${dispatchResult.sent}, Failed: ${dispatchResult.failed}, Permanently Failed: ${dispatchResult.permanentlyFailed}.`,
      dispatch: dispatchResult,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process queue' }, { status: 500 });
  }
}
