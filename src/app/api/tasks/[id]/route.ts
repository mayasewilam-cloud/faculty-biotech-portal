import { NextResponse } from 'next/server';
import { queryFirst, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// PATCH /api/tasks/[id]: Updates task status, completion notes, or dean acknowledgment
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);

    const existingTask = await queryFirst(`
      SELECT t.*, u.full_name as assignee_name, u.title as assignee_title, u.email as assignee_email
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to_id = u.id
      WHERE t.id = ?
    `, [taskId]) as any;

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const isDeanOrAdmin = user.role === 'admin' || user.id === 99 || user.id === 6496 || user.id === 6591 || user.role === 'dean' || user.role === 'vice_dean' || user.role === 'dept_head';
    const isAssignee = existingTask.assigned_to_id === user.id;
    const isCreator = existingTask.assigned_by_id === user.id;
    const isTaskOwner = existingTask.task_owner_id === user.id;

    if (!isDeanOrAdmin && !isAssignee && !isCreator && !isTaskOwner) {
      return NextResponse.json({ error: 'You do not have permission to modify this task' }, { status: 403 });
    }

    // Assignee updates status, notes, or uploads deliverable file
    if (isAssignee && !isDeanOrAdmin && !isCreator && !isTaskOwner) {
      const { status, completion_notes, completion_url, drive_link, action_plan, attachment_name, attachment_type, attachment_size, attachment_url } = body;

      if (!status) {
        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
      }

      const completedAt = status === 'done' ? new Date().toISOString() : null;

      await execute(`
        UPDATE tasks
        SET 
          status = ?,
          completion_notes = COALESCE(?, completion_notes),
          completion_url = COALESCE(?, completion_url),
          drive_link = COALESCE(?, drive_link),
          action_plan = COALESCE(?, action_plan),
          attachment_name = COALESCE(?, attachment_name),
          attachment_type = COALESCE(?, attachment_type),
          attachment_size = COALESCE(?, attachment_size),
          attachment_url = COALESCE(?, attachment_url),
          completed_at = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        status, 
        completion_notes || null, 
        completion_url || null, 
        drive_link || null,
        action_plan || null,
        attachment_name || null,
        attachment_type || null,
        attachment_size ? Number(attachment_size) : null,
        attachment_url || null,
        completedAt, 
        taskId
      ]);

      // Audit Log Entry
      const actionType = status === 'done' ? 'TASK_COMPLETED' : 'TASK_STATUS_UPDATED';
      const logTitle = status === 'done' 
        ? `${user.title} ${user.full_name} marked task as DONE`
        : `${user.title} ${user.full_name} updated status to ${status.replace('_', ' ').toUpperCase()}`;

      const logDetails = completion_notes 
        ? `Work Description / Note: "${completion_notes}"`
        : `Status transitioned from ${existingTask.status} to ${status}`;

      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, metadata, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        user.full_name,
        user.role,
        actionType,
        taskId,
        logTitle,
        logDetails,
        JSON.stringify({
          previousStatus: existingTask.status,
          newStatus: status,
          completionNotes: completion_notes || '',
          completionUrl: completion_url || '',
          timestamp: new Date().toISOString()
        }),
        '127.0.0.1'
      ]);
    } else {
      // Dean actions: Acknowledge, Request Revision, Edit details, or Force Status change
      if (body.action === 'request_revision') {
        body.status = 'revision_requested';
        body.dean_feedback = body.revision_feedback || body.dean_feedback || 'Please update and resubmit.';
        body.dean_acknowledged = 0;
      }

      const { status, dean_feedback, dean_acknowledged, completion_notes, title, description, priority, deadline } = body;

      let updates: string[] = [];
      let updateParams: any[] = [];

      if (status !== undefined) {
        updates.push('status = ?');
        updateParams.push(status);
        if (status === 'done' && !existingTask.completed_at) {
          updates.push('completed_at = CURRENT_TIMESTAMP');
        }
      }

      if (completion_notes !== undefined) {
        updates.push('completion_notes = ?');
        updateParams.push(completion_notes);
      }

      if (dean_feedback !== undefined) {
        updates.push('dean_feedback = ?');
        updateParams.push(dean_feedback);
      }

      if (dean_acknowledged !== undefined) {
        updates.push('dean_acknowledged = ?');
        updateParams.push(dean_acknowledged ? 1 : 0);
      }

      if (title !== undefined) {
        updates.push('title = ?');
        updateParams.push(title);
      }

      if (description !== undefined) {
        updates.push('description = ?');
        updateParams.push(description);
      }

      if (priority !== undefined) {
        updates.push('priority = ?');
        updateParams.push(priority);
      }

      if (deadline !== undefined) {
        updates.push('deadline = ?');
        updateParams.push(deadline);
      }

      if (body.attachment_name !== undefined) {
        updates.push('attachment_name = ?');
        updateParams.push(body.attachment_name);
      }

      if (body.attachment_url !== undefined) {
        updates.push('attachment_url = ?');
        updateParams.push(body.attachment_url);
      }

      if (body.attachment_type !== undefined) {
        updates.push('attachment_type = ?');
        updateParams.push(body.attachment_type);
      }

      if (body.attachment_size !== undefined) {
        updates.push('attachment_size = ?');
        updateParams.push(body.attachment_size ? Number(body.attachment_size) : null);
      }

      if (body.completion_url !== undefined) {
        updates.push('completion_url = ?');
        updateParams.push(body.completion_url);
      }

      if (body.drive_link !== undefined) {
        updates.push('drive_link = ?');
        updateParams.push(body.drive_link);
      }

      if (body.action_plan !== undefined) {
        updates.push('action_plan = ?');
        updateParams.push(body.action_plan);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      updateParams.push(taskId);

      await execute(`
        UPDATE tasks
        SET ${updates.join(', ')}
        WHERE id = ?
      `, updateParams);

      // Audit Log for Dean action
      let actionType = 'TASK_UPDATED';
      let logTitle = `Dean's Office updated task #${taskId}`;
      let logDetails = `Task: ${existingTask.title}`;

      if (dean_acknowledged === 1 || dean_acknowledged === true) {
        actionType = 'TASK_ACKNOWLEDGED';
        logTitle = `Dean's Office Acknowledged Task Completion`;
        logDetails = `Dean verified and approved the submission from ${existingTask.assignee_title} ${existingTask.assignee_name}.`;
      } else if (status === 'revision_requested') {
        actionType = 'REVISION_REQUESTED';
        logTitle = `Dean's Office Requested Revision`;
        logDetails = `Feedback to faculty: "${dean_feedback || 'Please update and resubmit.'}"`;
      }

      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, metadata, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        user.full_name,
        user.role,
        actionType,
        taskId,
        logTitle,
        logDetails,
        JSON.stringify(body),
        '127.0.0.1'
      ]);
    }

    const updatedTask = await queryFirst(`
      SELECT 
        t.*,
        assignee.full_name as assignee_name,
        assignee.title as assignee_title,
        assignee.email as assignee_email,
        assignee.role as assignee_role,
        assignee.department as assignee_department,
        assignee.avatar as assignee_avatar,
        creator.full_name as creator_name,
        creator.title as creator_title
      FROM tasks t
      LEFT JOIN users assignee ON t.assigned_to_id = assignee.id
      LEFT JOIN users creator ON t.assigned_by_id = creator.id
      WHERE t.id = ?
    `, [taskId]);

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]: Delete task (Dean, Vice Dean, or Task Creator)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (!taskId || isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid Task ID' }, { status: 400 });
    }

    const existingTask = await queryFirst('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const isAuthorized = user.role === 'admin' || user.id === 99 || user.id === 6496 || user.id === 6591 || user.role === 'dean' || user.role === 'vice_dean' || existingTask.assigned_by_id === user.id;
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Permission denied. Only leadership or task creator can delete tasks.' }, { status: 403 });
    }

    await execute('DELETE FROM tasks WHERE id = ?', [taskId]);

    try {
      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, ip_address)
        VALUES (?, ?, ?, 'TASK_DELETED', ?, ?, ?, '127.0.0.1')
      `, [
        user.id,
        user.full_name,
        user.role,
        taskId,
        `Task Deleted: #${taskId}`,
        `${user.title || ''} ${user.full_name} deleted task "${existingTask.title}".`
      ]);
    } catch (e) {
      console.warn('Task delete log error:', e);
    }

    return NextResponse.json({ success: true, message: `Task #${taskId} deleted` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
