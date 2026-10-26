
import { NextResponse } from 'next/server';
import {
  getAllCommittees,
  getCommitteeById,
  createCommittee,
  updateCommittee,
  deleteCommittee,
} from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/committees: Return official standing committees of the Faculty of Biotechnology
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const committee = await getCommitteeById(Number(id));
      if (!committee) {
        return NextResponse.json({ error: 'Official committee not found' }, { status: 404 });
      }
      return NextResponse.json({ committee });
    }

    const committees = await getAllCommittees();
    return NextResponse.json({
      committees,
      total: committees.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch official committees' }, { status: 500 });
  }
}

// POST /api/committees: Create new official faculty committee
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      user.role === 'admin' ||
      user.id === 99 ||
      user.id === 6496 ||
      user.id === 6591 ||
      user.role === 'dean' ||
      user.role === 'vice_dean';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Permission denied. Only Dean or Vice Dean can create official faculty committees.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      name_ar = '',
      code,
      category = 'standing',
      decree_ref = '',
      chair_id = user.id,
      chair_name = user.full_name,
      chair_title = user.title || 'Dean of Faculty',
      rapporteur_id = user.id,
      rapporteur_name = user.full_name,
      rapporteur_title = 'Committee Rapporteur',
      description = '',
      mandates = [],
      pillar_code = 'A',
      pillar_name = 'Academic Governance',
      icon = '🏛️',
      color = '#3b82f6',
      members = [],
    } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Committee name and unique code are required' }, { status: 400 });
    }

    const created = await createCommittee({
      name: name.trim(),
      name_ar: name_ar.trim(),
      code: code.trim().toUpperCase(),
      category,
      decree_ref: decree_ref.trim(),
      chair_id: Number(chair_id),
      chair_name,
      chair_title,
      rapporteur_id: Number(rapporteur_id),
      rapporteur_name,
      rapporteur_title,
      description: description.trim(),
      mandates: Array.isArray(mandates) ? mandates : [],
      pillar_code,
      pillar_name,
      icon,
      color,
      members: Array.isArray(members) ? members : [],
    });

    return NextResponse.json({ success: true, committee: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create official committee' }, { status: 500 });
  }
}

// PUT /api/committees: Update official committee or manage membership
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      user.role === 'admin' ||
      user.id === 99 ||
      user.id === 6496 ||
      user.id === 6591 ||
      user.role === 'dean' ||
      user.role === 'vice_dean';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Permission denied. Only Dean or Vice Dean can modify official committees.' }, { status: 403 });
    }

    const body = await req.json();
    const committeeId = body.id || body.committee_id;
    const targetUserId = body.user_id || body.member_id;
    const { id, committee_id, action, member, user_id, member_id, ...updateData } = body;

    if (!committeeId) {
      return NextResponse.json({ error: 'Committee ID is required' }, { status: 400 });
    }

    const existing = await getCommitteeById(Number(committeeId));
    if (!existing) {
      return NextResponse.json({ error: 'Official committee not found' }, { status: 404 });
    }

    // Member management actions
    if (action === 'add_member' && member) {
      const currentMembers = existing.members || [];
      if (!currentMembers.some(m => m.user_id === member.user_id)) {
        currentMembers.push(member);
      }
      const updated = await updateCommittee(Number(committeeId), { members: currentMembers });
      return NextResponse.json({ success: true, committee: updated });
    }

    if (action === 'remove_member' && targetUserId) {
      const filtered = (existing.members || []).filter(m => m.user_id !== Number(targetUserId));
      const updated = await updateCommittee(Number(committeeId), { members: filtered });
      return NextResponse.json({ success: true, committee: updated });
    }

    const updated = await updateCommittee(Number(committeeId), updateData);
    return NextResponse.json({ success: true, committee: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update official committee' }, { status: 500 });
  }
}

// DELETE /api/committees: Delete official committee
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      user.role === 'admin' ||
      user.id === 99 ||
      user.id === 6496 ||
      user.id === 6591 ||
      user.role === 'dean' ||
      user.role === 'vice_dean';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Permission denied. Only Dean or Vice Dean can delete official faculty committees.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Committee ID is required' }, { status: 400 });
    }

    const success = await deleteCommittee(Number(id));
    if (!success) {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Official committee deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete official committee' }, { status: 500 });
  }
}
