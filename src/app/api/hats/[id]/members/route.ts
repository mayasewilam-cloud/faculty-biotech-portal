import { NextResponse } from 'next/server';
import { addMemberToHat, removeMemberFromHat, getHatByIdWithMembers, queryFirst, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/hats/[id]/members: Add a specific member to a Hat
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hatId = Number(id);
    const hat = await getHatByIdWithMembers(hatId);
    if (!hat) {
      return NextResponse.json({ error: 'Hat not found' }, { status: 404 });
    }

    const body = await req.json();
    const userId = Number(body.user_id);
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await queryFirst('SELECT id, full_name, title, email, role, department FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    await addMemberToHat(hatId, userId);

    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
      VALUES (?, ?, ?, 'HAT_MEMBER_ADDED', ?, ?, '127.0.0.1')
    `, [
      user.id,
      user.full_name,
      user.role,
      `Member Added to Hat: ${hat.name}`,
      `${user.title || ''} ${user.full_name} added ${targetUser.title || ''} ${targetUser.full_name} (${targetUser.role.toUpperCase()}) to "${hat.name}".`
    ]);

    const updatedHat = await getHatByIdWithMembers(hatId);
    return NextResponse.json({ hat: updatedHat });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add member to hat' }, { status: 500 });
  }
}

// DELETE /api/hats/[id]/members: Remove a specific member from a Hat
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const hatId = Number(id);
    const hat = await getHatByIdWithMembers(hatId);
    if (!hat) {
      return NextResponse.json({ error: 'Hat not found' }, { status: 404 });
    }

    const body = await req.json();
    const userId = Number(body.user_id);
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const targetUser = await queryFirst('SELECT id, full_name, title, role FROM users WHERE id = ?', [userId]);

    await removeMemberFromHat(hatId, userId);

    await execute(`
      INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address)
      VALUES (?, ?, ?, 'HAT_MEMBER_REMOVED', ?, ?, '127.0.0.1')
    `, [
      user.id,
      user.full_name,
      user.role,
      `Member Removed from Hat: ${hat.name}`,
      `${user.title || ''} ${user.full_name} removed ${targetUser?.full_name || `User #${userId}`} from "${hat.name}".`
    ]);

    const updatedHat = await getHatByIdWithMembers(hatId);
    return NextResponse.json({ hat: updatedHat });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to remove member from hat' }, { status: 500 });
  }
}
