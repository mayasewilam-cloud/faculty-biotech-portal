/**
 * Comprehensive End-to-End Test Suite for Faculty of Biotechnology Governance Portal
 * Verifies core workflows across Dean, Leadership, and Faculty Staff roles.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let cookieHeader = '';
let deanUserId = 6496;

async function runTestSuite() {
  console.log('===============================================================');
  console.log('🧪 STARTING FACULTY OF BIOTECHNOLOGY END-TO-END VERIFICATION');
  console.log(`Target Host: ${BASE_URL}`);
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• Testing: ${name}... `);
    try {
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health & Portal Root
  await test('Server Health & Portal Root Rendering (GET /)', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const html = await res.text();
    if (!html.includes('MSA') && !html.includes('Biotechnology')) {
      throw new Error('Root page missing expected university branding');
    }
  });

  // 2. Authentication as Dean Prof. Dr. Gehan Safwat
  await test('Dean Authentication (POST /api/auth)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'gehan.safwat@msa.edu.eg',
        password: 'Forall!@#123',
      }),
    });

    if (res.status !== 200) throw new Error(`Auth failed with status ${res.status}`);
    const data = await res.json();
    if (!data.user || data.user.id !== 6496) throw new Error('Auth returned invalid user object');

    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    if (setCookies && setCookies.length > 0) {
      cookieHeader = setCookies.map(c => (c ? c.split(';')[0] : '')).filter(Boolean).join('; ');
    }
  });

  // 3. User & Faculty Directory Retrieval
  await test('Faculty Directory Retrieval (GET /api/users)', async () => {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: cookieHeader },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.users) || data.users.length < 5) {
      throw new Error('Faculty directory returned insufficient users');
    }
  });

  // 4. Binary File Upload Simulation & Security Guards
  let uploadedFileUrl = '';
  let uploadedFileName = 'test_curriculum_spec.pdf';

  await test('File Upload Authentication Guard (POST /api/files/upload unauthenticated)', async () => {
    const dummyBlob = new Blob(['unauthorized binary stream'], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', dummyBlob, 'unauth_spec.pdf');
    const res = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      body: formData,
    });
    if (res.status !== 401) throw new Error(`Expected 401 for unauthenticated upload, got ${res.status}`);
  });

  await test('File Upload Extension Allowlist Guard (POST /api/files/upload dangerous ext)', async () => {
    const dummyBlob = new Blob(['malicious payload'], { type: 'application/x-msdownload' });
    const formData = new FormData();
    formData.append('file', dummyBlob, 'payload.exe');
    const res = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
      body: formData,
    });
    if (res.status !== 400) throw new Error(`Expected 400 for blocked extension, got ${res.status}`);
  });

  await test('Binary Deliverable File Upload (POST /api/files/upload authenticated)', async () => {
    const dummyBlob = new Blob(['%PDF-1.4 Mock Curriculum Specifications for NAQAAE Accreditation'], {
      type: 'application/pdf',
    });
    const formData = new FormData();
    formData.append('file', dummyBlob, uploadedFileName);

    const res = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
      body: formData,
    });

    if (res.status !== 200) throw new Error(`Upload failed with status ${res.status}`);
    const data = await res.json();
    if (!data.url || !data.filename) throw new Error('Upload response missing url or filename');
    uploadedFileUrl = data.url;
  });

  // 5. Binary File Read & Stream Verification & Security Guards
  await test('File Download Authentication Guard (GET /api/files/[filename] unauthenticated)', async () => {
    if (!uploadedFileUrl) throw new Error('No uploaded file to verify');
    const res = await fetch(`${BASE_URL}${uploadedFileUrl}`);
    if (res.status !== 401) throw new Error(`Expected 401 for unauthenticated download, got ${res.status}`);
  });

  await test('Binary Deliverable Download & MIME Streaming (GET /api/files/[filename] authenticated)', async () => {
    if (!uploadedFileUrl) throw new Error('No uploaded file to verify');
    const res = await fetch(`${BASE_URL}${uploadedFileUrl}`, {
      headers: { Cookie: cookieHeader },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error(`Unexpected Content-Type: ${contentType}`);
    }
  });

  // 6. Create Statutory Mandate / Task with Evidence
  let createdTaskId = null;
  await test('Task Creation with Deliverable (POST /api/tasks)', async () => {
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'NAQAAE E2E Audit: BIO405 Advanced Genomic Biotechnology Specs',
        description: 'Comprehensive review of practical lab manuals and learning outcome rubrics.',
        assigned_to_id: 6591, // Vice Dean
        department: 'Academic Staff',
        priority: 'high',
        deadline,
        attachment_name: uploadedFileName,
        attachment_type: 'application/pdf',
        attachment_size: 1024,
        attachment_url: uploadedFileUrl,
      }),
    });

    if (res.status !== 200) throw new Error(`Task creation failed: ${res.status}`);
    const data = await res.json();
    if (!data.task || !data.task.id) throw new Error(`Task creation missing ID: ${JSON.stringify(data)}`);
    createdTaskId = data.task.id;
    console.log(`[Created Task ID: ${createdTaskId}]`);
  });

  // 7. Complete Task with Completion Report
  await test('Faculty Task Completion Submission (PATCH /api/tasks/[id])', async () => {
    if (!createdTaskId) throw new Error('No created task to complete');
    const res = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        status: 'done',
        completion_notes: 'BIO405 syllabi mapped against national academic standards with full matrix.',
        attachment_url: uploadedFileUrl,
        attachment_name: uploadedFileName,
      }),
    });

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Task completion update failed: ${res.status} - ${JSON.stringify(data)} (taskId: ${createdTaskId})`);
  });

  // 8. Dean Official Verification & Sign-Off
  await test('Dean Official Sign-Off Stamp (POST /api/tasks/bulk action: acknowledge)', async () => {
    if (!createdTaskId) throw new Error('No task to acknowledge');
    const res = await fetch(`${BASE_URL}/api/tasks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'acknowledge',
        task_ids: [createdTaskId],
      }),
    });

    const data = await res.json();
    if (res.status !== 200) throw new Error(`Dean sign-off failed: ${res.status} - ${JSON.stringify(data)} (taskId: ${createdTaskId})`);
    if (!data.success) throw new Error('Sign-off reported unsuccessful');
  });

  // 9. Dean Revision Request Workflow
  await test('Dean Revision Request Workflow (PATCH /api/tasks/[id] action: request_revision)', async () => {
    if (!createdTaskId) throw new Error('No task to request revision on');
    const res = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'request_revision',
        revision_feedback: 'Please include student assessment weightings for the midterm practical stations.',
      }),
    });

    if (res.status !== 200) throw new Error(`Revision request failed: ${res.status}`);
    const data = await res.json();
    if (data.task && data.task.status !== 'revision_requested' && data.task.status !== 'in_progress') {
      throw new Error(`Expected status to revert to revision_requested, got ${data.task.status}`);
    }
  });

  // 10. Bulk Reschedule Workflow
  await test('Bulk Reschedule Operations (POST /api/tasks/bulk action: deadline)', async () => {
    if (!createdTaskId) throw new Error('No task for bulk reschedule');
    const res = await fetch(`${BASE_URL}/api/tasks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'deadline',
        task_ids: [createdTaskId],
        data: { days: 14 },
      }),
    });

    if (res.status !== 200) throw new Error(`Bulk reschedule failed: ${res.status}`);
  });

  // 11. Bulk Reassignment Workflow
  await test('Bulk Reassignment Operations (POST /api/tasks/bulk action: reassign)', async () => {
    if (!createdTaskId) throw new Error('No task for bulk reassign');
    const res = await fetch(`${BASE_URL}/api/tasks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'reassign',
        task_ids: [createdTaskId],
        data: { assigned_to_id: 6591 },
      }),
    });

    if (res.status !== 200) throw new Error(`Bulk reassign failed: ${res.status}`);
  });

  // 11b. Spreadsheet / Excel Two-Way Sync Workflow
  await test('Spreadsheet / Excel Two-Way Sync (POST /api/tasks/bulk operation: sync_spreadsheet)', async () => {
    if (!createdTaskId) throw new Error('No task for spreadsheet sync');
    const syncRes = await fetch(`${BASE_URL}/api/tasks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        operation: 'sync_spreadsheet',
        rows: [
          {
            title: 'NAQAAE E2E Audit: BIO405 Advanced Genomic Biotechnology Specs',
            status: 'in_progress',
            notes: 'Updated via Excel spreadsheet paste integration',
            hat_name: 'Quality'
          }
        ]
      })
    });

    if (syncRes.status !== 200) throw new Error(`Spreadsheet sync failed: ${syncRes.status}`);
    const syncData = await syncRes.json();
    if (!syncData.success || syncData.updatedCount === 0) {
      throw new Error(`Expected at least 1 task updated by spreadsheet sync, got: ${JSON.stringify(syncData)}`);
    }
  });

  // 12. Email Directive Dispatch Simulator
  await test('Academic Email Directive Simulator (POST /api/dispatch/email)', async () => {
    const res = await fetch(`${BASE_URL}/api/dispatch/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        task_id: createdTaskId,
        recipient_email: 'vice.dean@msa.edu.eg',
        recipient_name: 'Prof. Dr. Amr Ageez',
        subject: '[MSA BIO] E2E Verification Directive',
        content: 'This is an automated E2E test verification directive.',
        email_type: 'directive',
      }),
    });

    if (res.status !== 200) throw new Error(`Email dispatch failed: ${res.status}`);
    const data = await res.json();
    if (!data.success) throw new Error('Email dispatch returned non-success');
  });

  // 13. Audit Trail Verification
  await test('Audit Trail Recording (GET /api/logs)', async () => {
    const res = await fetch(`${BASE_URL}/api/logs`, {
      headers: { Cookie: cookieHeader },
    });
    if (res.status !== 200) throw new Error(`Failed to fetch logs: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.logs) || data.logs.length === 0) {
      throw new Error('Logs array is empty or invalid');
    }
    const actionTypes = data.logs.slice(0, 10).map((l) => l.action_type);
    const hasAuditLog = data.logs.some((l) => l.action_type === 'EMAIL_DISPATCHED' || l.action_type === 'TASK_CREATED' || l.action_type === 'LOGIN');
    if (!hasAuditLog) {
      throw new Error(`Expected activity logs not found. Recent actions: ${actionTypes.join(', ')}`);
    }
  });

  // 13b. 16 Strategic Faculty Operational Hats
  await test('16 Strategic Faculty Operational Hats Verification (GET /api/hats)', async () => {
    const res = await fetch(`${BASE_URL}/api/hats`, {
      headers: { Cookie: cookieHeader },
    });
    if (res.status !== 200) throw new Error(`Fetch hats failed: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.hats) || data.hats.length !== 16) {
      throw new Error(`Expected exactly 16 faculty operational hats, got ${data.hats?.length}`);
    }
    const expectedNames = [
      'Corporate Social Responsibilities',
      'Graduate Affairs',
      'Learning and Development',
      'Events',
      'Research',
      'Student Affairs',
      'Quality',
      'Learning',
      'Exams Moderation',
      'Center of Excellence',
      'Onboarding Ambassadors',
      'Labs and Studios',
      'Strategic Planning',
      'Purchasing',
      'Unique',
      'Internal Audit'
    ];
    for (const name of expectedNames) {
      if (!data.hats.some(h => h.name === name)) {
        throw new Error(`Missing expected faculty hat: ${name}`);
      }
    }
  });

  // 14. Official Standing Committees CRUD
  let testCommitteeId = null;
  await test('Official Standing Committees Lifecycle (GET, POST, PUT, DELETE /api/committees)', async () => {
    // List default committees
    const listRes = await fetch(`${BASE_URL}/api/committees`, {
      headers: { Cookie: cookieHeader },
    });
    if (listRes.status !== 200) throw new Error(`Fetch committees failed: ${listRes.status}`);
    const listData = await listRes.json();
    if (!Array.isArray(listData.committees) || listData.committees.length < 7) {
      throw new Error(`Expected at least 7 statutory standing committees, got ${listData.committees?.length}`);
    }

    // Create a new committee
    const createRes = await fetch(`${BASE_URL}/api/committees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        name: 'Biotechnology Curriculum & Industry Liaison Committee',
        name_ar: 'لجنة تطوير المناهج والارتباط الصناعي',
        code: 'E2E-BCILC',
        category: 'standing',
        decree_ref: 'Decree 88/2026',
        chair_name: 'Prof. Dr. Gehan Safwat',
        chair_title: 'Dean of Faculty',
        pillar_code: 'B',
        pillar_name: 'Academic Programs & Curricula',
        description: 'E2E verified standing committee for curriculum adaptation',
      }),
    });
    if (createRes.status !== 201) throw new Error(`Create committee failed: ${createRes.status}`);
    const createData = await createRes.json();
    testCommitteeId = createData.committee?.id;
    if (!testCommitteeId) throw new Error('Committee creation failed to return ID');

    // Appoint Member
    const addMemRes = await fetch(`${BASE_URL}/api/committees`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'add_member',
        committee_id: testCommitteeId,
        member: {
          user_id: 6591,
          name: 'Prof. Dr. Amr Ageez',
          title: 'Vice Dean',
          role: 'Deputy Chair',
          department: 'Academic Staff',
        },
      }),
    });
    if (addMemRes.status !== 200) throw new Error(`Appoint committee member failed: ${addMemRes.status}`);

    // Remove Member
    const remMemRes = await fetch(`${BASE_URL}/api/committees`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'remove_member',
        committee_id: testCommitteeId,
        member_id: 6591,
      }),
    });
    if (remMemRes.status !== 200) throw new Error(`Remove committee member failed: ${remMemRes.status}`);

    // Clean up test committee
    const delRes = await fetch(`${BASE_URL}/api/committees?id=${testCommitteeId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    });
    if (delRes.status !== 200) throw new Error(`Delete committee failed: ${delRes.status}`);
  });

  // 15. Presidential Delegations & Meetings Lifecycle
  let testMeetingId = null;
  await test('Presidential Delegations & Meetings CRUD (GET, POST, PUT, DELETE /api/meetings)', async () => {
    // List meetings
    const listRes = await fetch(`${BASE_URL}/api/meetings`, {
      headers: { Cookie: cookieHeader },
    });
    if (listRes.status !== 200) throw new Error(`Fetch meetings failed: ${listRes.status}`);

    // Create presidential delegation meeting
    const createRes = await fetch(`${BASE_URL}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'Presidential Consultation on NAQAAE Institutional Renewal',
        type: 'presidential_delegation',
        location: "President's Office (Administration Building A)",
        chair: 'University President',
        rapporteur: 'Prof. Dr. Gehan Safwat',
        objective: 'Align institutional KPI benchmarks with university presidency',
        attendees: [
          { user_id: 6496, name: 'Prof. Dr. Gehan Safwat', role: 'Dean & Delegation Lead', attended: true },
          { user_id: 6591, name: 'Prof. Dr. Amr Ageez', role: 'Vice Dean', attended: true },
        ],
        agenda: ['Review Accreditation KPIs', 'Approve Capital Equipment Upgrades'],
        decisions: ['Approved expedited procurement for lab bioreactors'],
        action_items: [
          {
            title: 'Draft Lab Equipment Procurement Spec Sheet',
            assigned_to_id: 6591,
            assigned_to_name: 'Prof. Dr. Amr Ageez',
            priority: 'urgent',
            deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
            pillar_code: 'F',
            status: 'pending',
          },
        ],
      }),
    });
    if (createRes.status !== 201) throw new Error(`Create meeting failed: ${createRes.status}`);
    const createData = await createRes.json();
    testMeetingId = createData.meeting?.id;
    if (!testMeetingId) throw new Error('Create meeting failed to return ID');

    // Update meeting
    const updateRes = await fetch(`${BASE_URL}/api/meetings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        meeting_id: testMeetingId,
        location: 'Presidential Executive Boardroom (Floor 2)',
      }),
    });
    if (updateRes.status !== 200) throw new Error(`Update meeting failed: ${updateRes.status}`);

    // Save Dean Briefing with Prof. Dr. Gehan Safwat
    const briefingRes = await fetch(`${BASE_URL}/api/meetings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'save_dean_briefing',
        meeting_id: testMeetingId,
        briefing: {
          required: true,
          phase: 'before',
          status: 'completed',
          briefing_date: new Date().toISOString(),
          location: "Dean's Executive Office (Building A, Room 301)",
          minutes: 'Pre-meeting strategic alignment with Dean Gehan Safwat: verified research throughput and lab specs.',
          decisions: ['Prioritize Phase 2 Bioreactor procurement before Presidential Council.'],
          action_items: [
            {
              id: 'AI-DEAN-1',
              title: 'Prepare executive slides for President',
              assigned_to_id: 6591,
              assigned_to_name: 'Prof. Dr. Amr Ageez',
              department: 'Academic Staff',
              priority: 'urgent',
              deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
              status: 'pending',
            },
          ],
        },
      }),
    });
    if (briefingRes.status !== 200) throw new Error(`Save Dean briefing failed: ${briefingRes.status}`);
    const briefingData = await briefingRes.json();
    if (!briefingData.meeting?.dean_briefing || briefingData.meeting.dean_briefing.status !== 'completed') {
      throw new Error('Dean briefing was not properly saved to meeting object');
    }

    // Delete meeting
    const delRes = await fetch(`${BASE_URL}/api/meetings?id=${testMeetingId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    });
    if (delRes.status !== 200) throw new Error(`Delete meeting failed: ${delRes.status}`);
  });

  // 15.1 Recurring Meetings Generator Test
  await test('Recurring Meetings Generation Series (POST /api/meetings with recurrence)', async () => {
    const res = await fetch(`${BASE_URL}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'Bi-Weekly Faculty Board Standing Session',
        type: 'faculty_board',
        location: 'Faculty Council Chamber',
        chair: 'Prof. Dr. Gehan Safwat',
        date: new Date().toISOString(),
        recurrence: {
          pattern: 'biweekly',
          interval: 2,
          repeat_count: 2,
        },
      }),
    });
    if (res.status !== 201) throw new Error(`Create recurring meeting failed: ${res.status}`);
    const data = await res.json();
    if (!data.meeting?.id) throw new Error('Failed to retrieve created recurring meeting ID');
    if (!Array.isArray(data.recurring_series) || data.recurring_series.length < 1) {
      throw new Error('Recurring series array missing in response');
    }

    // Clean up created recurring meetings
    await fetch(`${BASE_URL}/api/meetings?id=${data.meeting.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    });
    for (const m of data.recurring_series) {
      if (m.id) {
        await fetch(`${BASE_URL}/api/meetings?id=${m.id}`, {
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        });
      }
    }
  });

  await test('Monthly Calendar-Month Arithmetic Recurrence (POST /api/meetings monthly)', async () => {
    const baseDate = new Date('2026-01-15T10:00:00.000Z');
    const res = await fetch(`${BASE_URL}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'Monthly NAQAAE Steering Review',
        type: 'committee',
        location: 'Boardroom B',
        chair: 'Prof. Dr. Gehan Safwat',
        date: baseDate.toISOString(),
        recurrence: {
          pattern: 'monthly',
          interval: 1,
          repeat_count: 3,
        },
      }),
    });
    if (res.status !== 201) throw new Error(`Create monthly meeting failed: ${res.status}`);
    const data = await res.json();
    const series = [data.meeting, ...(data.recurring_series || [])];
    if (series.length !== 3) throw new Error(`Expected 3 occurrences in monthly series, got ${series.length}`);

    // Verify calendar month progression (Month 0, 1, 2)
    const m0 = new Date(series[0].date).getUTCMonth();
    const m1 = new Date(series[1].date).getUTCMonth();
    const m2 = new Date(series[2].date).getUTCMonth();
    if (m0 !== 0 || m1 !== 1 || m2 !== 2) {
      throw new Error(`Monthly recurrence failed calendar-month progression: months are ${m0}, ${m1}, ${m2}`);
    }

    // Cleanup
    for (const m of series) {
      if (m.id) {
        await fetch(`${BASE_URL}/api/meetings?id=${m.id}`, {
          method: 'DELETE',
          headers: { Cookie: cookieHeader },
        });
      }
    }
  });

  // 15.1.1 Dean Availability Settings API Lifecycle
  let createdSlotId = null;
  await test('Dean Availability Retrieval (GET /api/dean/availability)', async () => {
    const res = await fetch(`${BASE_URL}/api/dean/availability`, {
      headers: { Cookie: cookieHeader },
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.slots) || data.slots.length < 1) {
      throw new Error('Failed to retrieve Dean availability slots');
    }
  });

  await test('Dean Availability Configuration (POST /api/dean/availability)', async () => {
    const res = await fetch(`${BASE_URL}/api/dean/availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        day_of_week: 'Tuesday',
        start_time: '02:00 PM',
        end_time: '03:30 PM',
        location: "Dean's Office (Building A, Room 301)",
        note: 'E2E Test Availability Window',
      }),
    });
    if (res.status !== 200) throw new Error(`Add slot failed with ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.slot || !data.slot.id) throw new Error('Slot addition failed');
    createdSlotId = data.slot.id;
  });

  // 15.1.2 3-Option Meeting Request with Dean Prof. Dr. Gehan Safwat
  let requestedMeetingId = null;
  await test('3-Option Meeting Request Validation & Creation (POST /api/meetings with 3 options)', async () => {
    // 1. Validation check: Omitting 3 options should be rejected with 400
    const failRes = await fetch(`${BASE_URL}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'Strategic Briefing on Phase 2 Bioreactors',
        is_dean_request: true,
        time_options: [{ id: 'opt-1', label: 'Opt 1', date: '2026-10-25', time_slot: '10:00 AM' }],
      }),
    });
    if (failRes.status !== 400) throw new Error(`Expected 400 when less than 3 options provided, got ${failRes.status}`);

    // 2. Successful creation with 3 distinct options
    const successRes = await fetch(`${BASE_URL}/api/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'Strategic Pre-Briefing for Presidential Delegation (Bioreactors)',
        type: 'presidential_delegation',
        is_dean_request: true,
        time_options: [
          { id: 'opt-1', label: 'Option 1 (1st Choice)', date: '2026-10-25', time_slot: '10:00 AM - 11:30 AM', location: "Dean's Office (Building A, Room 301)" },
          { id: 'opt-2', label: 'Option 2 (2nd Choice)', date: '2026-10-27', time_slot: '01:00 PM - 02:30 PM', location: "Dean's Office (Building A, Room 301)" },
          { id: 'opt-3', label: 'Option 3 (3rd Choice)', date: '2026-10-29', time_slot: '11:00 AM - 01:00 PM', location: "Dean's Office (Building A, Room 301)" },
        ],
        objective: 'Align on university president agenda regarding biotechnology research grant.',
      }),
    });
    if (successRes.status !== 201) throw new Error(`Create meeting request failed with ${successRes.status}`);
    const data = await successRes.json();
    if (!data.meeting || data.meeting.status !== 'pending_dean_approval') {
      throw new Error(`Expected status 'pending_dean_approval', got '${data.meeting?.status}'`);
    }
    if (!Array.isArray(data.meeting.time_options) || data.meeting.time_options.length !== 3) {
      throw new Error('Meeting request failed to preserve 3 time options');
    }
    requestedMeetingId = data.meeting.id;
  });

  // 15.1.3 Dean 1-Click Option Selection & Meeting Confirmation
  await test('Dean Meeting Option Approval & Confirmation (PUT /api/meetings action: approve_dean_meeting_option)', async () => {
    if (!requestedMeetingId) throw new Error('Missing requestedMeetingId');
    const approveRes = await fetch(`${BASE_URL}/api/meetings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'approve_dean_meeting_option',
        meeting_id: requestedMeetingId,
        approved_option_id: 'opt-2',
        dean_notes: 'Approved for Wednesday slot. Please bring the technical budget proposal.',
      }),
    });
    if (approveRes.status !== 200) throw new Error(`Approve meeting slot failed with ${approveRes.status}`);
    const approveData = await approveRes.json();
    if (approveData.meeting?.status !== 'approved') {
      throw new Error(`Expected approved meeting status, got ${approveData.meeting?.status}`);
    }
    if (approveData.meeting?.date !== '2026-10-27') {
      throw new Error(`Expected date to be updated to Option 2 ('2026-10-27'), got '${approveData.meeting?.date}'`);
    }
    if (approveData.meeting?.selected_option_id !== 'opt-2') {
      throw new Error(`Expected selected_option_id 'opt-2', got '${approveData.meeting?.selected_option_id}'`);
    }

    // Verify activity log audit trail for DEAN_MEETING_APPROVED
    const logsRes = await fetch(`${BASE_URL}/api/logs`, { headers: { Cookie: cookieHeader } });
    const logsData = await logsRes.json();
    const approvedLog = (logsData.logs || []).find((l) => l.action_type === 'DEAN_MEETING_APPROVED');
    if (!approvedLog) throw new Error('DEAN_MEETING_APPROVED event not found in activity audit logs');

    // Clean up created meeting
    await fetch(`${BASE_URL}/api/meetings?id=${requestedMeetingId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    });
  });

  // Clean up created slot
  if (createdSlotId) {
    await test('Dean Availability Slot Cleanup (DELETE /api/dean/availability?id=...)', async () => {
      const delRes = await fetch(`${BASE_URL}/api/dean/availability?id=${createdSlotId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieHeader },
      });
      if (delRes.status !== 200) throw new Error(`Slot deletion failed: ${delRes.status}`);
    });
  }

  // 15.2 Scheduled Reminders & Cron Pipeline Security & Deduplication
  await test('Cron Authentication Guard: Missing Secret (GET /api/cron/reminders unauthenticated)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/reminders`);
    if (res.status !== 401) throw new Error(`Expected 401 when cron authorization missing, got ${res.status}`);
  });

  await test('Cron Authentication Guard: Invalid Secret (GET /api/cron/reminders?key=invalid)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/reminders?key=wrong-secret-token`);
    if (res.status !== 401) throw new Error(`Expected 401 for invalid secret, got ${res.status}`);
  });

  const devSecret = 'dev-cron-secret-faculty-2026';
  await test('Scheduled Reminders Authorized Execution & VAPID Status (GET /api/cron/reminders?key=...)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/reminders?key=${devSecret}`);
    if (res.status !== 200) throw new Error(`Cron reminders dispatch failed: ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.summary || typeof data.summary.total_urgent_tasks !== 'number') {
      throw new Error('Cron reminders returned invalid response summary');
    }
    if (data.summary.vapid_configured !== false) {
      throw new Error('Cron should accurately report vapid_configured: false when unconfigured');
    }
  });

  await test('Cron Reminders 24-Hour Deduplication (GET /api/cron/reminders?key=...)', async () => {
    const res = await fetch(`${BASE_URL}/api/cron/reminders?key=${devSecret}`);
    if (res.status !== 200) throw new Error(`Second cron execution failed: ${res.status}`);
    const data = await res.json();
    if (typeof data.summary.skipped_duplicates !== 'number') {
      throw new Error('Cron response missing skipped_duplicates count');
    }
  });

  await test('Push Delivery Transparent VAPID Notice (POST /api/push/send)', async () => {
    const res = await fetch(`${BASE_URL}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'Audit Verification Notification',
        body: 'Testing VAPID configuration reporting',
      }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'vapid_unconfigured') {
      throw new Error(`Expected status 'vapid_unconfigured', got '${data.status}'`);
    }
  });

  // 16. Faculty Members Management Lifecycle (Create, Edit, Bulk Import, Guard, Delete)
  let testMemberId = null;
  await test('Faculty Member Creation (POST /api/users)', async () => {
    // Ensure clean slate for test users in case of previous abort
    try {
      const dirCheck = await fetch(`${BASE_URL}/api/users`, { headers: { Cookie: cookieHeader } });
      const dirData = await dirCheck.json();
      if (Array.isArray(dirData.users)) {
        for (const u of dirData.users) {
          if (u.email.startsWith('e2e.')) {
            await fetch(`${BASE_URL}/api/users?id=${u.id}`, { method: 'DELETE', headers: { Cookie: cookieHeader } });
          }
        }
      }
    } catch {}

    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        email: 'e2e.faculty.test@msa.edu.eg',
        full_name: 'Dr. Test BioTech Member',
        title: 'Dr.',
        role: 'professor',
        department: 'Academic Staff',
        phone: '01012345678',
        password: 'faculty123',
      }),
    });
    if (res.status !== 200) throw new Error(`Create faculty member failed with ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.user || !data.user.id) throw new Error('Create faculty returned invalid response');
    testMemberId = data.user.id;
  });

  await test('Faculty Member Profile Edit & Persistence (PUT /api/users)', async () => {
    if (!testMemberId) throw new Error('Missing testMemberId');
    const updateRes = await fetch(`${BASE_URL}/api/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        id: testMemberId,
        full_name: 'Assoc. Prof. Dr. Test BioTech Member Modified',
        title: 'Assoc. Prof. Dr.',
        phone: '01198765432',
      }),
    });
    if (updateRes.status !== 200) throw new Error(`Update faculty member failed: ${updateRes.status}`);
    const updateData = await updateRes.json();
    if (updateData.user.full_name !== 'Assoc. Prof. Dr. Test BioTech Member Modified') {
      throw new Error(`Profile name not updated: got ${updateData.user.full_name}`);
    }

    // Verify through directory GET /api/users
    const dirRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: cookieHeader }
    });
    const dirData = await dirRes.json();
    const found = dirData.users.find(u => u.id === testMemberId);
    if (!found || found.title !== 'Assoc. Prof. Dr.' || found.full_name !== 'Assoc. Prof. Dr. Test BioTech Member Modified') {
      throw new Error('Directory verification failed to show updated faculty details');
    }
  });

  let bulkImportedId = null;
  await test('Faculty Member Bulk Import & Update (POST /api/users bulk)', async () => {
    const bulkRes = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        users: [
          {
            email: 'e2e.bulk.import@msa.edu.eg',
            full_name: 'Dr. E2E Bulk Member',
            title: 'Dr.',
            role: 'professor',
            department: 'Academic Staff',
            phone: '01055556666',
          },
          {
            email: 'e2e.faculty.test@msa.edu.eg',
            full_name: 'Prof. Dr. Test BioTech Member Synced',
            title: 'Prof. Dr.',
            role: 'professor',
            department: 'Academic Staff',
          }
        ]
      })
    });
    if (bulkRes.status !== 200) throw new Error(`Bulk import failed: ${bulkRes.status}`);
    const bulkData = await bulkRes.json();
    if (!bulkData.success || bulkData.imported < 1 || bulkData.updated < 1) {
      throw new Error(`Bulk import counts unexpected: imported=${bulkData.imported}, updated=${bulkData.updated}`);
    }

    const dirRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: cookieHeader }
    });
    const dirData = await dirRes.json();
    const newMember = dirData.users.find(u => u.email === 'e2e.bulk.import@msa.edu.eg');
    if (!newMember) throw new Error('Bulk imported member not found in directory');
    bulkImportedId = newMember.id;
  });

  await test('Constitutional Leadership Protection Guard (DELETE /api/users?id=6496)', async () => {
    const guardRes = await fetch(`${BASE_URL}/api/users?id=6496`, {
      method: 'DELETE',
      headers: { Cookie: cookieHeader }
    });
    if (guardRes.status !== 403) throw new Error(`Expected 403 guard on Dean account, got ${guardRes.status}`);
  });

  await test('Faculty Member Removal & Cleanup (DELETE /api/users?id=...)', async () => {
    if (testMemberId) {
      const del1 = await fetch(`${BASE_URL}/api/users?id=${testMemberId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieHeader }
      });
      if (del1.status !== 200) throw new Error(`Delete test member failed: ${del1.status}`);
    }

    if (bulkImportedId) {
      const del2 = await fetch(`${BASE_URL}/api/users?id=${bulkImportedId}`, {
        method: 'DELETE',
        headers: { Cookie: cookieHeader }
      });
      if (del2.status !== 200) throw new Error(`Delete bulk imported member failed: ${del2.status}`);
    }

    // Verify removed from directory
    const dirRes = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: cookieHeader }
    });
    const dirData = await dirRes.json();
    if (dirData.users.some(u => u.id === testMemberId || u.id === bulkImportedId)) {
      throw new Error('Deleted member still present in faculty directory');
    }
  });

  // Cleanup: Delete test task
  if (createdTaskId) {
    await test('Clean Up Test Task (POST /api/tasks/bulk action: delete)', async () => {
      const res = await fetch(`${BASE_URL}/api/tasks/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          action: 'delete',
          task_ids: [createdTaskId],
        }),
      });
      if (res.status !== 200) throw new Error(`Cleanup failed: ${res.status}`);
    });
  }

  // 17. Confidential Action Requests & Privacy Guards
  let confidentialCreatedIds = [];
  const testDeliverableFileName = 'confidential_syllabus_salma.pdf';
  
  await test('Confidential Multi-Assignee Submission Request (POST /api/tasks is_submission_request)', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'Fall 2026 Laboratory Syllabus Submission',
        description: 'Please upload your department approved laboratory syllabus and schedule.',
        is_submission_request: true,
        submission_type: 'file_upload',
        is_confidential: true,
        target_user_ids: [12426, 15655], // Salma Raouf & Hala Khorshid
        form_link: 'https://docs.google.com/spreadsheets/d/18ptos5jsQWknMQUy9AEjhhyAlCvmlU_LreOlHALGUcA/edit',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        due_time: '13:00',
      }),
    });

    if (res.status !== 200 && res.status !== 201) throw new Error(`Create confidential request failed: ${res.status}`);
    const data = await res.json();
    const tasksList = data.tasks || (data.task ? [data.task] : []);
    if (!Array.isArray(tasksList) || tasksList.length !== 2) {
      throw new Error(`Expected 2 created tasks for 2 targets, got ${tasksList?.length}`);
    }
    confidentialCreatedIds = tasksList.map(t => t.id);
    if (!tasksList[0].group_id || !tasksList[0].is_confidential) {
      throw new Error('Confidentiality metadata not properly stamped on created tasks');
    }
  });

  let actualUploadedFileName = '';

  await test('Assignee Deliverable Upload & Task Submission (PATCH /api/tasks/[id])', async () => {
    if (confidentialCreatedIds.length === 0) throw new Error('No confidential tasks to test');
    const targetTaskId = confidentialCreatedIds[0];

    // Upload mock deliverable
    const dummyBlob = new Blob(['%PDF-1.4 Mock Confidential Syllabus'], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', dummyBlob, testDeliverableFileName);
    const uploadRes = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
      body: formData,
    });
    if (uploadRes.status !== 200) throw new Error(`Upload failed: ${uploadRes.status}`);
    const uploadData = await uploadRes.json();
    actualUploadedFileName = uploadData.filename;

    // Patch task with completed deliverable
    const patchRes = await fetch(`${BASE_URL}/api/tasks/${targetTaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        status: 'completed',
        completion_notes: 'Completed lab syllabus uploaded for review.',
        attachment_url: uploadData.url,
        attachment_name: uploadData.filename,
        attachment_size: 1024,
      }),
    });
    if (patchRes.status !== 200) throw new Error(`Patch task failed: ${patchRes.status}`);
    const patchData = await patchRes.json();
    if (patchData.task.status !== 'completed' || !patchData.task.attachment_url) {
      throw new Error('Task was not marked completed with attachment');
    }
  });

  await test('Strict Confidentiality File Download Authorization Guard (GET /api/files/[filename])', async () => {
    if (!actualUploadedFileName) throw new Error('No uploaded file name to verify download guard');

    // 1. Unauthenticated download attempt must be rejected (401)
    const unauthRes = await fetch(`${BASE_URL}/api/files/${actualUploadedFileName}`);
    if (unauthRes.status !== 401) throw new Error(`Expected 401 for unauthenticated request, got ${unauthRes.status}`);

    // 2. Requester / Dean download attempt must succeed (200)
    const authRes = await fetch(`${BASE_URL}/api/files/${actualUploadedFileName}`, {
      headers: { Cookie: cookieHeader }
    });
    if (authRes.status !== 200) throw new Error(`Expected 200 for authorized user, got ${authRes.status}`);
  });

  // ── DELEGATED GOVERNANCE & RESPONSIBILITY MODELS TEST ──
  let delegatedSharedTaskId = null;

  await test('Delegated Governance: Shared Deliverable Task Creation for Committee', async () => {
    const res = await fetch(`${BASE_URL}/api/tasks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        operation: 'dispatch_bulk',
        title: 'E2E Test: Committee Biosafety Manual Shared Deliverable',
        description: 'Joint statutory committee deliverable under delegated authority.',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        target_type: 'committee',
        target_committee_id: 1,
        task_owner_id: 6496,
        task_owner_name: 'Prof. Dr. Gehan Safwat',
        responsibility_model: 'shared_deliverable',
        requires_dean_approval: 0,
      }),
    });

    if (res.status !== 200) throw new Error(`Failed to create shared committee task: ${res.status}`);
    const data = await res.json();
    if (!data.tasks || data.tasks.length !== 1) {
      throw new Error(`Expected exactly 1 shared deliverable task, got ${data.tasks?.length}`);
    }
    delegatedSharedTaskId = data.tasks[0].id;
  });

  await test('Delegated Governance: Task Owner Sign-Off without Dean Bottleneck', async () => {
    if (!delegatedSharedTaskId) throw new Error('No delegated shared task to test');
    const res = await fetch(`${BASE_URL}/api/tasks/${delegatedSharedTaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        status: 'done',
        completion_notes: 'Consolidated report finalized by committee lead.',
      }),
    });

    if (res.status !== 200) throw new Error(`Failed to sign off delegated task: ${res.status}`);
    const data = await res.json();
    if (data.task.status !== 'done') {
      throw new Error(`Expected status to be done, got ${data.task.status}`);
    }

    // Clean up
    await fetch(`${BASE_URL}/api/tasks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'delete',
        task_ids: [delegatedSharedTaskId],
      }),
    });
  });

  let subTaskTestParentId = null;
  let subTaskId = null;
  await test('Delegated Governance: Sub-Responsibility Division (Option B Parent-Child Linkage)', async () => {
    // 1. Create Master Project Task
    const parentRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'Master Accreditation Self-Study Dossier 2026',
        description: 'Overarching institutional project divided into departmental responsibilities.',
        assigned_to_id: 6591,
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 14).toISOString(),
        task_owner_id: 6496,
        task_owner_name: 'Prof. Dr. Gehan Safwat',
        requires_dean_approval: 0,
      }),
    });
    if (parentRes.status !== 200) throw new Error(`Create parent task failed: ${parentRes.status}`);
    const parentData = await parentRes.json();
    subTaskTestParentId = parentData.task?.id || (parentData.tasks && parentData.tasks[0]?.id);

    // 2. Delegate Sub-Responsibility (Child task)
    const subRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        title: 'Section 4.2 Practical Lab Specs Matrix',
        description: 'Individual deliverable for laboratory learning outcomes.',
        assigned_to_id: 6591,
        priority: 'medium',
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        parent_task_id: subTaskTestParentId,
        task_owner_id: 6496,
        task_owner_name: 'Prof. Dr. Gehan Safwat',
      }),
    });
    if (subRes.status !== 200) throw new Error(`Create sub-task failed: ${subRes.status}`);
    const subData = await subRes.json();
    const createdSubTask = subData.task || (subData.tasks && subData.tasks[0]);
    if (!createdSubTask || Number(createdSubTask.parent_task_id) !== Number(subTaskTestParentId)) {
      throw new Error(`Expected parent_task_id ${subTaskTestParentId}, got ${createdSubTask?.parent_task_id}`);
    }
    subTaskId = createdSubTask.id;

    // 3. Complete Sub-Task
    const completeRes = await fetch(`${BASE_URL}/api/tasks/${subTaskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        status: 'done',
        completion_notes: 'Matrix verified and attached.',
      }),
    });
    if (completeRes.status !== 200) throw new Error(`Sub-task completion failed: ${completeRes.status}`);

    // Clean up
    await fetch(`${BASE_URL}/api/tasks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        action: 'delete',
        task_ids: [subTaskId, subTaskTestParentId],
      }),
    });
  });

  // Clean up confidential test tasks
  if (confidentialCreatedIds.length > 0) {
    await test('Clean Up Confidential Test Tasks (POST /api/tasks/bulk action: delete)', async () => {
      const res = await fetch(`${BASE_URL}/api/tasks/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          action: 'delete',
          task_ids: confidentialCreatedIds,
        }),
      });
      if (res.status !== 200) throw new Error(`Cleanup failed: ${res.status}`);
    });
  }

  console.log('\n===============================================================');
  console.log(`🏁 TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
