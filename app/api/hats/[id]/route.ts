import { NextResponse } from 'next/server';
import { getHatByIdWithMembers, updateHatData, deleteHatData, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/hats/[id]: Single Hat details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hat = await getHatByIdWithMembers(Number(id));
    if (!hat) {
      return NextResponse.json({ error: 'Hat not found' }, { status: 404 });
    }

    return NextResponse.json({ hat });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch hat' }, { status: 500 });
  }
}

// PUT /api/hats/[id]: Update Hat metadata or member assignments
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hatId = Number(id);
    const existing = await getHatByIdWithMembers(hatId);
    if (!existing) {
      return NextResponse.json({ error: 'Hat not found' }, { status: 404 });
    }

    const body = await req.json();
    const updated = await updateHatData(hatId, {
      name: body.name,
      description: body.description,
      icon: body.icon,
      color: body.color,
      member_ids: Array.isArray(body.member_ids) ? body.member_ids.map(Number) : undefined,
    });

    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
      VALUES (?, ?, ?, 'HAT_UPDATED', ?, ?, '127.0.0.1')
    `, [
      user.id,
      user.full_name,
      user.role,
      `Updated Hat: ${updated?.name || existing.name}`,
      `${user.title || ''} ${user.full_name} updated configuration and members for "${updated?.name || existing.name}".`
    ]);

    return NextResponse.json({ hat: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update hat' }, { status: 500 });
  }
}

// DELETE /api/hats/[id]: Delete Hat and its member mappings (Accessible to all faculty members)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hatId = Number(id);
    if (!hatId || isNaN(hatId)) {
      return NextResponse.json({ error: 'Invalid Hat ID' }, { status: 400 });
    }

    const existing = await getHatByIdWithMembers(hatId);
    const hatName = existing?.name || `Hat #${hatId}`;

    await deleteHatData(hatId);

    try {
      await execute(`
        INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
        VALUES (?, ?, ?, 'HAT_DELETED', ?, ?, '127.0.0.1')
      `, [
        user.id,
        user.full_name,
        user.role,
        `Deleted Hat: ${hatName}`,
        `${user.title || ''} ${user.full_name} removed the "${hatName}" Hat from the faculty registry.`
      ]);
    } catch (e) {
      console.warn('Activity log for HAT_DELETED failed:', e);
    }

    return NextResponse.json({ success: true, message: `Hat "${hatName}" deleted` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete hat' }, { status: 500 });
  }
}
