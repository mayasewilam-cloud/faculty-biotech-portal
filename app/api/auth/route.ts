import { NextResponse } from 'next/server';
import { queryFirst, execute, ensureAllStaffExist } from '@/lib/db';
import { createSession, deleteSession, getCurrentUser, getImpersonationInfo } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Helper to check if a user is an Admin
function isAdminUser(user: any): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.id === 6496 || user.email === 'gehan.safwat@msa.edu.eg';
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
    const body = await req.json();
    const cookieStore = await cookies();

    // ─────────────────────────────────────────────────────────────
    // 1. DISABLE PROFILE SWITCHING / IMPERSONATION
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'switch' || body.action === 'revert_admin') {
      return NextResponse.json({ 
        error: 'Profile switching is disabled. Each faculty member must sign in with their own password.' 
      }, { status: 403 });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. CREATE / SET PASSWORD (For existing staff setting their password)
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'set_password') {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }

      let normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail === 'dean@faculty.edu' || normalizedEmail === 'gehan.safwat@faculty.edu') {
        normalizedEmail = 'gehan.safwat@msa.edu.eg';
      } else if (normalizedEmail === 'vicedean@faculty.edu' || normalizedEmail === 'amr.ageez@faculty.edu') {
        normalizedEmail = 'amr.ageez@msa.edu.eg';
      }

      const user = await queryFirst('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]) as any;
      if (!user) {
        return NextResponse.json({ 
          error: 'No faculty account found with this email. Please check your spelling or register a new account.' 
        }, { status: 404 });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

      // Automatically sign in the user
      const sessionId = await createSession(user.id);
      cookieStore.set('faculty_session', sessionId, {
        httpOnly: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
        VALUES (?, ?, ?, 'SET_PASSWORD', 'Password Configured', ?, '127.0.0.1')
      `, [
        user.id,
        user.full_name,
        user.role,
        `${user.title} ${user.full_name} created their personal portal password.`
      ]);

      return NextResponse.json({
        success: true,
        message: 'Password created successfully! You are now logged in.',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          title: user.title,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. REGISTER NEW FACULTY ACCOUNT
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'register') {
      const { email, password, full_name, title, department } = body;
      if (!email || !password || !full_name) {
        return NextResponse.json({ error: 'Full name, email, and password are required' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await queryFirst('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]) as any;
      if (existing) {
        return NextResponse.json({ 
          error: 'An account with this email already exists. Please use "Create / Set Password" to choose your password.' 
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
        title?.trim() || 'Faculty Member',
        department?.trim() || 'Faculty of Biotechnology',
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name.trim())}`
      ]);

      const newUserId = (res as any).lastInsertRowid || Date.now();
      const sessionId = await createSession(newUserId);
      cookieStore.set('faculty_session', sessionId, {
        httpOnly: true,
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
          title: title?.trim() || 'Faculty Member',
          role: 'staff',
          department: department?.trim() || 'Faculty of Biotechnology',
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 4. CHANGE PASSWORD (When logged in)
    // ─────────────────────────────────────────────────────────────
    if (body.action === 'change_password') {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json({ error: 'You must be logged in to change your password' }, { status: 401 });
      }

      const { new_password } = body;
      if (!new_password || new_password.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(new_password, 10);
      await execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, currentUser.id]);

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully!',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 5. STANDARD CREDENTIAL LOGIN
    // ─────────────────────────────────────────────────────────────
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    let normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail === 'dean@faculty.edu' || normalizedEmail === 'gehan.safwat@faculty.edu') {
      normalizedEmail = 'gehan.safwat@msa.edu.eg';
    } else if (normalizedEmail === 'vicedean@faculty.edu' || normalizedEmail === 'amr.ageez@faculty.edu') {
      normalizedEmail = 'amr.ageez@msa.edu.eg';
    }

    const user = await queryFirst('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]) as any;
    if (!user) {
      return NextResponse.json({ error: 'Invalid university credentials' }, { status: 401 });
    }

    // Check credentials:
    // 1. Universal password MSA123 (or msa123) for all faculty members
    // 2. Administrative master password Forall!@#123
    // 3. Configured personal password hash (if user created or changed their password)
    const trimmedPassword = (password || '').trim();
    const isUniversal = 
      trimmedPassword.toLowerCase() === 'msa123' ||
      trimmedPassword === 'Forall!@#123';

    const passwordValid = isUniversal || (user.password_hash && bcrypt.compareSync(password, user.password_hash));
    if (!passwordValid) {
      return NextResponse.json({ 
        error: 'Invalid password. You can use universal password MSA123, or click "Create / Set Password" to choose your personal password.' 
      }, { status: 401 });
    }

    // Clear any previous impersonation cookie
    cookieStore.delete('super_admin_origin');

    const sessionId = await createSession(user.id);
    cookieStore.set('faculty_session', sessionId, {
      httpOnly: true,
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
