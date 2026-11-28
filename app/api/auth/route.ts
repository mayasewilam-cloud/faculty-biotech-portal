import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { queryFirst, execute, ensureAllStaffExist } from '@/lib/db';
import { createSession, deleteSession, getCurrentUser, getImpersonationInfo, invalidateAllUserSessions } from '@/lib/auth';
import { INITIAL_STAFF_SEED } from '@/lib/staff_seed';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// In-memory IP tracking for invalid token attempts (Rate Limiting)
const ipAttemptMap = new Map<string, { count: number; resetAt: number }>();

function checkIpRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = ipAttemptMap.get(ip);
  if (!entry) return { allowed: true };
  if (now > entry.resetAt) {
    ipAttemptMap.delete(ip);
    return { allowed: true };
  }
  if (entry.count >= 10) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

function recordIpFailure(ip: string): void {
  const now = Date.now();
  const entry = ipAttemptMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipAttemptMap.set(ip, { count: 1, resetAt: now + 5 * 60 * 1000 }); // 5-minute window
  } else {
    entry.count += 1;
  }
}

// Comprehensive password policy validator (min 8 chars, max 72 bytes for bcrypt)
function validatePasswordPolicy(password: any): { valid: boolean; error?: string } {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a valid string.' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  const byteLength = Buffer.byteLength(password, 'utf8');
  if (byteLength > 72) {
    return { valid: false, error: 'Password exceeds maximum allowed length of 72 bytes.' };
  }
  return { valid: true };
}

// Helper to check if a user is an Admin
function isAdminUser(user: any): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.id === 6496 || user.email === 'gehan.safwat@msa.edu.eg';
}

// Returns true ONLY if the user has explicitly set or changed their own personal password
const LEGACY_EMAIL_ALIASES: Record<string, string> = {
  "gehan.safwat@msa.edu.eg": "gsafwat@msa.edu.eg",
  "amr.ageez@msa.edu.eg": "aageez@msa.edu.eg",
  "ashraf.bakkar@msa.edu.eg": "abakkar@msa.edu.eg",
  "ahmed.aref@msa.edu.eg": "aaref@msa.edu.eg",
  "nabil.ibrahim@msa.edu.eg": "naibrahim@msa.edu.eg",
  "haidan.mostafa@msa.edu.eg": "hamsalem@msa.edu.eg",
  "yasmin.abdellatif@msa.edu.eg": "ylatif@msa.edu.eg",
  "sami.hamouda@msa.edu.eg": "mhamouda@msa.edu.eg",
  "hossam.taha@msa.edu.eg": "hotaha@msa.edu.eg",
  "ahmed.refaat@msa.edu.eg": "ahmrefaat@msa.edu.eg",
  "amgad.rady@msa.edu.eg": "amrady@msa.edu.eg",
  "mostafa.bakry@msa.edu.eg": "melbakry@msa.edu.eg",
  "samer.ismail@msa.edu.eg": "ssmohamed@msa.edu.eg",
  "ingy.elhefny@msa.edu.eg": "imaher@msa.edu.eg",
  "ahmed.gomaa@msa.edu.eg": "aigomaa@msa.edu.eg",
  "fayrouz.sayed@msa.edu.eg": "fsayed@msa.edu.eg",
  "karima.nasr@msa.edu.eg": "kamnasreldein@msa.edu.eg",
  "mohamed.hodhod@msa.edu.eg": "mshodhod@msa.edu.eg",
  "sameh.khalaf@msa.edu.eg": "samhisham@msa.edu.eg",
  "rania.momtaz@msa.edu.eg": "raazab@msa.edu.eg",
  "abdelaziz.nasr@msa.edu.eg": "abnasr@msa.edu.eg",
  "mai.ahmed@msa.edu.eg": "mshafei@msa.edu.eg",
  "yara.ahmed@msa.edu.eg": "ymuhammed@msa.edu.eg",
  "zahra.saleh@msa.edu.eg": "zsaleh@msa.edu.eg",
  "shaza.ahmed@msa.edu.eg": "shabib@msa.edu.eg",
  "mahmoud.m.soliman@msa.edu.eg": "mmsuleyman@msa.edu.eg",
  "ehab.ahmed@msa.edu.eg": "ehahmed@msa.edu.eg",
  "marwa.kenawy@msa.edu.eg": "melrefaie@msa.edu.eg",
  "nourhan.yasser@msa.edu.eg": "nyasser@msa.edu.eg",
  "gehad.tarek@msa.edu.eg": "gtibrahim@msa.edu.eg",
  "hoda.allam@msa.edu.eg": "hallam@msa.edu.eg",
  "fouad.ashry@msa.edu.eg": "fashry@msa.edu.eg",
  "maram.ahmed@msa.edu.eg": "marameldemardash10@gmail.com",
  "shorouk.mohamed@msa.edu.eg": "shosama@msa.edu.eg",
  "mahmoud.soliman@msa.edu.eg": "makhalaf@msa.edu.eg",
  "nashwa.hamido@msa.edu.eg": "nasmohamed@msa.edu.eg",
  "salma.effat@msa.edu.eg": "salahmed@msa.edu.eg",
  "youssef.abo.el.kheir@msa.edu.eg": "yaboulkheir@msa.edu.eg",
  "salma.omar@msa.edu.eg": "samahmoud@msa.edu.eg",
  "abdelrahman.saad@msa.edu.eg": "abdsaad@msa.edu.eg",
  "nada.el.gazzar@msa.edu.eg": "nhelgazzar@msa.edu.eg",
  "mohamed.mansour@msa.edu.eg": "mmshahat@msa.edu.eg",
  "nouran.yehia@msa.edu.eg": "nhemida@msa.edu.eg",
  "hadeer.refaee@msa.edu.eg": "hhrefaei@msa.edu.eg",
  "rawan.ali@msa.edu.eg": "rawmagdy@msa.edu.eg",
  "norhan.sabry@msa.edu.eg": "nsbary@msa.edu.eg",
  "mariam.zaki@msa.edu.eg": "mmzhassan@msa.edu.eg",
  "malak.haseeb@msa.edu.eg": "mazaki@msa.edu.eg",
  "nada.gebril@msa.edu.eg": "ngebriel@msa.edu.eg",
  "sara.badawi@msa.edu.eg": "sbadwai@msa.edu.eg",
  "hesham.fady@msa.edu.eg": "hfady@msa.edu.eg",
  "nour.ahmed@msa.edu.eg": "nouahmed@msa.edu.eg",
  "nada.sherif@msa.edu.eg": "nshsalaheldien@msa.edu.eg",
  "amr.walid@msa.edu.eg": "awalid@msa.edu.eg",
  "aya.el.gohary@msa.edu.eg": "ayaelgohary@msa.edu.eg",
  "youssef.maged@msa.edu.eg": "yomaged@msa.edu.eg",
  "maya.hany@msa.edu.eg": "mhany@msa.edu.eg",
  "mohamed.fahim@msa.edu.eg": "mefahim@msa.edu.eg",
  "aya.talaat@msa.edu.eg": "amtalaat@msa.edu.eg",
  "omnia.hefny@msa.edu.eg": "ohefny@msa.edu.eg",
  "habiba.khaled@msa.edu.eg": "hkmoussa@msa.edu.eg",
  "zohor.samir@msa.edu.eg": "zsamir@msa.edu.eg",
  "shahd.el.tarabily@msa.edu.eg": "sabdelsalam@msa.edu.eg",
  "norhan.el.hifnawy@msa.edu.eg": "nelhefnawy@msa.edu.eg",
  "faten.ehab@msa.edu.eg": "fehab@msa.edu.eg",
  "hagar.magdy@msa.edu.eg": "hmmhamed@msa.edu.eg",
  "sara.ayman@msa.edu.eg": "saayman@msa.edu.eg",
  "hala.moataz@msa.edu.eg": "hmoataz@msa.edu.eg",
  "chahd.wael@msa.edu.eg": "cwael@msa.edu.eg",
  "kenoz.omar@msa.edu.eg": "komar@msa.edu.eg",
  "rawan.salah@msa.edu.eg": "rasalah@msa.edu.eg",
  "ahmed.tamer@msa.edu.eg": "atamer@msa.edu.eg"
};

function hasUserChangedPassword(userRecord: any): boolean {
  if (!userRecord) return true;
  if (Number(userRecord.custom_password_set || 0) === 1) return true;
  const emailLower = String(userRecord.email || '').toLowerCase().trim();
  const seedUser = INITIAL_STAFF_SEED.find(
    (s) => s.id === Number(userRecord.id) || s.email.toLowerCase().trim() === emailLower
  );
  if (!seedUser) return true; // Newly registered user
  return false;
}

// GET /api/auth: Get current logged-in user
export async function GET() {
  try {
    await ensureAllStaffExist();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null, isImpersonating: false });
    }

    return NextResponse.json({
      user,
      isImpersonating: false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/auth: Handles login, password setting, registration, and password changes
export async function POST(req: Request) {
  try {
    await ensureAllStaffExist();
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request payload format' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // ─────────────────────────────────────────────────────────────
    // 1. DISABLE PROFILE SWITCHING / IMPERSONATION
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'switch' || body.action === 'revert_admin') {
      return NextResponse.json({ 
        error: 'Profile switching is disabled. Each faculty member must sign in with their own password.' 
      }, { status: 403 });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. FIRST-TIME PASSWORD SETUP & TOKEN VERIFICATION
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'set_password' || body.action === 'verify_setup_token') {
      const { token, email, password, new_password, purpose } = body;
      const targetPassword = new_password !== undefined ? new_password : password;

      // STRICTLY BLOCK UNAUTHENTICATED DIRECT OVERWRITES WITHOUT TOKEN
      if (!token) {
        return NextResponse.json({ 
          error: 'Direct unauthenticated password configuration is disabled. Please provide a single-use verification token, or sign in to change your password.' 
        }, { status: 403 });
      }

      if (typeof token !== 'string') {
        return NextResponse.json({ error: 'Verification token must be a string.' }, { status: 400 });
      }

      // Check IP rate limit on invalid attempts
      const ipStatus = checkIpRateLimit(clientIp);
      if (!ipStatus.allowed) {
        return NextResponse.json({ 
          error: `Too many failed verification attempts from this IP. Please wait ${ipStatus.retryAfter} seconds before retrying.` 
        }, { status: 429 });
      }

      // Compute SHA-256 hash of provided token
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      const tokenRecord = await queryFirst('SELECT * FROM password_reset_tokens WHERE token_hash = ?', [tokenHash]) as any;

      if (!tokenRecord) {
        recordIpFailure(clientIp);
        return NextResponse.json({ error: 'Invalid or expired verification token.' }, { status: 400 });
      }

      // Check revoked token limit
      if (tokenRecord.attempts >= 5) {
        return NextResponse.json({ error: 'Verification token revoked due to excessive failed attempts.' }, { status: 400 });
      }

      if (tokenRecord.used_at) {
        return NextResponse.json({ error: 'Verification token has already been used and is no longer valid.' }, { status: 400 });
      }

      if (new Date(tokenRecord.expires_at) <= new Date()) {
        return NextResponse.json({ error: 'Verification token has expired. Please request a new token.' }, { status: 400 });
      }

      // Purpose binding verification
      if (purpose !== undefined) {
        if (typeof purpose !== 'string') {
          await execute('UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE token_hash = ?', [tokenHash]);
          return NextResponse.json({ error: 'Purpose must be a valid string.' }, { status: 400 });
        }
        if (tokenRecord.purpose && purpose !== tokenRecord.purpose) {
          await execute('UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE token_hash = ?', [tokenHash]);
          return NextResponse.json({ error: 'Token was issued for a different purpose and cannot be used for this action.' }, { status: 400 });
        }
      }

      // Email account binding verification
      if (email !== undefined) {
        if (typeof email !== 'string') {
          await execute('UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE token_hash = ?', [tokenHash]);
          return NextResponse.json({ error: 'Email must be a valid string.' }, { status: 400 });
        }
        const targetUser = await queryFirst('SELECT email FROM users WHERE id = ?', [tokenRecord.user_id]) as any;
        if (targetUser && targetUser.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
          await execute('UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE token_hash = ?', [tokenHash]);
          return NextResponse.json({ error: 'Token is not bound to the specified email address.' }, { status: 400 });
        }
      }

      // Validate target password policy (min 8 chars, max 72 bytes)
      const pwdCheck = validatePasswordPolicy(targetPassword);
      if (!pwdCheck.valid) {
        await execute('UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE token_hash = ?', [tokenHash]);
        return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
      }

      // ATOMIC CLAIM: Conditional update verifying actual affected-row count
      const claimResult = await execute(
        'UPDATE password_reset_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL',
        [new Date().toISOString(), tokenHash]
      );

      if (!claimResult || claimResult.changes !== 1) {
        return NextResponse.json({ 
          error: 'Verification token has already been used or claimed by a concurrent request.' 
        }, { status: 400 });
      }

      // Update password hash and invalidate sessions
      try {
        const passwordHash = await bcrypt.hash(targetPassword, 10);
        await execute('UPDATE users SET password_hash = ?, custom_password_set = 1 WHERE id = ?', [passwordHash, tokenRecord.user_id]);
        await invalidateAllUserSessions(tokenRecord.user_id);
        cookieStore.delete('faculty_session');
      } catch (err: any) {
        // Consistent failure state: Revert token claim so user is not permanently locked out
        await execute('UPDATE password_reset_tokens SET used_at = NULL WHERE token_hash = ?', [tokenHash]);
        return NextResponse.json({ 
          error: 'Failed to update credentials. Verification token has been preserved.' 
        }, { status: 500 });
      }

      const targetUser = await queryFirst('SELECT * FROM users WHERE id = ?', [tokenRecord.user_id]) as any;

      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
        VALUES (?, ?, ?, 'SET_PASSWORD', 'Password Configured via Token', ?, '127.0.0.1')
      `, [
        targetUser?.id || tokenRecord.user_id,
        targetUser?.full_name || 'Faculty Member',
        targetUser?.role || 'staff',
        'Personal portal password established via verified token.'
      ]);

      return NextResponse.json({
        success: true,
        message: 'Password established successfully! Please sign in with your new credentials.',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2B. REQUEST SETUP TOKEN (Email Verification Workflow)
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'request_setup_token') {
      const { email } = body;
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
      }

      // Email transport is unconfigured; return safe response without user enumeration or token exposure
      return NextResponse.json({ 
        success: false, 
        configured: false, 
        error: "Automated email verification is currently unconfigured. Please contact the Faculty Administrator or Dean's office for an administrative account recovery token." 
      }, { status: 503 });
    }

    // ─────────────────────────────────────────────────────────────
    // 2C. ADMINISTRATIVE ACCOUNT RECOVERY
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'admin_recovery') {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized: Administrative authentication required' }, { status: 401 });
      }

      const isAdmin = currentUser.role === 'admin' || currentUser.id === 6496 || currentUser.email === 'gehan.safwat@msa.edu.eg';
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden: Only executive leadership or administrators can issue recovery tokens' }, { status: 403 });
      }

      const { target_email, target_user_id, purpose = 'recovery' } = body;
      if (!target_email && !target_user_id) {
        return NextResponse.json({ error: 'Target user email or ID is required' }, { status: 400 });
      }

      if (target_email !== undefined && typeof target_email !== 'string') {
        return NextResponse.json({ error: 'Target email must be a valid string' }, { status: 400 });
      }

      let normalizedTarget = (target_email || '').toLowerCase().trim();
      const targetUser = await queryFirst(
        'SELECT * FROM users WHERE LOWER(email) = ? OR id = ?',
        [normalizedTarget, target_user_id ? Number(target_user_id) : 0]
      ) as any;

      if (!targetUser) {
        return NextResponse.json({ error: 'Target faculty member not found' }, { status: 404 });
      }

      // Revoke any previous unused tokens for this user and purpose
      await execute(
        'UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND purpose = ? AND used_at IS NULL',
        [new Date().toISOString(), targetUser.id, purpose]
      );

      // Generate cryptographically secure single-use token (32 bytes = 64 hex chars)
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiration
      const tokenId = crypto.randomUUID();

      // Store only the hash of the token with purpose
      await execute(
        'INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_by_id, purpose) VALUES (?, ?, ?, ?, ?, ?)',
        [tokenId, targetUser.id, tokenHash, expiresAt, currentUser.id, purpose]
      );

      // Invalidate existing sessions for the target account
      await invalidateAllUserSessions(targetUser.id);

      // Record formal audit log
      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, metadata, ip_address)
        VALUES (?, ?, ?, 'ADMIN_ACCOUNT_RECOVERY', 'Administrative Password Recovery Initiated', ?, ?, '127.0.0.1')
      `, [
        currentUser.id,
        currentUser.full_name,
        currentUser.role,
        `Admin ${currentUser.title} ${currentUser.full_name} generated a single-use recovery token for ${targetUser.title} ${targetUser.full_name} (ID: ${targetUser.id}, Email: ${targetUser.email}).`,
        JSON.stringify({ affected_user_id: targetUser.id, affected_email: targetUser.email, expires_at: expiresAt, purpose })
      ]);

      return NextResponse.json({
        success: true,
        message: 'Account recovery token generated. Deliver this single-use token to the faculty member.',
        token: rawToken,
        expires_at: expiresAt,
        purpose,
        target_user: {
          id: targetUser.id,
          full_name: targetUser.full_name,
          email: targetUser.email,
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. REGISTER NEW FACULTY ACCOUNT
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'register') {
      const { email, password, full_name, title, department } = body;
      if (typeof email !== 'string' || typeof password !== 'string' || typeof full_name !== 'string') {
        return NextResponse.json({ error: 'Full name, email, and password must be valid strings' }, { status: 400 });
      }

      if (!email.trim() || !password || !full_name.trim()) {
        return NextResponse.json({ error: 'Full name, email, and password are required' }, { status: 400 });
      }

      const pwdCheck = validatePasswordPolicy(password);
      if (!pwdCheck.valid) {
        return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await queryFirst('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]) as any;
      if (existing) {
        return NextResponse.json({ 
          error: 'An account with this email already exists.' 
        }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const res = await execute(`
        INSERT INTO users (email, password_hash, full_name, title, role, department, avatar, created_at)
        VALUES (?, ?, ?, ?, 'staff', ?, ?, CURRENT_TIMESTAMP)
      `, [
        normalizedEmail,
        passwordHash,
        full_name.trim(),
        typeof title === 'string' && title.trim() ? title.trim() : 'Faculty Member',
        typeof department === 'string' && department.trim() ? department.trim() : 'Faculty of Biotechnology',
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name.trim())}`
      ]);

      const newUserId = (res as any).lastInsertRowid || Date.now();
      const sessionId = await createSession(newUserId);
      cookieStore.set('faculty_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return NextResponse.json({
        success: true,
        message: 'Account registered successfully! Welcome to the Faculty Portal.',
        user: {
          id: newUserId,
          email: normalizedEmail,
          full_name: full_name.trim(),
          title: typeof title === 'string' && title.trim() ? title.trim() : 'Faculty Member',
          role: 'staff',
          department: typeof department === 'string' && department.trim() ? department.trim() : 'Faculty of Biotechnology',
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. CHANGE PASSWORD (Authenticated Session with Current Password)
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'change_password') {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized: You must be logged in to change your password' }, { status: 401 });
      }

      const { current_password, new_password } = body;
      if (typeof current_password !== 'string' || typeof new_password !== 'string') {
        return NextResponse.json({ error: 'Current password and new password must be valid strings.' }, { status: 400 });
      }

      if (!current_password || !new_password) {
        return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
      }

      const pwdCheck = validatePasswordPolicy(new_password);
      if (!pwdCheck.valid) {
        return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
      }

      // Fetch user record with stored password hash
      const userRecord = await queryFirst('SELECT * FROM users WHERE id = ?', [currentUser.id]) as any;
      let passwordMatches = false;
      try {
        passwordMatches = Boolean(userRecord?.password_hash && bcrypt.compareSync(current_password, userRecord.password_hash));
      } catch {
        passwordMatches = false;
      }

      // Allow default initial passwords as current_password only if user has not changed it yet
      if (!passwordMatches && !hasUserChangedPassword(userRecord)) {
        const cleanCurrent = current_password.trim();
        if (
          cleanCurrent === 'Password2026!' ||
          cleanCurrent === 'Forall!@#123' ||
          ((userRecord?.id === 6496 || userRecord?.role === 'dean') && cleanCurrent === 'DeanExecutive2026!')
        ) {
          passwordMatches = true;
        }
      }

      if (!passwordMatches) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
      }

      try {
        const passwordHash = await bcrypt.hash(new_password, 10);
        await execute('UPDATE users SET password_hash = ?, custom_password_set = 1 WHERE id = ?', [passwordHash, currentUser.id]);
        await invalidateAllUserSessions(currentUser.id);
        cookieStore.delete('faculty_session');
      } catch (err: any) {
        return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
      }

      // Record activity log
      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
        VALUES (?, ?, ?, 'PASSWORD_CHANGED', 'Password Updated', ?, '127.0.0.1')
      `, [
        currentUser.id,
        currentUser.full_name,
        currentUser.role,
        `${currentUser.title} ${currentUser.full_name} updated their portal password. Previous sessions terminated.`
      ]);

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully. Your previous sessions have been invalidated. Please log in with your new password.',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. STANDARD CREDENTIAL LOGIN
    // ─────────────────────────────────────────────────────────────
    const { email, password } = body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password must be valid strings' }, { status: 400 });
    }

    if (!email.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let normalizedEmail = email.toLowerCase().trim();
    if (
      normalizedEmail === 'dean' ||
      normalizedEmail === 'dean@faculty.edu' ||
      normalizedEmail === 'dean@msa.edu.eg' ||
      normalizedEmail === 'gehan.safwat@faculty.edu' ||
      normalizedEmail === 'gehansafwat@msa.edu.eg'
    ) {
      normalizedEmail = 'gsafwat@msa.edu.eg';
    } else if (
      normalizedEmail === 'vicedean' ||
      normalizedEmail === 'vicedean@faculty.edu' ||
      normalizedEmail === 'vicedean@msa.edu.eg' ||
      normalizedEmail === 'amr.ageez@faculty.edu'
    ) {
      normalizedEmail = 'aageez@msa.edu.eg';
    } else if (
      normalizedEmail === 'maya.abdelrazek@msa.edu.eg' ||
      normalizedEmail === 'maya.abdelrazik@msa.edu.eg' ||
      normalizedEmail === 'maabdelrazik@msa.edu.eg'
    ) {
      normalizedEmail = 'maabdelrazek@msa.edu.eg';
    } else if (LEGACY_EMAIL_ALIASES[normalizedEmail]) {
      normalizedEmail = LEGACY_EMAIL_ALIASES[normalizedEmail];
    }

    const user = await queryFirst('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]) as any;
    if (!user) {
      return NextResponse.json({ error: 'Invalid university credentials' }, { status: 401 });
    }

    const rawPassword = String(password || '');
    const cleanPassword = rawPassword.trim();

    // Authenticate through individual bcrypt hash, with whitespace tolerance
    let passwordValid = false;
    try {
      if (user.password_hash) {
        passwordValid = bcrypt.compareSync(rawPassword, user.password_hash) ||
          (cleanPassword !== rawPassword && bcrypt.compareSync(cleanPassword, user.password_hash));
      }
    } catch {
      passwordValid = false;
    }

    // Default initial login fallback ONLY applies if the user has NOT changed their password yet.
    // Once a user changes their password for themselves, only their personal password is accepted.
    if (!passwordValid && !hasUserChangedPassword(user)) {
      if (user.id === 6496 || user.role === 'dean' || normalizedEmail === 'gehan.safwat@msa.edu.eg') {
        if (
          cleanPassword === 'DeanExecutive2026!' ||
          cleanPassword === 'Password2026!' ||
          cleanPassword === 'Forall!@#123'
        ) {
          passwordValid = true;
        }
      }

      if (!passwordValid && (cleanPassword === 'Password2026!' || cleanPassword === 'Forall!@#123')) {
        passwordValid = true;
      }
    }

    if (!passwordValid) {
      return NextResponse.json({ 
        error: 'Invalid credentials. Please verify your password or contact the Dean\'s office for password recovery.' 
      }, { status: 401 });
    }

    // Clear any previous impersonation cookie
    cookieStore.delete('super_admin_origin');

    const sessionId = await createSession(user.id);
    cookieStore.set('faculty_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    // Log login event
    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
      VALUES (?, ?, ?, 'LOGIN', ?, ?, ?)
    `, [
      user.id,
      user.full_name,
      user.role,
      user.role === 'admin' ? 'Faculty Leadership Logged In' : 'Faculty Member Logged In',
      `${user.title} ${user.full_name} authenticated into the portal`,
      '127.0.0.1'
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        title: user.title,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
      },
      isImpersonating: false,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'An unexpected authentication error occurred.' }, { status: 500 });
  }
}

// DELETE /api/auth: Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('faculty_session')?.value;
    if (sessionId) {
      await deleteSession(sessionId);
    }
    cookieStore.delete('faculty_session');
    cookieStore.delete('super_admin_origin');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
