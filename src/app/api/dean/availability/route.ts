
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDeanAvailabilitySlots, saveDeanAvailabilitySlots, execute } from '@/lib/db';
import { DeanAvailabilitySlot } from '@/types';

// GET /api/dean/availability: Retrieve Dean Prof. Dr. Gehan's available time slot options
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slots = await getDeanAvailabilitySlots();
    return NextResponse.json({ success: true, slots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch Dean availability' }, { status: 500 });
  }
}

// POST /api/dean/availability: Add a new availability slot
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isDeanOrAdmin = user.role === 'admin' || user.role === 'dean' || user.id === 6496 || user.id === 99;
    if (!isDeanOrAdmin) {
      return NextResponse.json({ error: 'Only the Dean can configure availability slots' }, { status: 403 });
    }

    const body = await req.json();
    const { day_of_week, start_time, end_time, location, note } = body;

    if (!day_of_week || !start_time || !end_time) {
      return NextResponse.json({ error: 'day_of_week, start_time, and end_time are required' }, { status: 400 });
    }

    const slots = await getDeanAvailabilitySlots();
    const newSlot: DeanAvailabilitySlot = {
      id: `slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      day_of_week: day_of_week.trim(),
      start_time: start_time.trim(),
      end_time: end_time.trim(),
      location: (location && location.trim()) || "Dean's Office (Building A, Room 301)",
      note: note ? note.trim() : undefined,
      is_active: true,
    };

    const updatedSlots = [...slots, newSlot];
    await saveDeanAvailabilitySlots(updatedSlots);

    // Audit log
    await execute(
      'INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        user.id,
        user.full_name,
        user.role,
        'DEAN_AVAILABILITY_CONFIGURED',
        `Dean Availability Slot Added: ${newSlot.day_of_week} ${newSlot.start_time}-${newSlot.end_time}`,
        JSON.stringify(newSlot),
        '127.0.0.1',
      ]
    );

    return NextResponse.json({ success: true, slot: newSlot, slots: updatedSlots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add availability slot' }, { status: 500 });
  }
}

// PUT /api/dean/availability: Update slot or save entire slot configuration
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isDeanOrAdmin = user.role === 'admin' || user.role === 'dean' || user.id === 6496 || user.id === 99;
    if (!isDeanOrAdmin) {
      return NextResponse.json({ error: 'Only the Dean can modify availability slots' }, { status: 403 });
    }

    const body = await req.json();

    // Batch update all slots if 'slots' array passed
    if (Array.isArray(body.slots)) {
      await saveDeanAvailabilitySlots(body.slots);
      return NextResponse.json({ success: true, slots: body.slots });
    }

    // Single slot update
    const { id, day_of_week, start_time, end_time, location, note, is_active } = body;
    if (!id) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });
    }

    const currentSlots = await getDeanAvailabilitySlots();
    const idx = currentSlots.findIndex(s => s.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const updatedSlot: DeanAvailabilitySlot = {
      ...currentSlots[idx],
      day_of_week: day_of_week !== undefined ? day_of_week.trim() : currentSlots[idx].day_of_week,
      start_time: start_time !== undefined ? start_time.trim() : currentSlots[idx].start_time,
      end_time: end_time !== undefined ? end_time.trim() : currentSlots[idx].end_time,
      location: location !== undefined ? location.trim() : currentSlots[idx].location,
      note: note !== undefined ? note.trim() : currentSlots[idx].note,
      is_active: is_active !== undefined ? Boolean(is_active) : currentSlots[idx].is_active,
    };

    const newSlots = [...currentSlots];
    newSlots[idx] = updatedSlot;
    await saveDeanAvailabilitySlots(newSlots);

    return NextResponse.json({ success: true, slot: updatedSlot, slots: newSlots });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update availability slot' }, { status: 500 });
  }
}

// DELETE /api/dean/availability: Remove an availability slot
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isDeanOrAdmin = user.role === 'admin' || user.role === 'dean' || user.id === 6496 || user.id === 99;
    if (!isDeanOrAdmin) {
      return NextResponse.json({ error: 'Only the Dean can delete availability slots' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 });
    }

    const currentSlots = await getDeanAvailabilitySlots();
    const filtered = currentSlots.filter(s => s.id !== id);
    await saveDeanAvailabilitySlots(filtered);

    return NextResponse.json({ success: true, slots: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete slot' }, { status: 500 });
  }
}
