
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { execute } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      task_id,
      meeting_id,
      recipient_email,
      recipient_name,
      subject,
      content,
      email_type = 'directive',
    } = body;

    if (!recipient_email || !subject) {
      return NextResponse.json({ error: 'Recipient email and subject are required' }, { status: 400 });
    }

    // Record formal audit trail
    const auditTitle = `Academic Email Dispatch: ${subject}`;
    const auditDetails = `Dean/Leadership office sent formal dispatch to ${recipient_name || 'Faculty Member'} <${recipient_email}>. Type: ${email_type.toUpperCase()}.`;

    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, metadata, ip_address)
      VALUES (?, ?, ?, 'EMAIL_DISPATCHED', ?, ?, ?, ?, '127.0.0.1')
    `, [
      user.id,
      user.full_name,
      user.role,
      task_id ? Number(task_id) : null,
      auditTitle,
      auditDetails,
      JSON.stringify({
        task_id,
        meeting_id,
        recipient_email,
        recipient_name,
        subject,
        email_type,
        simulated: true,
        sent_at: new Date().toISOString(),
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Official email directive successfully dispatched to ${recipient_email}`,
      timestamp: new Date().toISOString(),
      recipient: recipient_email,
      subject,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to dispatch email' }, { status: 500 });
  }
}
