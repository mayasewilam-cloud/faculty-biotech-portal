
import { NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/logs: Dean's Central Audit Trail ("Who did what and when")
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const actionType = searchParams.get('actionType');
    const taskId = searchParams.get('taskId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let query = `
      SELECT 
        l.*,
        u.avatar as user_avatar,
        u.department as user_department,
        t.title as task_title
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN tasks t ON l.task_id = t.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // If user is a professor/staff, only show their own logs
    if (user.role === 'professor' || user.role === 'staff') {
      query += ` AND l.user_id = ?`;
      params.push(user.id);
    } else if (userId && userId !== 'all') {
      query += ` AND l.user_id = ?`;
      params.push(userId);
    }

    if (actionType && actionType !== 'all') {
      query += ` AND l.action_type = ?`;
      params.push(actionType);
    }

    if (taskId) {
      query += ` AND l.task_id = ?`;
      params.push(taskId);
    }

    if (search) {
      query += ` AND (l.title LIKE ? OR l.details LIKE ? OR l.user_name LIKE ? OR t.title LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY l.id DESC LIMIT ?`;
    params.push(limit);

    const logs = await queryAll(query, params);

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
