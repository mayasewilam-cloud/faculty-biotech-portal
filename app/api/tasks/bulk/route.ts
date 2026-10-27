
import { NextResponse } from 'next/server';
import { queryAll, queryFirst, execute, getCommitteeById } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/tasks/bulk: Handles both bulk task creation and bulk task actions
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { operation } = body;

    const isDeanOrAdmin = user.role === 'admin' || user.id === 99 || user.id === 6496 || user.id === 6591 || user.role === 'dean' || user.role === 'vice_dean' || user.role === 'dept_head';

    // ─────────────────────────────────────────────────────────────
    // 1. BULK DISPATCH / CREATION (Dean & Leadership)
    // ─────────────────────────────────────────────────────────────
    if (operation === 'dispatch_bulk') {
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Permission denied. Only leadership can dispatch bulk tasks.' }, { status: 403 });
      }

      const { 
        title, 
        description, 
        priority = 'medium', 
        deadline, 
        target_type, 
        target_dept, 
        target_hat_id, 
        target_committee_id,
        user_ids,
        task_owner_id,
        task_owner_name,
        requires_dean_approval = 0,
        responsibility_model = 'standard',
        attachment_name,
        attachment_type,
        attachment_size,
        attachment_url
      } = body;

      if (!title || !description || !deadline) {
        return NextResponse.json({ error: 'Title, description, and deadline are required' }, { status: 400 });
      }

      let targetUserIds: number[] = [];
      let hatName = '';
      let committeeName = '';

      if (target_type === 'hat' && target_hat_id) {
        const hId = Number(target_hat_id);
        const hat = await queryFirst('SELECT name FROM hats WHERE id = ?', [hId]);
        hatName = hat?.name || 'Hat';
        const hatMembers = await queryAll('SELECT user_id FROM hat_members WHERE hat_id = ?', [hId]) as any[];
        targetUserIds = hatMembers.map(m => Number(m.user_id));
      } else if (target_type === 'committee' && target_committee_id) {
        const cId = Number(target_committee_id);
        const comm = await getCommitteeById(cId);
        committeeName = comm?.name || 'Committee';
        if (comm && Array.isArray(comm.members)) {
          targetUserIds = comm.members.map((m: any) => Number(m.user_id)).filter(Boolean);
        }
        if (targetUserIds.length === 0 && comm?.chair_id) {
          targetUserIds = [comm.chair_id];
        }
      } else if (target_type === 'department' && target_dept) {
        const deptUsers = await queryAll('SELECT id FROM users WHERE department = ? AND role NOT IN ("dean", "admin") AND id NOT IN (99, 6496, 6591)', [target_dept]) as any[];
        targetUserIds = deptUsers.map(u => u.id);
      } else if (target_type === 'all_staff') {
        const allStaff = await queryAll('SELECT id FROM users WHERE role NOT IN ("dean", "admin") AND id NOT IN (99, 6496, 6591)') as any[];
        targetUserIds = allStaff.map(u => u.id);
      } else if (target_type === 'selected_users' && Array.isArray(user_ids) && user_ids.length > 0) {
        targetUserIds = user_ids.map(Number);
      }

      if (targetUserIds.length === 0) {
        const entityLabel = target_type === 'hat' ? `"${hatName}" Hat` : target_type === 'committee' ? `"${committeeName}" Committee` : 'this bulk dispatch criteria';
        return NextResponse.json({ error: `No members found in ${entityLabel} to assign tasks to.` }, { status: 400 });
      }

      // Fetch recipient profiles
      const placeholders = targetUserIds.map(() => '?').join(',');
      const recipients = await queryAll(`SELECT * FROM users WHERE id IN (${placeholders})`, targetUserIds) as any[];

      const createdTasks: any[] = [];
      const assignedHatId = target_type === 'hat' ? Number(target_hat_id) : null;
      const assignedCommitteeId = target_type === 'committee' ? Number(target_committee_id) : null;
      const campaignGroupId = `campaign_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      // Model A: Shared Deliverable (1 Consolidated Task for the group)
      if (responsibility_model === 'shared_deliverable') {
        const leadUser = recipients.find(r => r.id === Number(task_owner_id)) || recipients[0] || user;
        const result = await execute(`
          INSERT INTO tasks (
            title, description, assigned_by_id, assigned_to_id, department, hat_id, 
            committee_id, committee_name, priority, deadline, status, 
            attachment_name, attachment_type, attachment_size, attachment_url,
            task_owner_id, task_owner_name, requires_dean_approval, responsibility_model, group_id
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 'shared_deliverable', ?)
        `, [
          title,
          description,
          user.id,
          leadUser.id,
          leadUser.department,
          assignedHatId,
          assignedCommitteeId,
          committeeName || hatName || null,
          priority,
          deadline,
          attachment_name || null,
          attachment_type || null,
          attachment_size ? Number(attachment_size) : null,
          attachment_url || null,
          task_owner_id ? Number(task_owner_id) : leadUser.id,
          task_owner_name || leadUser.full_name,
          requires_dean_approval ? 1 : 0,
          campaignGroupId
        ]);

        const taskId = result.lastInsertRowid;
        createdTasks.push({ id: taskId, recipient: `${leadUser.full_name} (Shared Deliverable for ${recipients.length} members)` });

        await execute(`
          INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, metadata, ip_address)
          VALUES (?, ?, ?, 'TASK_CREATED', ?, ?, ?, ?, ?)
        `, [
          user.id,
          user.full_name,
          user.role,
          taskId,
          `Shared Committee Deliverable Created: "${title}"`,
          `Assigned to lead ${leadUser.full_name} for ${committeeName || hatName || 'Group'}.`,
          JSON.stringify({ model: 'shared_deliverable', memberCount: recipients.length }),
          '127.0.0.1'
        ]);
      } else {
        // Model B/C: Separate Submissions per Member (Linked by group_id for Campaign roll-up)
        for (const recipient of recipients) {
          const result = await execute(`
            INSERT INTO tasks (
              title, description, assigned_by_id, assigned_to_id, department, hat_id, 
              committee_id, committee_name, priority, deadline, status, 
              attachment_name, attachment_type, attachment_size, attachment_url,
              task_owner_id, task_owner_name, requires_dean_approval, responsibility_model, group_id, source
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, 'individual_submissions', ?, 'portal')
          `, [
            title,
            description,
            user.id,
            recipient.id,
            recipient.department,
            assignedHatId,
            assignedCommitteeId,
            committeeName || hatName || null,
            priority,
            deadline,
            attachment_name || null,
            attachment_type || null,
            attachment_size ? Number(attachment_size) : null,
            attachment_url || null,
            task_owner_id ? Number(task_owner_id) : null,
            task_owner_name || null,
            requires_dean_approval ? 1 : 0,
            campaignGroupId
          ]);

          const taskId = result.lastInsertRowid;
          createdTasks.push({ id: taskId, recipient: recipient.full_name });

          await execute(`
            INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, metadata, ip_address)
            VALUES (?, ?, ?, 'TASK_CREATED', ?, ?, ?, ?, ?)
          `, [
            user.id,
            user.full_name,
            user.role,
            taskId,
            `Task Dispatched to ${recipient.title} ${recipient.full_name}`,
            `Task: "${title}" with deadline ${new Date(deadline).toLocaleDateString()}`,
            JSON.stringify({ priority, department: recipient.department, groupId: campaignGroupId }),
            '127.0.0.1'
          ]);

          // Direct recipient alert for their notification feed
          await execute(`
            INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, metadata, ip_address)
            VALUES (?, ?, ?, 'TASK_ASSIGNED', ?, ?, ?, ?, ?)
          `, [
            recipient.id,
            recipient.full_name,
            recipient.role,
            taskId,
            `New Task Directive: ${title}`,
            `Assigned by Dean Prof. Dr. Gehan Safwat. Priority: ${priority.toUpperCase()}. Due: ${new Date(deadline).toLocaleDateString('en-GB')}.`,
            JSON.stringify({ priority, department: recipient.department, groupId: campaignGroupId }),
            '127.0.0.1'
          ]);
        }
      }

      // Master log for the batch event
      const dispatchSummary = target_type === 'hat' 
        ? `the "${hatName}" Committee/Hat` 
        : target_type === 'department' 
          ? `cadre ${target_dept}` 
          : 'multiple faculty members';

      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, metadata, ip_address)
        VALUES (?, ?, ?, 'BATCH_DISPATCH', ?, ?, ?, ?)
      `, [
        user.id,
        user.full_name,
        user.role,
        `Bulk Task Dispatched to ${targetUserIds.length} Faculty Members (${hatName || target_dept || 'Custom'})`,
        `Task "${title}" distributed across ${dispatchSummary}. Total assignments created: ${createdTasks.length}.`,
        JSON.stringify({ target_type, target_dept, target_hat_id: assignedHatId, hatName, count: targetUserIds.length }),
        '127.0.0.1'
      ]);

      return NextResponse.json({
        success: true,
        count: createdTasks.length,
        tasks: createdTasks,
        message: `Successfully dispatched task to ${createdTasks.length} faculty members${hatName ? ` in "${hatName}" Hat` : ''}.`
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 1b. SPREADSHEET / EXCEL TASK SYNC
    // ─────────────────────────────────────────────────────────────
    if (operation === 'sync_spreadsheet') {
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Permission denied. Only leadership can import spreadsheet tasks.' }, { status: 403 });
      }

      const { rows } = body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: 'rows array is required' }, { status: 400 });
      }

      let updatedCount = 0;
      let insertedCount = 0;

      for (const row of rows) {
        const { tr, title, assignee_name, assignee_email, status, deadline, notes, hat_name } = row;
        if (!title && !tr) continue;

        let existingTask: any = null;
        if (tr) {
          existingTask = await queryFirst('SELECT * FROM tasks WHERE tr = ?', [Number(tr)]);
        }
        if (!existingTask && title) {
          existingTask = await queryFirst('SELECT * FROM tasks WHERE LOWER(TRIM(title)) = LOWER(TRIM(?))', [title.trim()]);
        }

        let resolvedHatId: number | null = null;
        if (hat_name) {
          const hatMatch = await queryFirst('SELECT id FROM hats WHERE LOWER(name) LIKE ?', [`%${hat_name.toLowerCase().trim()}%`]);
          if (hatMatch) resolvedHatId = hatMatch.id;
        }

        let normalizedStatus = (status || '').toLowerCase().trim();
        if (normalizedStatus.includes('done') || normalizedStatus.includes('complete')) normalizedStatus = 'done';
        else if (normalizedStatus.includes('progress')) normalizedStatus = 'in_progress';
        else if (normalizedStatus.includes('revision')) normalizedStatus = 'revision_requested';
        else if (normalizedStatus) normalizedStatus = 'pending';

        if (existingTask) {
          const newStatus = normalizedStatus || existingTask.status;
          const newNotes = notes || existingTask.completion_notes;
          const newDeadline = deadline ? new Date(deadline).toISOString() : existingTask.deadline;
          const newHatId = resolvedHatId || existingTask.hat_id;

          await execute(`
            UPDATE tasks 
            SET status = ?, completion_notes = ?, deadline = ?, hat_id = ?, updated_at = ?
            WHERE id = ?
          `, [
            newStatus,
            newNotes,
            newDeadline,
            newHatId,
            new Date().toISOString(),
            existingTask.id
          ]);
          updatedCount++;
        } else {
          let assignedToId = user.id;
          let assignedDept = 'Academic Staff';

          if (assignee_email) {
            const userMatch = await queryFirst('SELECT id, full_name, department FROM users WHERE LOWER(email) = LOWER(?)', [assignee_email.trim()]);
            if (userMatch) {
              assignedToId = userMatch.id;
              assignedDept = userMatch.department;
            }
          } else if (assignee_name) {
            const userMatch = await queryFirst('SELECT id, full_name, department FROM users WHERE LOWER(full_name) LIKE ?', [`%${assignee_name.toLowerCase().trim()}%`]);
            if (userMatch) {
              assignedToId = userMatch.id;
              assignedDept = userMatch.department;
            }
          }

          await execute(`
            INSERT INTO tasks (
              tr, title, description, assigned_by_id, assigned_to_id, department, 
              priority, deadline, status, hat_id, completion_notes, created_at, updated_at, source
            )
            VALUES (?, ?, ?, ?, ?, ?, 'medium', ?, ?, ?, ?, ?, ?, 'portal')
          `, [
            tr ? Number(tr) : null,
            title.trim(),
            notes || title.trim(),
            user.id,
            assignedToId,
            assignedDept,
            deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 86400000 * 7).toISOString(),
            normalizedStatus || 'pending',
            resolvedHatId,
            notes || null,
            new Date().toISOString(),
            new Date().toISOString()
          ]);
          insertedCount++;
        }
      }

      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, metadata, ip_address)
        VALUES (?, ?, ?, 'SPREADSHEET_SYNC', ?, ?, ?, ?)
      `, [
        user.id,
        user.full_name,
        user.role,
        `Tasks Synchronized via Spreadsheet Import (${updatedCount} updated, ${insertedCount} added)`,
        `Dean/Leadership processed spreadsheet update. Total modified rows: ${updatedCount + insertedCount}.`,
        JSON.stringify({ updatedCount, insertedCount }),
        '127.0.0.1'
      ]);

      return NextResponse.json({
        success: true,
        updatedCount,
        insertedCount,
        message: `Spreadsheet synchronization complete: ${updatedCount} tasks updated, ${insertedCount} new tasks created.`
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. BULK ACTIONS ON EXISTING TASKS
    // ─────────────────────────────────────────────────────────────
    const { task_ids, action, data = {} } = body;

    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return NextResponse.json({ error: 'task_ids array is required' }, { status: 400 });
    }

    const numericIds = task_ids.map(Number);
    const placeholders = numericIds.map(() => '?').join(',');

    // Fetch existing tasks to check ownership/permissions
    const existingTasks = await queryAll(`
      SELECT t.*, u.full_name as assignee_name, u.title as assignee_title
      FROM tasks t
      JOIN users u ON t.assigned_to_id = u.id
      WHERE t.id IN (${placeholders})
    `, numericIds) as any[];

    if (existingTasks.length === 0) {
      return NextResponse.json({ error: 'No matching tasks found' }, { status: 404 });
    }

    // Filter tasks the user is authorized to modify:
    // Dean/Admin can modify all. Staff/Professor can only modify tasks assigned to them.
    const authorizedTasks = isDeanOrAdmin
      ? existingTasks
      : existingTasks.filter(t => t.assigned_to_id === user.id);

    if (authorizedTasks.length === 0) {
      return NextResponse.json({ error: 'You do not have permission to modify the selected tasks' }, { status: 403 });
    }

    const authorizedIds = authorizedTasks.map(t => t.id);
    const authPlaceholders = authorizedIds.map(() => '?').join(',');

    // ── Action: Bulk Acknowledge (Dean only) ──
    if (action === 'acknowledge') {
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Only leadership can acknowledge tasks' }, { status: 403 });
      }

      await execute(`
        UPDATE tasks
        SET dean_acknowledged = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${authPlaceholders}) AND status = 'done'
      `, authorizedIds);

      for (const t of authorizedTasks.filter(t => t.status === 'done')) {
        await execute(`
          INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, ip_address)
          VALUES (?, ?, ?, 'TASK_ACKNOWLEDGED', ?, 'Dean Office Bulk Verified Task', ?, '127.0.0.1')
        `, [
          user.id,
          user.full_name,
          user.role,
          t.id,
          `Bulk verification of completed task from ${t.assignee_title} ${t.assignee_name}: "${t.title}"`
        ]);
      }

      return NextResponse.json({ success: true, count: authorizedIds.length, message: 'Tasks verified successfully.' });
    }

    // ── Action: Bulk Status Update (Dean or Staff) ──
    if (action === 'status') {
      const { status, completion_notes } = data;
      if (!status) {
        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
      }

      const completedAt = status === 'done' ? new Date().toISOString() : null;

      await execute(`
        UPDATE tasks
        SET 
          status = ?,
          completion_notes = COALESCE(?, completion_notes),
          completed_at = CASE WHEN ? = 'done' THEN CURRENT_TIMESTAMP ELSE completed_at END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${authPlaceholders})
      `, [status, completion_notes || null, status, ...authorizedIds]);

      for (const t of authorizedTasks) {
        const actionType = status === 'done' ? 'TASK_COMPLETED' : 'TASK_STATUS_UPDATED';
        const title = `${user.title} ${user.full_name} bulk updated task to ${status.replace('_', ' ').toUpperCase()}`;
        const details = completion_notes
          ? `Batch Note: "${completion_notes}" on task: ${t.title}`
          : `Batch status update from ${t.status} to ${status}`;

        await execute(`
          INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, ip_address)
          VALUES (?, ?, ?, ?, ?, ?, ?, '127.0.0.1')
        `, [user.id, user.full_name, user.role, actionType, t.id, title, details]);
      }

      return NextResponse.json({ success: true, count: authorizedIds.length, message: `Updated ${authorizedIds.length} tasks to ${status}.` });
    }

    // ── Action: Bulk Priority (Dean only) ──
    if (action === 'priority') {
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Only leadership can change priority' }, { status: 403 });
      }
      const { priority } = data;
      if (!priority) {
        return NextResponse.json({ error: 'Priority is required' }, { status: 400 });
      }

      await execute(`
        UPDATE tasks
        SET priority = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${authPlaceholders})
      `, [priority, ...authorizedIds]);

      for (const t of authorizedTasks) {
        await execute(`
          INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, ip_address)
          VALUES (?, ?, ?, 'TASK_UPDATED', ?, 'Priority Level Modified', ?, '127.0.0.1')
        `, [user.id, user.full_name, user.role, t.id, `Priority changed to ${priority.toUpperCase()} on "${t.title}"`]);
      }

      return NextResponse.json({ success: true, count: authorizedIds.length, message: `Priority set to ${priority} for ${authorizedIds.length} tasks.` });
    }

    // ── Action: Bulk Extend / Set Deadline (Dean only) ──
    if (action === 'deadline') {
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Only leadership can extend deadlines' }, { status: 403 });
      }
      let targetDeadline = data.deadline;
      if (!targetDeadline && data.days) {
        targetDeadline = new Date(Date.now() + Number(data.days) * 24 * 60 * 60 * 1000).toISOString();
      }
      if (!targetDeadline) {
        return NextResponse.json({ error: 'Deadline date or days count is required' }, { status: 400 });
      }

      await execute(`
        UPDATE tasks
        SET deadline = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${authPlaceholders})
      `, [targetDeadline, ...authorizedIds]);

      for (const t of authorizedTasks) {
        await execute(`
          INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, ip_address)
          VALUES (?, ?, ?, 'TASK_UPDATED', ?, 'Deadline Extended', ?, '127.0.0.1')
        `, [user.id, user.full_name, user.role, t.id, `Deadline moved to ${new Date(targetDeadline).toLocaleDateString()} for "${t.title}"`]);
      }

      return NextResponse.json({ success: true, count: authorizedIds.length, message: `Deadline updated for ${authorizedIds.length} tasks.` });
    }

    // ── Action: Bulk Reassign (Dean only) ──
    if (action === 'reassign') {
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Only leadership can reassign tasks' }, { status: 403 });
      }

      const { assigned_to_id, hat_id } = data;
      if (!assigned_to_id) {
        return NextResponse.json({ error: 'Assigned faculty member ID is required' }, { status: 400 });
      }

      const targetUser = await queryFirst('SELECT * FROM users WHERE id = ?', [Number(assigned_to_id)]);
      if (!targetUser) {
        return NextResponse.json({ error: 'Target faculty member not found' }, { status: 404 });
      }

      let hatName = '';
      if (hat_id) {
        const targetHat = await queryFirst('SELECT name FROM hats WHERE id = ?', [Number(hat_id)]);
        hatName = targetHat?.name || '';
      }

      if (hat_id !== undefined) {
        const newHatId = hat_id ? Number(hat_id) : null;
        await execute(`
          UPDATE tasks
          SET assigned_to_id = ?, department = ?, hat_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id IN (${authPlaceholders})
        `, [targetUser.id, targetUser.department, newHatId, ...authorizedIds]);
      } else {
        await execute(`
          UPDATE tasks
          SET assigned_to_id = ?, department = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id IN (${authPlaceholders})
        `, [targetUser.id, targetUser.department, ...authorizedIds]);
      }

      for (const t of authorizedTasks) {
        await execute(`
          INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, ip_address)
          VALUES (?, ?, ?, 'TASK_UPDATED', ?, 'Task Reassigned', ?, '127.0.0.1')
        `, [
          user.id,
          user.full_name,
          user.role,
          t.id,
          `Bulk reassigned from ${t.assignee_title || ''} ${t.assignee_name} to ${targetUser.title || ''} ${targetUser.full_name} (${targetUser.department})${hatName ? ` under Hat: "${hatName}"` : ''} on "${t.title}"`
        ]);
      }

      return NextResponse.json({
        success: true,
        count: authorizedIds.length,
        message: `Reassigned ${authorizedIds.length} tasks to ${targetUser.title || ''} ${targetUser.full_name}.`
      });
    }

    // ── Action: Bulk Delete (Dean only) ──
    if (action === 'delete') {
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Only leadership can delete tasks' }, { status: 403 });
      }

      await execute(`DELETE FROM tasks WHERE id IN (${authPlaceholders})`, authorizedIds);

      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
        VALUES (?, ?, ?, 'TASK_DELETED', ?, ?, '127.0.0.1')
      `, [
        user.id,
        user.full_name,
        user.role,
        `Bulk Deleted ${authorizedIds.length} Tasks`,
        `Dean office deleted tasks: ${authorizedTasks.map(t => `#${t.id} (${t.title})`).join(', ')}`
      ]);

      return NextResponse.json({ success: true, count: authorizedIds.length, message: `Deleted ${authorizedIds.length} tasks.` });
    }

    return NextResponse.json({ error: 'Invalid bulk action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
