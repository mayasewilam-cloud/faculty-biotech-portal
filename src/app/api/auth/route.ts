
import { NextResponse } from 'next/server';
import { queryFirst, execute, ensureAllStaffExist } from '@/lib/db';
import { createSession, deleteSession, getCurrentUser, getImpersonationInfo } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Helper to check if a user is one of the Super Admins
function isSuperAdminUser(user: any): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.id === 99 || user.id === 6496 || user.id === 6591 || user.email === 'admin@faculty.edu' || user.email === 'gehan.safwat@msa.edu.eg' || user.email === 'amr.ageez@msa.edu.eg';
}

// GET /api/auth: Get current logged-in user and impersonation status
export async function GET() {
  try {
    await ensureAllStaffExist();
    const user = await getCurrentUser();
    const { isImpersonating, adminUserId } = await getImpersonationInfo();

    if (!user) {
      return NextResponse.json({ user: null, isImpersonating: false });
    }

    let adminUser = null;
    if (isImpersonating && adminUserId) {
      adminUser = await queryFirst('SELECT id, email, full_name, title, role, department, avatar FROM users WHERE id = ?', [adminUserId]);
    }

    return NextResponse.json({
      user,
      isImpersonating,
      adminUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/auth: Handles login, Super Admin account switching, and revert
export async function POST(req: Request) {
  try {
    await ensureAllStaffExist();
    const body = await req.json();
    const cookieStore = await cookies();

    // ─────────────────────────────────────────────────────────────
    // 1. REVERT TO SUPER ADMIN (1-click exit from impersonation)
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'revert_admin') {
      const { isImpersonating, adminUserId } = await getImpersonationInfo();
      const currentUser = await getCurrentUser();

      if (!isImpersonating && !isSuperAdminUser(currentUser)) {
        return NextResponse.json({ 
          error: 'Access Denied: You are not in a Super Admin impersonation session.' 
        }, { status: 403 });
      }

      const adminId = adminUserId || (currentUser ? currentUser.id : 99);
      const adminUser = await queryFirst("SELECT * FROM users WHERE id = ?", [adminId]) as any;
      if (!adminUser) {
        return NextResponse.json({ error: 'Super Admin account not found' }, { status: 404 });
      }

      const sessionId = await createSession(adminUser.id);
      cookieStore.set('faculty_session', sessionId, {
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      cookieStore.delete('super_admin_origin');

      // Audit Log for Session Restore
      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
        VALUES (?, ?, ?, 'ADMIN_REVERT', 'Super Admin Restored Session', ?, '127.0.0.1')
      `, [
        adminUser.id,
        adminUser.full_name,
        adminUser.role,
        `${adminUser.title} ${adminUser.full_name} returned from impersonation session to central command.`
      ]);

      return NextResponse.json({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.full_name,
          title: adminUser.title,
          role: adminUser.role,
          department: adminUser.department,
          avatar: adminUser.avatar,
        },
        isImpersonating: false,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ACCOUNT ACCESS / IMPERSONATION (Strictly Super Admin ONLY)
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'switch') {
      const currentUser = await getCurrentUser();
      const { isImpersonating, adminUserId } = await getImpersonationInfo();
      const isAuthorized = isSuperAdminUser(currentUser) || isImpersonating;

      // STRICT SECURITY BOUNDARY:
      // Regular accounts CANNOT access other accounts or Super Admins!
      if (!isAuthorized) {
        return NextResponse.json({ 
          error: 'Access Denied: Only Super Admins (Admin, Dean Prof. Gehan Safwat, Vice Dean Prof. Amr Ageez) have permission to access other accounts. Regular accounts cannot access other accounts.' 
        }, { status: 403 });
      }

      const targetUser = await queryFirst('SELECT * FROM users WHERE id = ?', [body.userId]) as any;
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user account not found' }, { status: 404 });
      }

      const originalAdminId = adminUserId || (currentUser ? currentUser.id : 99);

      // If switching directly back to one of the Super Admins
      if (isSuperAdminUser(targetUser)) {
        cookieStore.delete('super_admin_origin');
        const sessionId = await createSession(targetUser.id);
        cookieStore.set('faculty_session', sessionId, {
          httpOnly: true,
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        });

        await execute(`
          INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
          VALUES (?, ?, 'admin', 'ADMIN_RESTORE', 'Super Admin Restored Session', ?, '127.0.0.1')
        `, [
          targetUser.id,
          targetUser.full_name,
          `${targetUser.title} ${targetUser.full_name} returned to central Super Admin session.`
        ]);

        return NextResponse.json({
          success: true,
          user: {
            id: targetUser.id,
            email: targetUser.email,
            full_name: targetUser.full_name,
            title: targetUser.title,
            role: targetUser.role,
            department: targetUser.department,
            avatar: targetUser.avatar,
          },
          isImpersonating: false,
        });
      }

      // Switching from Super Admin to a Faculty/Staff account
      cookieStore.set('super_admin_origin', String(originalAdminId), {
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      const sessionId = await createSession(targetUser.id);
      cookieStore.set('faculty_session', sessionId, {
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      // Audit Log: Track Super Admin Access Event
      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
        VALUES (?, 'Super Admin', 'admin', 'SUPER_ADMIN_IMPERSONATION', 'Super Admin Accessed Faculty Account', ?, '127.0.0.1')
      `, [
        originalAdminId,
        `Super Admin accessed the account of ${targetUser.title} ${targetUser.full_name} (${targetUser.role.toUpperCase()} — ${targetUser.department}).`
      ]);

      return NextResponse.json({
        success: true,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          full_name: targetUser.full_name,
          title: targetUser.title,
          role: targetUser.role,
          department: targetUser.department,
          avatar: targetUser.avatar,
        },
        isImpersonating: true,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. STANDARD CREDENTIAL LOGIN
    // ─────────────────────────────────────────────────────────────
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Support university aliases
    let normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'dean@faculty.edu' || normalizedEmail === 'gehan.safwat@faculty.edu') {
      normalizedEmail = 'gehan.safwat@msa.edu.eg';
    } else if (normalizedEmail === 'vicedean@faculty.edu' || normalizedEmail === 'amr.ageez@faculty.edu') {
      normalizedEmail = 'amr.ageez@msa.edu.eg';
    }

    const user = await queryFirst('SELECT * FROM users WHERE email = ?', [normalizedEmail]) as any;
    if (!user) {
      return NextResponse.json({ error: 'Invalid university credentials' }, { status: 401 });
    }

    // Validate user credentials:
    // Admin and Dr. Ahmed Mohamed accept 'Forall!@#123'
    // All other faculty members must authenticate with their individual distinct password
    const isSpecialForall = password === 'Forall!@#123' && (
      user.id === 99 || 
      user.id === 12230 || 
      user.email === 'admin@faculty.edu' || 
      user.email === 'ahmed.mohamed@msa.edu.eg' ||
      user.email === 'gehan.safwat@msa.edu.eg' ||
      user.role === 'admin'
    );
    const passwordValid = isSpecialForall || (user.password_hash && bcrypt.compareSync(password, user.password_hash));
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid university credentials' }, { status: 401 });
    }

    // Clear any previous impersonation cookie on clean login
    cookieStore.delete('super_admin_origin');

    const sessionId = await createSession(user.id);
    cookieStore.set('faculty_session', sessionId, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    const isSuperAdmin = isSuperAdminUser(user);

    // Log login event
    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
      VALUES (?, ?, ?, 'LOGIN', ?, ?, ?)
    `, [
      user.id,
      user.full_name,
      user.role,
      isSuperAdmin ? 'Super Admin Logged In' : 'Faculty Member Logged In',
      isSuperAdmin 
        ? `${user.title} ${user.full_name} authenticated with Super Admin universal faculty access`
        : `${user.title} ${user.full_name} authenticated into the portal`,
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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
