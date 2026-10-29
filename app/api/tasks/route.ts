import { isUserAssignedToTask } from '@/lib/taskFilters';
import { syncTasksFromGoogleSheet } from '@/lib/sheet_sync';

import { NextResponse } from 'next/server';
import { queryAll, queryFirst, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/tasks: Retrieve tasks based on role and filters
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure live Google Sheet tasks are loaded if memory lacks sheet tasks
    const g = globalThis as any;
    const hasSheetTasks = Array.isArray(g.__memoryTasks) && g.__memoryTasks.some((t: any) => t.source === 'sheet');
    if (!hasSheetTasks) {
      try {
        await syncTasksFromGoogleSheet();
      } catch (sheetErr) {
        console.warn('Auto sync sheet in GET /api/tasks:', sheetErr);
      }
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const hat_id = searchParams.get('hat_id');
    const committee_id = searchParams.get('committee_id');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const search = searchParams.get('search');
    const exactDate = searchParams.get('exact_date');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const dueFilter = searchParams.get('due_filter');

    let query = `
      SELECT 
        t.*,
        assignee.full_name as assignee_name,
        assignee.title as assignee_title,
        assignee.email as assignee_email,
        assignee.role as assignee_role,
        assignee.department as assignee_department,
        assignee.avatar as assignee_avatar,
        creator.full_name as creator_name,
        creator.title as creator_title,
        h.name as hat_name,
        h.icon as hat_icon,
        h.color as hat_color
      FROM tasks t
      LEFT JOIN users assignee ON t.assigned_to_id = assignee.id
      LEFT JOIN users creator ON t.assigned_by_id = creator.id
      LEFT JOIN hats h ON t.hat_id = h.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Role-based visibility: match direct id, task owner, or multi-member assignment
    if (user.role === 'professor' || user.role === 'staff') {
      const namePattern = `%${user.full_name}%`;
      query += ` AND (t.assigned_to_id = ? OR t.assigned_by_id = ? OR t.task_owner_id = ? OR t.assigned_members LIKE ? OR t.assignee_name LIKE ? OR t.committee_id IN (SELECT id FROM committees WHERE chair_id = ?))`;
      params.push(user.id, user.id, user.id, namePattern, namePattern, user.id);
    } else if (assigneeId && assigneeId !== 'all') {
      query += ` AND t.assigned_to_id = ?`;
      params.push(assigneeId);
    }

    if (status && status !== 'all') {
      if (status === 'overdue') {
        query += ` AND t.deadline < datetime('now') AND t.status != 'done'`;
      } else {
        query += ` AND t.status = ?`;
        params.push(status);
      }
    }

    if (department && department !== 'all') {
      query += ` AND t.department = ?`;
      params.push(department);
    }

    if (hat_id && hat_id !== 'all') {
      const hId = Number(hat_id);
      query += ` AND (t.hat_id = ? OR t.assigned_to_id IN (SELECT user_id FROM hat_members WHERE hat_id = ?))`;
      params.push(hId, hId);
    }

    if (committee_id && committee_id !== 'all') {
      const cId = Number(committee_id);
      query += ` AND (t.committee_id = ? OR t.assigned_to_id IN (SELECT user_id FROM committee_members WHERE committee_id = ?))`;
      params.push(cId, cId);
    }

    if (priority && priority !== 'all') {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }

    // Date filters
    if (exactDate) {
      query += ` AND date(t.deadline) = date(?)`;
      params.push(exactDate);
    }

    if (dateFrom) {
      query += ` AND date(t.deadline) >= date(?)`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND date(t.deadline) <= date(?)`;
      params.push(dateTo);
    }

    if (dueFilter && dueFilter !== 'all') {
      if (dueFilter === 'overdue') {
        query += ` AND t.deadline < datetime('now') AND t.status != 'done'`;
      } else if (dueFilter === 'today') {
        query += ` AND date(t.deadline) = date('now')`;
      } else if (dueFilter === 'tomorrow') {
        query += ` AND date(t.deadline) = date('now', '+1 day')`;
      } else if (dueFilter === '3days') {
        query += ` AND t.deadline >= datetime('now') AND t.deadline <= datetime('now', '+3 days')`;
      } else if (dueFilter === 'week') {
        query += ` AND t.deadline >= datetime('now') AND t.deadline <= datetime('now', '+7 days')`;
      } else if (dueFilter === 'month') {
        query += ` AND t.deadline >= datetime('now') AND t.deadline <= datetime('now', '+30 days')`;
      }
    }

    if (search) {
      query += ` AND (t.title LIKE ? OR t.description LIKE ? OR assignee.full_name LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY 
      CASE WHEN t.status = 'pending' THEN 1
           WHEN t.status = 'in_progress' THEN 2
           WHEN t.status = 'revision_requested' THEN 3
           ELSE 4 END,
      t.deadline ASC`;

    let rawTasks = await queryAll(query, params);

    // If zero tasks exist on initial startup, automatically sync from Google Sheet
    if ((!rawTasks || rawTasks.length === 0) && (user.role === 'dean' || user.role === 'admin' || user.id === 6496)) {
      try {
        await syncTasksFromGoogleSheet();
        rawTasks = await queryAll(query, params);
      } catch (e) {
        console.warn('Auto-sync on empty tasks notice:', e);
      }
    }

    const isLeadership = user.role === 'dean' || user.role === 'admin' || user.role === 'vice_dean' || user.id === 99 || user.id === 6496 || user.id === 6591;

    let filtered = rawTasks || [];

    // Role-based visibility: non-leadership only sees their assigned tasks
    if (!isLeadership) {
      filtered = filtered.filter((t: any) => isUserAssignedToTask(t, user));
    } else if (assigneeId && assigneeId !== 'all') {
      const aId = Number(assigneeId);
      filtered = filtered.filter((t: any) => t.assigned_to_id === aId || t.task_owner_id === aId);
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'overdue') {
        const now = new Date();
        filtered = filtered.filter((t: any) => t.status !== 'done' && t.deadline && new Date(t.deadline) < now);
      } else {
        filtered = filtered.filter((t: any) => t.status === status);
      }
    }

    // Department filter
    if (department && department !== 'all') {
      filtered = filtered.filter((t: any) => t.department === department || t.assignee_department === department);
    }

    // Priority filter
    if (priority && priority !== 'all') {
      filtered = filtered.filter((t: any) => t.priority === priority);
    }

    // Search filter
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter((t: any) =>
        (t.title || '').toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term) ||
        (t.assignee_name || '').toLowerCase().includes(term)
      );
    }

    // Enforce strict confidentiality:
    // Only the creator ("the person who wanted it"), the assignee, and the Dean/Admin can inspect private files/reports
    const tasks = filtered.map((t: any) => {
      const isConfidential = Boolean(t.is_confidential);
      if (isConfidential) {
        const canAccess =
          user.id === t.assigned_by_id ||
          user.id === t.assigned_to_id ||
          user.role === 'admin' ||
          user.id === 99 ||
          user.id === 6496;
        if (!canAccess) {
          return {
            ...t,
            completion_notes: '🔒 Confidential Submission (Restricted to requester)',
            completion_url: null,
            attachment_url: null,
          };
        }
      }
      return t;
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tasks: Upload/Create new task or form/file submission request
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure live Google Sheet tasks are loaded if memory lacks sheet tasks
    const g = globalThis as any;
    const hasSheetTasks = Array.isArray(g.__memoryTasks) && g.__memoryTasks.some((t: any) => t.source === 'sheet');
    if (!hasSheetTasks) {
      try {
        await syncTasksFromGoogleSheet();
      } catch (sheetErr) {
        console.warn('Auto sync sheet in GET /api/tasks:', sheetErr);
      }
    }

    const body = await req.json();
    const isSubmissionRequest = Boolean(body.is_submission_request || body.submission_type || body.form_link || body.is_confidential);
    const isLeadership = user.role === 'admin' || user.id === 99 || user.id === 6496 || user.id === 6591 || user.role === 'dean' || user.role === 'vice_dean' || user.role === 'dept_head';

    if (!isLeadership && !isSubmissionRequest) {
      return NextResponse.json({ error: 'Permission denied. Only Super Admin, Dean, or authorized leadership can assign general tasks.' }, { status: 403 });
    }

    const { 
      title, 
      description, 
      assigned_to_id, 
      assigned_to_ids,
      priority = 'medium', 
      deadline, 
      hat_id,
      committee_id,
      committee_name,
      attachment_name,
      attachment_type,
      attachment_size,
      attachment_url,
      tr,
      start_date,
      due_time,
      comment_type,
      received_by,
      form_link,
      google_form_url,
      category,
      assigned_members,
      submission_type = 'standard',
      is_confidential = 0,
      request_prompt,
      group_id,
      task_owner_id,
      task_owner_name,
      requires_dean_approval = 0,
      responsibility_model = 'standard',
      parent_task_id,
    } = body;

    let targetList = body.assigned_to_ids || body.target_user_ids || (body.assigned_to_id ? [body.assigned_to_id] : (body.assigned_to ? [body.assigned_to] : []));
    const assignedMembersList = Array.isArray(assigned_members) ? assigned_members : [];

    if ((!targetList || targetList.length === 0) && assignedMembersList.length > 0) {
      targetList = [user.id];
    }

    const targetIds: number[] = Array.isArray(targetList) && targetList.length > 0 
      ? targetList.map(Number)
      : [user.id];

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const assignedHatId = hat_id ? Number(hat_id) : null;
    const assignedCommitteeId = committee_id ? Number(committee_id) : null;
    const reqGroupId = group_id || (targetIds.length > 1 ? `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` : null);
    
    // Prevent deep nesting and circular parent relationships (Option B guard)
    let validParentTaskId: number | null = null;
    if (parent_task_id) {
      const pId = Number(parent_task_id);
      const parentTask = await queryFirst('SELECT id, parent_task_id FROM tasks WHERE id = ?', [pId]) as any;
      if (parentTask) {
        validParentTaskId = parentTask.parent_task_id ? Number(parentTask.parent_task_id) : Number(parentTask.id);
      }
    }

    const createdTasks: any[] = [];

    for (const targetId of targetIds) {
      let assignee = await queryFirst('SELECT * FROM users WHERE id = ?', [targetId]) as any;
      if (!assignee) {
        assignee = await queryFirst('SELECT * FROM users WHERE id = ?', [user.id]) as any;
      }
      if (!assignee) continue;

      const result = await execute(`
        INSERT INTO tasks (
          title, description, assigned_by_id, assigned_to_id, department, hat_id, 
          committee_id, committee_name,
          priority, deadline, status, attachment_name, attachment_type, attachment_size, attachment_url,
          tr, start_date, due_time, comment_type, received_by, form_link, submission_type, 
          is_confidential, request_prompt, group_id,
          task_owner_id, task_owner_name, requires_dean_approval, responsibility_model, parent_task_id,
          drive_link, action_plan, google_form_url, assigned_members, category, source
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title,
        description,
        user.id,
        assignee.id,
        category || assignee.department,
        assignedHatId,
        assignedCommitteeId,
        committee_name || null,
        priority,
        deadline,
        'pending',
        attachment_name || null,
        attachment_type || null,
        attachment_size ? Number(attachment_size) : null,
        attachment_url || null,
        tr ? Number(tr) : null,
        start_date || new Date().toISOString().split('T')[0],
        due_time || 'Not Specified',
        comment_type || 'Comment',
        received_by || user.full_name,
        form_link || null,
        submission_type,
        is_confidential ? 1 : 0,
        request_prompt || description,
        reqGroupId,
        task_owner_id ? Number(task_owner_id) : null,
        task_owner_name || null,
        requires_dean_approval ? 1 : 0,
        responsibility_model || 'standard',
        validParentTaskId,
        body.drive_link || null,
        body.action_plan || null,
        google_form_url || null,
        assignedMembersList.length > 0 ? JSON.stringify(assignedMembersList) : JSON.stringify([assignee.full_name]),
        category || 'General Academic Directive',
        'portal'
      ]);

      const taskId = result.lastInsertRowid;

      // Record in Master Audit Log (Dean action)
      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, metadata, ip_address)
        VALUES (?, ?, ?, 'TASK_CREATED', ?, ?, ?, ?, ?)
      `, [
        user.id,
        user.full_name,
        user.role,
        taskId,
        isSubmissionRequest ? `Issued Form / File Request: ${title}` : `Dispatched Task: ${title}`,
        `Assigned to ${assignee.title} ${assignee.full_name} (${assignee.department}). Priority: ${priority.toUpperCase()}. Due: ${new Date(deadline).toLocaleString()}.${is_confidential ? ' [🔒 Strictly Confidential to Requester]' : ''}`,
        JSON.stringify({
          taskId,
          assignedTo: assignee.full_name,
          assignedToEmail: assignee.email,
          priority,
          deadline,
          submission_type,
          is_confidential: Boolean(is_confidential),
          form_link: form_link || null,
          groupId: reqGroupId
        }),
        '127.0.0.1'
      ]);

      // Direct Assignment Alert Notification for the Assignee
      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, task_id, title, details, metadata, ip_address)
        VALUES (?, ?, ?, 'TASK_ASSIGNED', ?, ?, ?, ?, ?)
      `, [
        assignee.id,
        assignee.full_name,
        assignee.role,
        taskId,
        `New Task Directive: ${title}`,
        `Assigned by Dean Prof. Dr. Gehan Safwat. Priority: ${priority.toUpperCase()}. Due: ${new Date(deadline).toLocaleDateString('en-GB')}.`,
        JSON.stringify({ taskId, priority, deadline, assignedBy: user.full_name }),
        '127.0.0.1'
      ]);

      const createdTask = await queryFirst('SELECT * FROM tasks WHERE id = ?', [taskId]);
      if (createdTask) createdTasks.push(createdTask);
    }

    return NextResponse.json({ 
      success: true, 
      task: createdTasks[0], 
      tasks: createdTasks, 
      group_id: reqGroupId, 
      count: createdTasks.length 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
