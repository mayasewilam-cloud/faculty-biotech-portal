import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { execute, queryFirst } from '@/lib/db';
import { isSmtpConfigured } from '@/lib/email';
import { createInAppNotification, enqueueNotificationEmail, processNotificationQueue } from '@/lib/notifications';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Academic authentication required' }, { status: 401 });
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

    const normEmail = recipient_email.toLowerCase().trim();
    const targetUser = await queryFirst('SELECT id, full_name, email FROM users WHERE LOWER(email) = ?', [normEmail]) as any;

    // 1. Create guaranteed In-App Notification (Never lost even if email fails)
    if (targetUser) {
      await createInAppNotification({
        userId: targetUser.id,
        userEmail: targetUser.email,
        title: subject,
        message: content || `Official academic communication from ${user.title || ''} ${user.full_name}.`,
        type: 'task_dispatch',
        relatedTaskId: task_id ? Number(task_id) : null,
      });
    }

    // 2. Format HTML email body
    const htmlBody = `
      <div style="font-family: sans-serif; color: #1e293b; padding: 16px;">
        <h2 style="color: #0f172a; margin-bottom: 12px;">${subject}</h2>
        <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 14px; margin-bottom: 16px;">
          ${content ? `<p style="margin: 0; font-size: 14px; line-height: 1.6;">${content.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
        <p style="font-size: 12px; color: #64748b;">Dispatched by: ${user.title || ''} ${user.full_name} (${user.role})</p>
      </div>
    `;

    // 3. Enqueue Email in persistent queue
    const enqueueResult = await enqueueNotificationEmail({
      recipientName: recipient_name || targetUser?.full_name || 'Faculty Member',
      recipientEmail: normEmail,
      subject,
      bodyHtml: htmlBody,
      bodyText: content || subject,
      notificationType: 'task_dispatch',
      relatedTaskId: task_id ? Number(task_id) : null,
      idempotencyKey: `dispatch_email_${task_id || 'manual'}_${normEmail}_${Date.now()}`,
    });

    // 4. Attempt immediate queue dispatch
    const queueProcess = await processNotificationQueue({ batchSize: 5 });
    const itemResult = queueProcess.results.find(r => r.id === enqueueResult.item.id);

    const smtpConfigured = isSmtpConfigured();
    let emailStatus: 'sent' | 'queued' | 'failed' = 'queued';
    let messageId: string | undefined;

    if (itemResult && itemResult.status === 'sent') {
      emailStatus = 'sent';
      messageId = itemResult.messageId;
    } else if (itemResult && (itemResult.status === 'failed' || itemResult.status === 'permanently_failed')) {
      emailStatus = 'failed';
    } else {
      emailStatus = 'queued';
    }

    // 5. Record truthful audit log
    const auditTitle = `Academic Email Dispatch: ${subject}`;
    const auditDetails = `Dean/Leadership office initiated dispatch to ${recipient_name || 'Faculty Member'} <${recipient_email}>. Type: ${email_type.toUpperCase()}. Status: ${emailStatus.toUpperCase()}.`;

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
        simulated: false,
        smtp_configured: smtpConfigured,
        email_status: emailStatus,
        smtp_message_id: messageId || null,
        sent_at: emailStatus === 'sent' ? new Date().toISOString() : null,
      }),
    ]);

    // 6. Return truthful response
    if (emailStatus === 'sent') {
      return NextResponse.json({
        success: true,
        email_status: 'sent',
        delivery_confirmed: true,
        messageId,
        message: `Official email directive successfully transmitted via SMTP to ${recipient_email}`,
        recipient: recipient_email,
        subject,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      email_status: emailStatus,
      delivery_confirmed: false,
      warning: smtpConfigured ? 'Email queued for retry.' : 'Outbound SMTP is unconfigured.',
      message: smtpConfigured
        ? `In-app notification created. Email queued for background retry (status: ${emailStatus}).`
        : `In-app notification created in portal. Email queued for delivery once SMTP credentials are configured.`,
      recipient: recipient_email,
      subject,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to dispatch email' }, { status: 500 });
  }
}
