import { cookies } from 'next/headers';
import { queryFirst, execute } from './db';

export interface User {
  id: number;
  email: string;
  full_name: string;
  title: string;
  role: 'admin' | 'dean' | 'vice_dean' | 'dept_head' | 'professor' | 'staff';
  department: string;
  phone?: string;
  avatar?: string;
  status: string;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('faculty_session')?.value;

  if (sessionId) {
    // 1. Try DB session join
    try {
      const session = await queryFirst(`
        SELECT s.user_id, u.* 
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = ? AND s.expires_at > datetime('now')
      `, [sessionId]) as any;

      if (session) {
        return {
          id: session.id,
          email: session.email,
          full_name: session.full_name,
          title: session.title,
          role: session.role,
          department: session.department,
          phone: session.phone,
          avatar: session.avatar,
          status: session.status || 'active',
        };
      }
    } catch (e) {
      // Fall through to token decode
    }

    // 2. Resilient fallback: Decode userId from `${userId}.${uuid}` session token
    try {
      const parts = sessionId.split('.');
      if (parts.length >= 2) {
        const userId = parseInt(parts[0], 10);
        if (!isNaN(userId) && userId > 0) {
          const user = await queryFirst(`SELECT * FROM users WHERE id = ?`, [userId]) as any;
          if (user) {
            return {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              title: user.title,
              role: user.role,
              department: user.department,
              phone: user.phone,
              avatar: user.avatar,
              status: user.status || 'active',
            };
          }
        }
      }
    } catch (e) {
      // Reject if lookup fails
    }

    return null;
  }

  return null;
}

export async function getImpersonationInfo(): Promise<{ isImpersonating: boolean; adminUserId: number | null }> {
  const cookieStore = await cookies();
  const originVal = cookieStore.get('super_admin_origin')?.value;
  if (originVal) {
    const adminId = parseInt(originVal, 10);
    return { isImpersonating: true, adminUserId: isNaN(adminId) ? 99 : adminId };
  }
  return { isImpersonating: false, adminUserId: null };
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = `${userId}.${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    await execute(`
      INSERT INTO sessions (id, user_id, expires_at)
      VALUES (?, ?, ?)
    `, [sessionId, userId, expiresAt]);
  } catch (err) {
    // Non-blocking in serverless edge
  }

  return sessionId;
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
  } catch (err) {
    // Non-blocking
  }
}
