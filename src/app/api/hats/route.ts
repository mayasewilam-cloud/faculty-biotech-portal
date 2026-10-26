
import { NextResponse } from 'next/server';
import { getAllHatsWithMembers, createHatData, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/hats: List all faculty hats/committees with their member profiles & task stats
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hats = await getAllHatsWithMembers();
    return NextResponse.json({ hats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch hats' }, { status: 500 });
  }
}

// POST /api/hats: Create a new Hat with custom name, description, icon, color, and initial members
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isDeanOrAdmin = user.role === 'admin' || user.id === 99 || user.id === 6496 || user.id === 6591 || user.role === 'dean' || user.role === 'vice_dean';

    const body = await req.json();
    const { name, description, icon = '🎩', color = '#3b82f6', member_ids = [] } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Hat name is required' }, { status: 400 });
    }

    const newHat = await createHatData({
      name: name.trim(),
      description: description ? description.trim() : '',
      icon: icon.trim() || '🎩',
      color: color.trim() || '#3b82f6',
      created_by_id: user.id,
      member_ids: Array.isArray(member_ids) ? member_ids.map(Number) : [],
    });

    // Immutable audit log
    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
      VALUES (?, ?, ?, 'HAT_CREATED', ?, ?, '127.0.0.1')
    `, [
      user.id,
      user.full_name,
      user.role,
      `Created New Hat: ${newHat.name}`,
      `${user.title || ''} ${user.full_name} established the "${newHat.name}" Hat with ${newHat.member_count} initial members.`
    ]);

    return NextResponse.json({ hat: newHat }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create hat' }, { status: 500 });
  }
}
