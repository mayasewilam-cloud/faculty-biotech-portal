
import { NextResponse } from 'next/server';
import { queryAll, queryFirst, execute, ensureAllStaffExist } from '@/lib/db';
import { getCurrentUser, getImpersonationInfo } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/users: Staff Directory with task metrics
export async function GET() {
  try {
    await ensureAllStaffExist();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isImpersonating } = await getImpersonationInfo();
    const isSuperAdmin = user.role === 'admin' || user.id === 99 || user.id === 6496 || user.id === 6591 || isImpersonating;

    // Security Rule: The abstract Higher Super Admin ('Admin', ID 99) is hidden from regular non-admin staff
    let userFilter = '';
    if (!isSuperAdmin) {
      userFilter = `WHERE u.id != 99`;
    }

    const users = await queryAll(`
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.title,
        u.role,
        u.department,
        u.phone,
        u.avatar,
        u.status,
        u.created_at,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN t.deadline < datetime('now') AND t.status != 'done' THEN 1 ELSE 0 END) as overdue_tasks
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to_id
      ${userFilter}
      GROUP BY u.id
      ORDER BY 
        CASE WHEN u.id = 99 THEN 0
             WHEN u.id = 6496 THEN 1
             WHEN u.id = 6591 THEN 2
             WHEN u.title LIKE '%Dean%' THEN 3
             WHEN u.title LIKE '%Prof%' THEN 4
             WHEN u.title LIKE '%Dr%' THEN 5
             ELSE 6 END,
        u.full_name ASC
    `);

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/users: Register single or bulk import faculty/staff members (Admin/Dean only)
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { isImpersonating } = await getImpersonationInfo();
    const isAuthorized = currentUser && (
      currentUser.role === 'admin' || 
      currentUser.id === 99 || 
      currentUser.id === 6496 || 
      currentUser.id === 6591 || 
      isImpersonating
    );

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Permission denied. Only Super Admin or Dean can register faculty accounts.' }, { status: 403 });
    }

    const body = await req.json();

    // ── Bulk Import Mode ──────────────────────────────────────
    if (Array.isArray(body.users)) {
      const usersToImport = body.users;
      if (usersToImport.length === 0) {
        return NextResponse.json({ error: 'No users provided in bulk list' }, { status: 400 });
      }

      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      const defaultSalt = bcrypt.genSaltSync(10);
      const defaultHash = bcrypt.hashSync('faculty123', defaultSalt);

      for (const item of usersToImport) {
        const rawEmail = (item.email || '').toLowerCase().trim();
        const rawName = (item.full_name || item.name || '').trim();

        if (!rawEmail || !rawName) {
          skipped++;
          continue;
        }

        const rawTitle = item.title || (item.role === 'professor' ? 'Prof. Dr.' : 'Staff Member');
        const rawRole = item.role || 'staff';
        const rawDept = item.department || 'Academic Staff';
        const rawPhone = item.phone || '';

        const existing = await queryFirst('SELECT id FROM users WHERE email = ?', [rawEmail]);
        if (existing) {
          // Update existing profile details
          await execute(`
            UPDATE users 
            SET full_name = ?, title = ?, role = ?, department = ?, phone = COALESCE(NULLIF(?, ''), phone)
            WHERE id = ?
          `, [rawName, rawTitle, rawRole, rawDept, rawPhone, existing.id]);
          updated++;
        } else {
          // Insert new user
          const passwordHash = item.password ? bcrypt.hashSync(item.password, bcrypt.genSaltSync(10)) : defaultHash;
          await execute(`
            INSERT INTO users (email, password_hash, full_name, title, role, department, phone, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            rawEmail,
            passwordHash,
            rawName,
            rawTitle,
            rawRole,
            rawDept,
            rawPhone,
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rawName)}`
          ]);
          imported++;
        }
      }

      // Log bulk import
      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
        VALUES (?, ?, ?, 'STAFF_BULK_IMPORTED', ?, ?, ?)
      `, [
        currentUser.id,
        currentUser.full_name,
        currentUser.role,
        `Bulk Imported Faculty Directory List`,
        `Successfully imported ${imported} new faculty members and updated ${updated} existing records.`,
        '127.0.0.1'
      ]);

      return NextResponse.json({
        success: true,
        imported,
        updated,
        skipped,
        total: usersToImport.length,
      });
    }

    // ── Single Member Registration ─────────────────────────────
    const { email, password, full_name, title, role, department, phone } = body;

    if (!email || !password || !full_name || !role || !department) {
      return NextResponse.json({ error: 'Email, password, full name, role, and department are required' }, { status: 400 });
    }

    const existing = await queryFirst('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 400 });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const result = await execute(`
      INSERT INTO users (email, password_hash, full_name, title, role, department, phone, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      email.toLowerCase().trim(),
      passwordHash,
      full_name,
      title || (role === 'professor' ? 'Prof. Dr.' : 'Staff Member'),
      role,
      department,
      phone || '',
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`
    ]);

    const newUserId = result.lastInsertRowid;

    // Log the event
    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
      VALUES (?, ?, ?, 'STAFF_CREATED', ?, ?, ?)
    `, [
      currentUser.id,
      currentUser.full_name,
      currentUser.role,
      `Registered New Faculty Member: ${full_name}`,
      `Account created for ${title || ''} ${full_name} (${role.toUpperCase()}) in ${department}. Credentials dispatched.`,
      '127.0.0.1'
    ]);

    const newUser = await queryFirst('SELECT id, email, full_name, title, role, department, phone, avatar FROM users WHERE id = ?', [newUserId]);

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/users: Edit/Update existing faculty member details (Admin/Dean only)
export async function PUT(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { isImpersonating } = await getImpersonationInfo();
    const isAuthorized = currentUser && (
      currentUser.role === 'admin' || 
      currentUser.id === 99 || 
      currentUser.id === 6496 || 
      currentUser.id === 6591 || 
      isImpersonating
    );

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Permission denied. Only Super Admin or Dean can update faculty accounts.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, email, full_name, title, role, department, phone, password, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Faculty User ID is required' }, { status: 400 });
    }

    const targetUser = await queryFirst('SELECT * FROM users WHERE id = ?', [Number(id)]);
    if (!targetUser) {
      return NextResponse.json({ error: 'Faculty member not found' }, { status: 404 });
    }

    // Check email uniqueness if changing email
    if (email && email.toLowerCase().trim() !== targetUser.email.toLowerCase()) {
      const emailClash = await queryFirst('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase().trim(), Number(id)]);
      if (emailClash) {
        return NextResponse.json({ error: 'Another faculty member with this email already exists' }, { status: 400 });
      }
    }

    const updatedEmail = email ? email.toLowerCase().trim() : targetUser.email;
    const updatedName = full_name ? full_name.trim() : targetUser.full_name;
    const updatedTitle = title !== undefined ? title : targetUser.title;
    const updatedRole = role !== undefined ? role : targetUser.role;
    const updatedDept = department !== undefined ? department : targetUser.department;
    const updatedPhone = phone !== undefined ? phone : targetUser.phone;
    const updatedStatus = status !== undefined ? status : targetUser.status;

    let updatePasswordSql = '';
    const updateParams: any[] = [updatedEmail, updatedName, updatedTitle, updatedRole, updatedDept, updatedPhone, updatedStatus];

    if (password && password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password.trim(), salt);
      updatePasswordSql = ', password_hash = ?';
      updateParams.push(passwordHash);
    }

    updateParams.push(Number(id));

    await execute(`
      UPDATE users 
      SET email = ?, full_name = ?, title = ?, role = ?, department = ?, phone = ?, status = ? ${updatePasswordSql}
      WHERE id = ?
    `, updateParams);

    // Log the update
    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
      VALUES (?, ?, ?, 'STAFF_UPDATED', ?, ?, ?)
    `, [
      currentUser.id,
      currentUser.full_name,
      currentUser.role,
      `Updated Faculty Profile: ${updatedName}`,
      `Details modified: Role=${updatedRole}, Dept=${updatedDept}, Title=${updatedTitle}.`,
      '127.0.0.1'
    ]);

    const updated = await queryFirst('SELECT id, email, full_name, title, role, department, phone, avatar, status FROM users WHERE id = ?', [Number(id)]);
    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/users: Delete/Remove faculty member (Admin/Dean only)
export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const { isImpersonating } = await getImpersonationInfo();
    const isAuthorized = currentUser && (
      currentUser.role === 'admin' || 
      currentUser.id === 99 || 
      currentUser.id === 6496 || 
      currentUser.id === 6591 || 
      isImpersonating
    );

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Permission denied. Only Super Admin or Dean can remove faculty accounts.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUserId = Number(id);

    // Protected Accounts Protection: Never allow deleting Root Admin, Dean Prof. Gehan, or Vice Dean Prof. Amr
    if (targetUserId === 99 || targetUserId === 6496 || targetUserId === 6591) {
      return NextResponse.json({ error: 'Constitutional leadership accounts (Dean, Vice Dean, Admin) cannot be deleted.' }, { status: 403 });
    }

    const targetUser = await queryFirst('SELECT * FROM users WHERE id = ?', [targetUserId]);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reassign any remaining tasks to the Dean (6496) to preserve institutional continuity
    await execute('UPDATE tasks SET assigned_to_id = 6496, assigned_to_name = "Prof. Dr. Gehan Safwat" WHERE assigned_to_id = ?', [targetUserId]);

    // Delete the user
    await execute('DELETE FROM users WHERE id = ?', [targetUserId]);

    // Log the deletion
    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
      VALUES (?, ?, ?, 'STAFF_DELETED', ?, ?, ?)
    `, [
      currentUser.id,
      currentUser.full_name,
      currentUser.role,
      `Removed Faculty Member: ${targetUser.full_name}`,
      `Removed faculty account ${targetUser.email} (ID: ${targetUserId}) from faculty directory. Any open tasks were archived and reassigned to the Dean's Office.`,
      '127.0.0.1'
    ]);

    return NextResponse.json({ success: true, message: `Faculty member ${targetUser.full_name} removed successfully` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
