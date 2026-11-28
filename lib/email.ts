import nodemailer from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  from: string;
  timeoutMs: number;
}

export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY || (globalThis as any).RESEND_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

export function isSmtpConfigured(): boolean {
  if (isResendConfigured()) return true;
  const host = process.env.SMTP_HOST || (globalThis as any).SMTP_HOST;
  return typeof host === 'string' && host.trim().length > 0;
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST || (globalThis as any).SMTP_HOST;
  if (!host || typeof host !== 'string' || !host.trim()) {
    return null;
  }

  const rawPort = process.env.SMTP_PORT || (globalThis as any).SMTP_PORT || '587';
  const port = parseInt(rawPort, 10) || 587;
  const rawSecure = process.env.SMTP_SECURE || (globalThis as any).SMTP_SECURE;
  const secure = rawSecure !== undefined ? String(rawSecure) === 'true' : port === 465;
  const user = process.env.SMTP_USER || (globalThis as any).SMTP_USER;
  const from = process.env.SMTP_FROM || (globalThis as any).SMTP_FROM || 'Faculty of Biotechnology MSA <no-reply@msa.edu.eg>';
  const timeoutMs = parseInt(process.env.SMTP_TIMEOUT || '5000', 10) || 5000;

  return {
    host: host.trim(),
    port,
    secure,
    user: user ? String(user).trim() : undefined,
    from,
    timeoutMs,
  };
}

export function createTransporter() {
  const config = getSmtpConfig();
  if (!config) return null;

  const pass = process.env.SMTP_PASS || (globalThis as any).SMTP_PASS;

  const auth = config.user && pass
    ? {
        user: config.user,
        pass: String(pass),
      }
    : undefined;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth,
    connectionTimeout: config.timeoutMs,
    greetingTimeout: config.timeoutMs,
    socketTimeout: config.timeoutMs * 2,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production' && !process.env.SMTP_ALLOW_SELFSIGNED,
    },
  });
}

export async function verifySmtpConnection(): Promise<{ available: boolean; error?: string }> {
  if (isResendConfigured()) {
    return { available: true };
  }
  const transporter = createTransporter();
  if (!transporter) {
    return { available: false, error: 'SMTP host is not configured.' };
  }

  try {
    const config = getSmtpConfig();
    const timeoutPromise = new Promise<{ available: boolean; error: string }>((_, reject) =>
      setTimeout(() => reject(new Error(`SMTP connection timed out after ${config?.timeoutMs || 5000}ms`)), (config?.timeoutMs || 5000) + 500)
    );

    const verifyPromise = transporter.verify().then(() => ({ available: true }));
    return await Promise.race([verifyPromise, timeoutPromise]);
  } catch (err: any) {
    return {
      available: false,
      error: err.message || 'Failed to verify SMTP connection.',
    };
  }
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  headers?: Record<string, string>;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
  code?: string;
}

export async function sendEmail(options: SendMailOptions): Promise<SendMailResult> {
  const { to, subject, html, text, from, headers } = options;

  if (!to || typeof to !== 'string' || !to.includes('@')) {
    return { success: false, error: 'Invalid recipient email address format.' };
  }

  const plainText = text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Prefer Resend HTTP API if RESEND_API_KEY is configured (ideal for Vercel Serverless, 3,000 free/mo)
  const resendKey = process.env.RESEND_API_KEY || (globalThis as any).RESEND_API_KEY;
  if (typeof resendKey === 'string' && resendKey.trim().length > 0) {
    const resendFrom =
      from ||
      process.env.RESEND_FROM ||
      process.env.SMTP_FROM ||
      'MSA Faculty of Biotechnology <onboarding@resend.dev>';
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [to.trim()],
          subject,
          html,
          text: plainText,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        return {
          success: false,
          error: data?.message || `Resend API error (${resp.status})`,
          code: 'RESEND_SEND_FAILED',
        };
      }
      return {
        success: true,
        messageId: data?.id || 'resend-ok',
        response: JSON.stringify(data),
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Resend API transmission error',
        code: 'RESEND_SEND_FAILED',
      };
    }
  }

  const transporter = createTransporter();
  if (!transporter) {
    return {
      success: false,
      error: 'Email transport is unconfigured. Set RESEND_API_KEY or SMTP_HOST.',
      code: 'SMTP_UNCONFIGURED',
    };
  }

  const config = getSmtpConfig();
  const mailFrom = from || config?.from || 'Faculty of Biotechnology MSA <no-reply@msa.edu.eg>';

  try {
    const info = await transporter.sendMail({
      from: mailFrom,
      to,
      subject,
      text: plainText,
      html,
      headers,
    });

    return {
      success: true,
      messageId: info.messageId,
      response: typeof info.response === 'string' ? info.response : JSON.stringify(info.response),
    };
  } catch (err: any) {
    // Sanitize error: never log passwords or auth headers
    const sanitizedError = err.message || 'SMTP transmission error';
    return {
      success: false,
      error: sanitizedError,
      code: err.code || 'SMTP_SEND_FAILED',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// INSTITUTIONAL EMAIL TEMPLATES (MSA Biotechnology Design)
// ─────────────────────────────────────────────────────────────

function emailWrapper(title: string, bodyContent: string, actionButton?: { text: string; url: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px; text-align: left; border-bottom: 3px solid #059669;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; font-weight: 600;">October University for Modern Sciences & Arts (MSA)</div>
              <div style="font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 4px;">Faculty of Biotechnology Management Portal</div>
              <div style="font-size: 13px; color: #34d399; margin-top: 2px;">Dean's Executive Academic Oversight Office</div>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <h1 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0f172a;">${title}</h1>
              ${bodyContent}
              ${actionButton ? `
              <div style="margin: 28px 0; text-align: center;">
                <a href="${actionButton.url}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">${actionButton.text}</a>
              </div>
              ` : ''}
              <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
                <strong>Official University Notice:</strong> This academic notification was dispatched through the Faculty of Biotechnology Portal. Please do not reply directly to this automated address. For executive inquiries, please contact the Dean's Office (Building A, Room 301).
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
              © 2026 Faculty of Biotechnology — October University for Modern Sciences and Arts. NAQAAE Quality Accredited.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// 1. Account Setup Verification
export function renderAccountSetupTemplate(params: { fullName: string; token: string; setupUrl: string; expiresAt: string }) {
  const body = `
    <p>Dear <strong>${params.fullName}</strong>,</p>
    <p>An official academic faculty account has been registered for you on the <strong>Faculty of Biotechnology Management Portal</strong>.</p>
    <p>To establish your secure personal credentials, please click the button below to verify your academic email address and set your password:</p>
    <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 12px 16px; margin: 16px 0; font-size: 13px;">
      <div><strong>Single-Use Verification Token:</strong> <code style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${params.token}</code></div>
      <div style="margin-top: 4px; color: #64748b;"><strong>Token Validity:</strong> 60 minutes (Expires: ${new Date(params.expiresAt).toLocaleTimeString('en-GB')})</div>
    </div>
    <p style="font-size: 13px; color: #475569;">If you did not request this setup, please report this immediately to the Faculty Administrator or Dean's Office.</p>
  `;
  return {
    subject: '[MSA BIO] Faculty Account Setup Verification',
    html: emailWrapper('Official Faculty Account Verification', body, { text: 'Complete Account Setup', url: params.setupUrl }),
  };
}

// 2. Password Recovery Notification
export function renderPasswordRecoveryTemplate(params: { fullName: string; token: string; recoveryUrl: string; expiresAt: string }) {
  const body = `
    <p>Dear <strong>${params.fullName}</strong>,</p>
    <p>An administrative account recovery request was initiated for your portal account by Executive Leadership.</p>
    <p>Please click the button below to establish a new password:</p>
    <div style="background-color: #f8fafc; border-left: 4px solid #d97706; padding: 12px 16px; margin: 16px 0; font-size: 13px;">
      <div><strong>Single-Use Recovery Token:</strong> <code style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${params.token}</code></div>
      <div style="margin-top: 4px; color: #64748b;"><strong>Expiration Window:</strong> 60 minutes (Expires: ${new Date(params.expiresAt).toLocaleTimeString('en-GB')})</div>
    </div>
    <p style="font-size: 13px; color: #475569;">This token is strictly single-use and will automatically revoke after 5 failed verification attempts.</p>
  `;
  return {
    subject: '[MSA BIO] Official Account Recovery Token',
    html: emailWrapper('Account Password Recovery Directive', body, { text: 'Reset Portal Password', url: params.recoveryUrl }),
  };
}

// 3. Task Directive Dispatch
export function renderTaskDispatchTemplate(params: { taskTitle: string; taskId: number; priority: string; deadline: string; assignedByName: string; instructions?: string }) {
  const body = `
    <p>An official academic directive has been assigned to your faculty portfolio:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b; width: 120px;"><strong>Task Title:</strong></td><td style="padding: 8px 0; font-weight: 600;">${params.taskTitle}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;"><strong>Task ID:</strong></td><td style="padding: 8px 0;">#${params.taskId}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;"><strong>Priority:</strong></td><td style="padding: 8px 0; font-weight: 700; color: ${params.priority === 'urgent' ? '#dc2626' : '#059669'};">${params.priority.toUpperCase()}</td></tr>
      <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;"><strong>Deadline:</strong></td><td style="padding: 8px 0; font-weight: 600;">${new Date(params.deadline).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;"><strong>Issued By:</strong></td><td style="padding: 8px 0;">${params.assignedByName}</td></tr>
    </table>
    ${params.instructions ? `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 16px 0; font-size: 13px;"><strong>Executive Instructions:</strong><br>${params.instructions}</div>` : ''}
    <p style="font-size: 13px; color: #475569;">Please log into the portal to review complete requirements, action plans, and submit your deliverables prior to the deadline.</p>
  `;
  return {
    subject: `[MSA BIO] Academic Directive: ${params.taskTitle} (Priority: ${params.priority.toUpperCase()})`,
    html: emailWrapper('New Academic Directive Assigned', body, { text: 'View Task in Portal', url: `http://localhost:3000/dashboard/tasks?taskId=${params.taskId}` }),
  };
}

// 4. Multi-Member Task Assignment
export function renderMultiMemberAssignmentTemplate(params: { taskTitle: string; taskId: number; priority: string; deadline: string; assignedByName: string; membersList: string[] }) {
  const body = `
    <p>You have been assigned as part of a collaborative committee/working group for the following academic task:</p>
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px; margin: 16px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 15px; color: #0f172a;">${params.taskTitle}</h3>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Assigned Group Members:</strong></p>
      <ul style="margin: 4px 0 12px 18px; font-size: 13px; color: #334155;">
        ${params.membersList.map(m => `<li>${m}</li>`).join('')}
      </ul>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Deadline:</strong> ${new Date(params.deadline).toLocaleDateString('en-GB')} • <strong>Priority:</strong> ${(params.priority || 'medium').toUpperCase()}</p>
      <p style="margin: 4px 0; font-size: 13px;"><strong>Dispatched By:</strong> ${params.assignedByName}</p>
    </div>
    <p style="font-size: 13px; color: #475569;">Each member may access the shared task workspace and coordinate deliverable submissions through the portal.</p>
  `;
  return {
    subject: `[MSA BIO] Committee Assignment: ${params.taskTitle}`,
    html: emailWrapper('Collaborative Academic Assignment', body, { text: 'Access Task Workspace', url: `http://localhost:3000/dashboard/tasks?taskId=${params.taskId}` }),
  };
}

// 5. Internal Supervisor Assignment
export function renderSupervisorAssignmentTemplate(params: { taskTitle: string; taskId: number; supervisorName: string; projectTitle: string; deadline: string }) {
  const body = `
    <p>Dear <strong>${params.supervisorName}</strong>,</p>
    <p>The Dean's Office and the Academic Affairs Committee have officially appointed you as <strong>Internal Academic Supervisor</strong> for the following graduation / capstone research project:</p>
    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 16px; margin: 16px 0; font-size: 13px;">
      <div><strong>Project Title:</strong> ${params.projectTitle}</div>
      <div style="margin-top: 6px;"><strong>Oversight Mandate:</strong> ${params.taskTitle}</div>
      <div style="margin-top: 6px;"><strong>Scheduled Evaluation / Submission:</strong> ${new Date(params.deadline).toLocaleDateString('en-GB')}</div>
    </div>
    <p style="font-size: 13px; color: #475569;">Please review student proposals, verify experimental milestones, and submit supervision milestone audits via the portal.</p>
  `;
  return {
    subject: `[MSA BIO] Appointment of Internal Supervisor: ${params.projectTitle}`,
    html: emailWrapper('Internal Academic Supervisor Appointment', body, { text: 'Open Supervision Dashboard', url: `http://localhost:3000/dashboard/tasks?taskId=${params.taskId}` }),
  };
}

// 6. Task Deadline Reminder
export function renderDeadlineReminderTemplate(params: { taskTitle: string; taskId: number; deadline: string; hoursRemaining: number; isOverdue: boolean }) {
  const isOverdue = params.isOverdue;
  const body = `
    <p>This is an automated academic deadline notification regarding task <strong>#${params.taskId}</strong>.</p>
    <div style="background-color: ${isOverdue ? '#fef2f2' : '#fffbeb'}; border-left: 4px solid ${isOverdue ? '#dc2626' : '#d97706'}; padding: 14px 16px; margin: 16px 0; font-size: 13px;">
      <div style="font-weight: 700; color: ${isOverdue ? '#991b1b' : '#92400e'};">${isOverdue ? '⚠️ DEADLINE OVERDUE' : '⏳ DEADLINE APPROACHING'}</div>
      <div style="margin-top: 4px; font-weight: 600;">${params.taskTitle}</div>
      <div style="margin-top: 4px;"><strong>Scheduled Deadline:</strong> ${new Date(params.deadline).toLocaleDateString('en-GB')} at ${new Date(params.deadline).toLocaleTimeString('en-GB')}</div>
      <div style="margin-top: 4px;"><strong>Time Remaining:</strong> ${isOverdue ? 'Past Due' : `${params.hoursRemaining} hours`}</div>
    </div>
    <p style="font-size: 13px; color: #475569;">Please upload all required deliverables, completion links, and documentation to the portal promptly.</p>
  `;
  return {
    subject: `[MSA BIO] ${isOverdue ? 'OVERDUE NOTICE' : 'Deadline Reminder'}: ${params.taskTitle}`,
    html: emailWrapper(isOverdue ? 'Task Deadline Overdue' : 'Upcoming Task Deadline', body, { text: 'Submit Deliverables', url: `http://localhost:3000/dashboard/tasks?taskId=${params.taskId}` }),
  };
}

// 7. Revision Request
export function renderRevisionRequestTemplate(params: { taskTitle: string; taskId: number; deanFeedback: string; deadline?: string }) {
  const body = `
    <p>The Dean's Executive Office has reviewed your recent submission for task <strong>#${params.taskId} ("${params.taskTitle}")</strong> and requested revisions prior to final accreditation sign-off.</p>
    <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 14px 16px; margin: 16px 0; font-size: 13px;">
      <div style="font-weight: 700; color: #9a3412;">Executive Review Feedback:</div>
      <div style="margin-top: 6px; font-style: italic; color: #334155;">"${params.deanFeedback}"</div>
      ${params.deadline ? `<div style="margin-top: 6px; color: #64748b;"><strong>Resubmission Target:</strong> ${new Date(params.deadline).toLocaleDateString('en-GB')}</div>` : ''}
    </div>
    <p style="font-size: 13px; color: #475569;">Please review the notes, make the necessary amendments, and resubmit through the portal.</p>
  `;
  return {
    subject: `[MSA BIO] Revision Requested: ${params.taskTitle}`,
    html: emailWrapper('Action Required: Task Revision Requested', body, { text: 'Resubmit Task in Portal', url: `http://localhost:3000/dashboard/tasks?taskId=${params.taskId}` }),
  };
}

// 8. Dean Approval Notification
export function renderDeanApprovalTemplate(params: { taskTitle: string; taskId: number; approvedAt: string; deanNotes?: string }) {
  const body = `
    <p>The Office of the Dean has officially reviewed, approved, and signed off on your completed task submission:</p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 16px; margin: 16px 0; font-size: 13px;">
      <div style="font-weight: 700; color: #166534;">✅ Dean Verified & Approved</div>
      <div style="margin-top: 4px; font-weight: 600;">${params.taskTitle} (#${params.taskId})</div>
      <div style="margin-top: 4px;"><strong>Approval Date:</strong> ${new Date(params.approvedAt).toLocaleDateString('en-GB')}</div>
      ${params.deanNotes ? `<div style="margin-top: 6px; color: #15803d;"><strong>Executive Note:</strong> ${params.deanNotes}</div>` : ''}
    </div>
    <p style="font-size: 13px; color: #475569;">This task has been archived with complete NAQAAE quality assurance documentation.</p>
  `;
  return {
    subject: `[MSA BIO] Dean Official Sign-Off: ${params.taskTitle}`,
    html: emailWrapper('Academic Task Verified & Approved', body, { text: 'View Completed Task', url: `http://localhost:3000/dashboard/tasks?taskId=${params.taskId}` }),
  };
}
