
import { NextResponse } from 'next/server';
import {
  getAllMeetings,
  getMeetingById,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  convertMeetingActionItemToTask,
  execute,
} from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/meetings: Retrieve list of faculty meetings & MoMs
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const meeting = await getMeetingById(Number(id));
      if (!meeting) {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      }
      return NextResponse.json({ meeting });
    }

    const meetings = await getAllMeetings();
    return NextResponse.json({ meetings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch meetings' }, { status: 500 });
  }
}

// POST /api/meetings: Create a new Meeting & Minutes of Meeting (MoM)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      type = 'departmental',
      hat_id = null,
      hat_name = null,
      date = new Date().toISOString(),
      location = "Dean's Office (Building A, Room 301)",
      chair = user.full_name,
      rapporteur = '',
      objective = '',
      attendees = [],
      agenda = [],
      minutes_body = '',
      decisions = [],
      action_items = [],
      status = 'approved',
      recurrence,
      dean_briefing,
      time_options = [],
      is_dean_request = false,
      dean_notes = '',
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Meeting title is required' }, { status: 400 });
    }

    if (is_dean_request && (!Array.isArray(time_options) || time_options.length < 3)) {
      return NextResponse.json({ error: 'Please propose 3 preferred time slot options for Dean Prof. Dr. Gehan to review.' }, { status: 400 });
    }

    const initialDate = is_dean_request && time_options[0]?.date ? time_options[0].date : date;
    const initialLocation = is_dean_request ? "Dean's Office (Building A, Room 301)" : location.trim();
    const initialChair = is_dean_request ? 'Prof. Dr. Gehan Safwat (Dean)' : chair.trim();
    const meetingStatus = is_dean_request ? 'pending_dean_approval' : status;

    const newMeeting = await createMeeting({
      title: title.trim(),
      type,
      hat_id: hat_id ? Number(hat_id) : null,
      hat_name,
      date: initialDate,
      location: initialLocation,
      chair: initialChair,
      rapporteur: rapporteur ? rapporteur.trim() : '',
      objective: objective ? objective.trim() : '',
      attendees: Array.isArray(attendees) ? attendees : [],
      agenda: Array.isArray(agenda) ? agenda : [],
      minutes_body: minutes_body ? minutes_body.trim() : '',
      decisions: Array.isArray(decisions) ? decisions : [],
      action_items: Array.isArray(action_items) ? action_items : [],
      recurrence: recurrence && recurrence.pattern !== 'none' ? recurrence : undefined,
      dean_briefing: dean_briefing || undefined,
      time_options: Array.isArray(time_options) ? time_options : [],
      is_dean_request: Boolean(is_dean_request),
      dean_notes: dean_notes ? dean_notes.trim() : undefined,
      status: meetingStatus,
      created_by_id: user.id,
      created_by_name: user.full_name,
    });

    if (is_dean_request) {
      await execute(
        'INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          user.id,
          user.full_name,
          user.role,
          'DEAN_MEETING_REQUESTED',
          `Meeting Requested with Dean Gehan: ${newMeeting.title}`,
          JSON.stringify({
            meeting_id: newMeeting.id,
            title: newMeeting.title,
            requester: user.full_name,
            options_count: (time_options || []).length,
            options: time_options,
          }),
          '127.0.0.1',
        ]
      );
    }

    // If recurring, generate the scheduled series occurrences
    const recurringSeries: any[] = [];
    if (recurrence && recurrence.pattern !== 'none' && recurrence.repeat_count && recurrence.repeat_count > 1) {
      const baseDate = new Date(date);
      if (isNaN(baseDate.getTime())) {
        return NextResponse.json({ error: 'Invalid meeting date provided' }, { status: 400 });
      }

      for (let i = 1; i < recurrence.repeat_count; i++) {
        let nextDate: Date;
        if (recurrence.pattern === 'monthly') {
          // Calendar-month arithmetic preserving day of month or clamping to last day
          nextDate = new Date(baseDate);
          const expectedMonth = (baseDate.getMonth() + i) % 12;
          nextDate.setMonth(baseDate.getMonth() + i);
          if (nextDate.getMonth() !== expectedMonth) {
            nextDate.setDate(0);
          }
        } else if (recurrence.pattern === 'biweekly') {
          nextDate = new Date(baseDate.getTime() + 86400000 * 14 * i);
        } else {
          // weekly
          nextDate = new Date(baseDate.getTime() + 86400000 * 7 * i);
        }

        const child = await createMeeting({
          title: `${title.trim()} (Session #${i + 1})`,
          type,
          hat_id: hat_id ? Number(hat_id) : null,
          hat_name,
          date: nextDate.toISOString(),
          location: location.trim(),
          chair: chair.trim(),
          rapporteur: rapporteur ? rapporteur.trim() : '',
          objective: objective ? objective.trim() : '',
          attendees: Array.isArray(attendees) ? attendees : [],
          agenda: Array.isArray(agenda) ? agenda : [],
          minutes_body: '',
          decisions: [],
          action_items: [],
          status: 'draft',
          recurrence: {
            ...recurrence,
            parent_meeting_id: newMeeting.id,
          },
          created_by_id: user.id,
          created_by_name: user.full_name,
        });
        recurringSeries.push(child);
      }
    }

    return NextResponse.json({
      meeting: newMeeting,
      recurring_series: recurringSeries,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create meeting' }, { status: 500 });
  }
}

// PUT /api/meetings: Update meeting or convert action item into official task
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, meeting_id, action_item_id, briefing, ...updateData } = body;

    if (!meeting_id) {
      return NextResponse.json({ error: 'meeting_id is required' }, { status: 400 });
    }

    // Save or update Dean Briefing for Presidential Delegations
    if (action === 'save_dean_briefing') {
      const updated = await updateMeeting(Number(meeting_id), { dean_briefing: briefing });
      if (!updated) {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Dean briefing and minutes recorded successfully',
        meeting: updated,
      });
    }

    // Convert an action item to a live faculty task
    if (action === 'convert_action_item') {
      if (!action_item_id) {
        return NextResponse.json({ error: 'action_item_id is required' }, { status: 400 });
      }

      const result = await convertMeetingActionItemToTask(Number(meeting_id), String(action_item_id), user.id);
      if (!result) {
        return NextResponse.json({ error: 'Meeting or Action Item not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Action item converted to live faculty task successfully',
        task: result.task,
        meeting: result.meeting,
      });
    }

    // Approve Dean Meeting Option (Select exactly 1 of 3 proposed slots)
    if (action === 'approve_dean_meeting_option') {
      const isDeanOrAdmin = user.role === 'admin' || user.role === 'dean' || user.id === 6496 || user.id === 99;
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Only Dean Prof. Dr. Gehan or authorized leadership can approve meeting slots' }, { status: 403 });
      }

      const { approved_option_id, dean_notes } = body;
      if (!approved_option_id) {
        return NextResponse.json({ error: 'approved_option_id is required' }, { status: 400 });
      }

      const meeting = await getMeetingById(Number(meeting_id));
      if (!meeting) {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      }

      const options = meeting.time_options || [];
      const chosenOption = options.find((opt: any) => opt.id === approved_option_id);
      if (!chosenOption) {
        return NextResponse.json({ error: 'Selected slot option was not found in proposed options' }, { status: 400 });
      }

      const finalDate = chosenOption.date || chosenOption.time_slot || meeting.date;
      const finalLocation = chosenOption.location || "Dean's Office (Building A, Room 301)";

      const updated = await updateMeeting(Number(meeting_id), {
        date: finalDate,
        location: finalLocation,
        selected_option_id: approved_option_id,
        status: 'approved',
        dean_notes: dean_notes !== undefined ? dean_notes.trim() : meeting.dean_notes,
      });

      // Audit log & notification trigger
      await execute(
        'INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          user.id,
          user.full_name,
          user.role,
          'DEAN_MEETING_APPROVED',
          `Meeting Confirmed by Dean Gehan: ${meeting.title}`,
          JSON.stringify({
            meeting_id: meeting.id,
            title: meeting.title,
            approved_option: chosenOption,
            location: finalLocation,
            date: finalDate,
            requester_id: meeting.created_by_id,
            requester_name: meeting.created_by_name,
            dean_notes: dean_notes || '',
          }),
          '127.0.0.1',
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Meeting successfully confirmed for ${finalDate} at ${finalLocation}`,
        meeting: updated,
        approved_option: chosenOption,
      });
    }

    // Decline / Reject Dean Meeting Request
    if (action === 'decline_dean_meeting') {
      const isDeanOrAdmin = user.role === 'admin' || user.role === 'dean' || user.id === 6496 || user.id === 99;
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Only Dean Prof. Dr. Gehan or authorized leadership can decline requested meetings' }, { status: 403 });
      }

      const { dean_notes } = body;
      const meeting = await getMeetingById(Number(meeting_id));
      if (!meeting) {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
      }

      const updated = await updateMeeting(Number(meeting_id), {
        status: 'rejected',
        dean_notes: dean_notes ? dean_notes.trim() : 'Declined by Dean. Please coordinate with the Executive Office.',
      });

      await execute(
        'INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          user.id,
          user.full_name,
          user.role,
          'DEAN_MEETING_DECLINED',
          `Meeting Request Declined by Dean: ${meeting.title}`,
          JSON.stringify({
            meeting_id: meeting.id,
            title: meeting.title,
            requester_id: meeting.created_by_id,
            requester_name: meeting.created_by_name,
            reason: dean_notes || '',
          }),
          '127.0.0.1',
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Meeting request declined',
        meeting: updated,
      });
    }

    // Update meeting details
    const updated = await updateMeeting(Number(meeting_id), updateData);
    if (!updated) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({ meeting: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update meeting' }, { status: 500 });
  }
}

// DELETE /api/meetings: Delete meeting
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
    }

    await deleteMeeting(Number(id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete meeting' }, { status: 500 });
  }
}
