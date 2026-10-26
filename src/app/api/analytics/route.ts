
import { NextResponse } from 'next/server';
import { queryAll, queryFirst } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/analytics: Dean KPI summary metrics
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Summary counts
    const totalTasks = await queryFirst('SELECT count(*) as count FROM tasks') as { count: number };
    const doneTasks = await queryFirst("SELECT count(*) as count FROM tasks WHERE status = 'done'") as { count: number };
    const inProgressTasks = await queryFirst("SELECT count(*) as count FROM tasks WHERE status = 'in_progress'") as { count: number };
    const pendingTasks = await queryFirst("SELECT count(*) as count FROM tasks WHERE status = 'pending'") as { count: number };
    const overdueTasks = await queryFirst("SELECT count(*) as count FROM tasks WHERE deadline < datetime('now') AND status != 'done'") as { count: number };
    const totalStaff = await queryFirst("SELECT count(*) as count FROM users WHERE role NOT IN ('dean', 'admin')") as { count: number };

    // Department completion metrics
    const deptStats = await queryAll(`
      SELECT 
        department,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN deadline < datetime('now') AND status != 'done' THEN 1 ELSE 0 END) as overdue
      FROM tasks
      GROUP BY department
    `);

    // Recent activity highlights
    const recentActivity = await queryAll(`
      SELECT l.*, u.avatar as user_avatar, u.department as user_department
      FROM activity_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.id DESC
      LIMIT 8
    `);

    const totalCount = totalTasks?.count || 0;
    const doneCount = doneTasks?.count || 0;

    return NextResponse.json({
      metrics: {
        totalTasks: totalCount,
        doneTasks: doneCount,
        inProgressTasks: inProgressTasks?.count || 0,
        pendingTasks: pendingTasks?.count || 0,
        overdueTasks: overdueTasks?.count || 0,
        totalStaff: totalStaff?.count || 0,
        completionRate: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
      },
      deptStats: deptStats || [],
      recentActivity: recentActivity || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
