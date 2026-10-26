'use client';

import React, { useState, useEffect } from 'react';
import { User, Hat, FacultyCommittee, DeanAvailabilitySlot, MeetingTimeOption, Task } from '@/types';
import { X, Calendar, Clock, MapPin, Users, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RequestDeanMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  staff: any[];
  hats: Hat[];
  committees: FacultyCommittee[];
  deanSlots: DeanAvailabilitySlot[];
  onMeetingRequested: (newMeeting: any) => void;
  task?: Task | null;
}

export const RequestDeanMeetingModal: React.FC<RequestDeanMeetingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  staff,
  hats,
  committees,
  deanSlots,
  onMeetingRequested,
  task,
}) => {
  const [title, setTitle] = useState('');
  const [purposeCategory, setPurposeCategory] = useState<string>('pre_presidential');
  const [customPurpose, setCustomPurpose] = useState('');
  const [hatId, setHatId] = useState('');
  const [committeeId, setCommitteeId] = useState('');
  const [coordinatorId, setCoordinatorId] = useState<number>(14686);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>(currentUser ? [currentUser.id] : [6496]);
  const [location] = useState("Dean's Office (Building A, Room 301)");
  const [briefingNotes, setBriefingNotes] = useState('');

  // Prepopulate task context if requested from a task
  useEffect(() => {
    if (task && isOpen) {
      setTitle(`Task Guidance: ${task.title}`);
      if (task.hat_id) setHatId(String(task.hat_id));
      if (task.committee_id) setCommitteeId(String(task.committee_id));
      setBriefingNotes(`Requesting consultation with Dean Prof. Dr. Gehan Safwat regarding deliverable: "${task.title}".`);
    }
  }, [task, isOpen]);

  // 3 Options State
  const activeDeanSlots = deanSlots.filter(s => s.is_active);

  // Helper to format default dates
  const getDateOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [opt1Date, setOpt1Date] = useState(getDateOffset(2));
  const [opt1Time, setOpt1Time] = useState(activeDeanSlots[0] ? `${activeDeanSlots[0].start_time} - ${activeDeanSlots[0].end_time}` : '10:00 AM - 11:30 AM');
  const [opt1SlotId, setOpt1SlotId] = useState(activeDeanSlots[0]?.id || '');

  const [opt2Date, setOpt2Date] = useState(getDateOffset(4));
  const [opt2Time, setOpt2Time] = useState(activeDeanSlots[1] ? `${activeDeanSlots[1].start_time} - ${activeDeanSlots[1].end_time}` : '01:00 PM - 02:30 PM');
  const [opt2SlotId, setOpt2SlotId] = useState(activeDeanSlots[1]?.id || '');

  const [opt3Date, setOpt3Date] = useState(getDateOffset(7));
  const [opt3Time, setOpt3Time] = useState(activeDeanSlots[2] ? `${activeDeanSlots[2].start_time} - ${activeDeanSlots[2].end_time}` : '11:00 AM - 01:00 PM');
  const [opt3SlotId, setOpt3SlotId] = useState(activeDeanSlots[2]?.id || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleStaff = (id: number) => {
    setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSlotSelect = (optionNumber: 1 | 2 | 3, slotId: string) => {
    const s = activeDeanSlots.find(slot => slot.id === slotId);
    if (!s) return;
    const timeStr = `${s.start_time} - ${s.end_time}`;
    if (optionNumber === 1) {
      setOpt1SlotId(slotId);
      setOpt1Time(timeStr);
    } else if (optionNumber === 2) {
      setOpt2SlotId(slotId);
      setOpt2Time(timeStr);
    } else {
      setOpt3SlotId(slotId);
      setOpt3Time(timeStr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Meeting title / subject is required.');
      return;
    }

    // Verify 3 distinct options
    const opt1Key = `${opt1Date}_${opt1Time}`;
    const opt2Key = `${opt2Date}_${opt2Time}`;
    const opt3Key = `${opt3Date}_${opt3Time}`;

    if (opt1Key === opt2Key || opt1Key === opt3Key || opt2Key === opt3Key) {
      setError('Please provide 3 distinct date & time options so the Dean can choose between different times.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const time_options: MeetingTimeOption[] = [
        {
          id: 'opt-1',
          label: 'Option 1 (1st Choice)',
          date: opt1Date,
          time_slot: opt1Time,
          location,
          slot_id: opt1SlotId,
        },
        {
          id: 'opt-2',
          label: 'Option 2 (2nd Choice)',
          date: opt2Date,
          time_slot: opt2Time,
          location,
          slot_id: opt2SlotId,
        },
        {
          id: 'opt-3',
          label: 'Option 3 (3rd Choice)',
          date: opt3Date,
          time_slot: opt3Time,
          location,
          slot_id: opt3SlotId,
        },
      ];

      const attendees = selectedStaffIds.map(id => {
        const u = staff.find(s => s.id === id);
        return {
          user_id: id,
          name: u ? `${u.title ? u.title + ' ' : ''}${u.full_name}` : `Staff #${id}`,
          email: u?.email || '',
          role: id === 6496 ? 'Dean' : id === currentUser?.id ? 'Requester / Delegation Lead' : 'Delegation Member',
          department: u?.department || 'Academic Staff',
          attended: true,
        };
      });

      // Ensure Dean is in attendees
      if (!attendees.some(a => a.user_id === 6496)) {
        attendees.push({
          user_id: 6496,
          name: 'Prof. Dr. Gehan Safwat',
          email: 'gehan.safwat@msa.edu.eg',
          role: 'Dean',
          department: 'Faculty Leadership',
          attended: true,
        });
      }

      const selectedHat = hatId ? hats.find(h => h.id === Number(hatId)) : null;
      const selectedCommittee = committeeId ? committees.find(c => c.id === Number(committeeId)) : null;

      const finalPurpose = purposeCategory === 'custom' && customPurpose.trim() ? customPurpose.trim() : purposeCategory;

      const payload = {
        title: title.trim(),
        type: purposeCategory.includes('presidential') ? 'presidential_delegation' : 'departmental',
        purpose_category: finalPurpose,
        hat_id: selectedHat ? selectedHat.id : null,
        hat_name: selectedHat ? selectedHat.name : null,
        committee_id: selectedCommittee ? selectedCommittee.id : null,
        committee_name: selectedCommittee ? selectedCommittee.name : null,
        date: opt1Date, // initial placeholder
        location,
        chair: 'Prof. Dr. Gehan Safwat (Dean)',
        rapporteur: currentUser ? `${currentUser.title || ''} ${currentUser.full_name}`.trim() : '',
        objective: briefingNotes.trim() || `Official meeting requested with Dean Prof. Dr. Gehan Safwat regarding ${title.trim()}`,
        attendees,
        agenda: [
          `1. Opening statement & presentation by ${currentUser?.full_name || 'Requester'}`,
          `2. Dean review & institutional guidance`,
          `3. Agreed action items & directives`,
        ],
        minutes_body: '',
        decisions: [],
        action_items: [],
        time_options,
        is_dean_request: true,
        coordinator_id: coordinatorId,
        coordinator_name: staff.find(s => s.id === coordinatorId)?.full_name || "Dean's Executive Office",
        status: 'pending_dean_approval',
      };

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit meeting request');
      }

      const json = await res.json();
      onMeetingRequested(json.meeting);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error submitting meeting request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-inset)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>📅</span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Request Official Meeting with Prof. Dr. Gehan Safwat
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Propose 3 preferred time slot options for the Dean to review and confirm. Venue: <strong>Dean's Office</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--status-overdue-bg)', border: '1px solid var(--status-overdue-border)', color: 'var(--status-overdue)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Preset Location Banner */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'var(--status-revision-bg)',
              border: '1px solid var(--status-revision-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={18} color="var(--status-revision)" />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--status-revision)' }}>
                  Confirmed Meeting Venue:
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginLeft: '6px', fontWeight: 700 }}>
                  {location}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'var(--status-revision)', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              Fixed
            </span>
          </div>

          {/* Row 1: Title & Purpose Category */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Meeting Subject / Purpose *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Pre-Presidential Delegation Briefing or NAQAAE Curriculum Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 800, fontSize: '0.88rem' }}>Purpose Category *</label>
              <select
                className="form-select"
                value={purposeCategory}
                onChange={(e) => setPurposeCategory(e.target.value)}
                style={{ fontSize: '0.92rem', minHeight: '42px' }}
              >
                <optgroup label="👑 Presidential & Executive Leadership">
                  <option value="pre_presidential">🤝 Pre-Presidential Meeting Briefing (Internal Discussion before meeting President)</option>
                  <option value="post_presidential">🟣 Post-Presidential Follow-Up & Debrief (Directives after meeting President)</option>
                  <option value="presidential_strategic">🏛️ Higher Presidential Directive Execution & Strategic Mandates</option>
                </optgroup>
                <optgroup label="🏛️ Governance, Committees & Mandates">
                  <option value="committee">🏛️ Official Standing Committee Alignment & Decisions</option>
                  <option value="faculty_board">⚖️ Faculty Board Council Matters & Statutory Decrees</option>
                  <option value="hat_mandate">🎓 Faculty Hat Mandate & Semester Operational Plan</option>
                  <option value="departmental_affairs">👥 Departmental Coordination, Teaching Loads & Schedules</option>
                </optgroup>
                <optgroup label="📑 Accreditation & Academic Quality">
                  <option value="curriculum">📑 NAQAAE Accreditation, Quality & Module Specifications</option>
                  <option value="exams_moderation">📝 Exams Moderation, Control Unit & Grades Review</option>
                  <option value="student_appeals">⚖️ Student Complaints & Academic Appeals</option>
                  <option value="special_needs">♿ Special Needs Examination Accommodations</option>
                  <option value="international_validation">🌍 International Validation & University Partnerships</option>
                </optgroup>
                <optgroup label="🔬 Research, Labs & Clinical Units">
                  <option value="research_grants">🔬 Scientific Research, Grants & Publications Approval</option>
                  <option value="labs_purchasing">🧪 Laboratories, Equipment Purchasing & Maintenance</option>
                  <option value="clinics_animal_house">🏥 Hospital/Clinics, Infection Control & Animal House</option>
                  <option value="center_of_excellence">🌟 Center of Excellence & Entrepreneurship Hub</option>
                </optgroup>
                <optgroup label="🎓 Students & Academic Support">
                  <option value="academic_advising">📚 Academic Advising, Probation & Registration</option>
                  <option value="student_activities">🎨 Student Activities, Family Leaders & Awareness Campaigns</option>
                  <option value="postgraduate_affairs">🎓 Postgraduate Bylaws, Theses Defense & Database</option>
                  <option value="training_internships">💼 Student Training & Industrial Internships</option>
                </optgroup>
                <optgroup label="🚨 Urgent / Other Consultation">
                  <option value="emergency">🚨 Emergency / Urgent Dean Consultation</option>
                  <option value="general">💼 General Academic & Strategic Consultation</option>
                  <option value="custom">✍️ Custom Purpose (Type your own purpose below)...</option>
                </optgroup>
              </select>

              {/* Free-form typed purpose if Custom is selected */}
              {purposeCategory === 'custom' && (
                <div style={{ marginTop: '10px' }}>
                  <label className="form-label" style={{ fontWeight: 800, fontSize: '0.88rem' }}>
                    Type Your Custom Purpose *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Joint Biotechnology Conference Budget Allocation..."
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    required
                    style={{ fontSize: '0.92rem', minHeight: '42px' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Optional Links: Hat or Committee */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Link to Faculty Hat / Functional Unit (Optional)</label>
              <select
                className="form-select"
                value={hatId}
                onChange={(e) => setHatId(e.target.value)}
              >
                <option value="">-- None / General Faculty Subject --</option>
                {hats.map(h => (
                  <option key={h.id} value={h.id}>{h.icon} {h.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Link to Standing Committee (Optional)</label>
              <select
                className="form-select"
                value={committeeId}
                onChange={(e) => setCommitteeId(e.target.value)}
              >
                <option value="">-- None / Ad-hoc Meeting --</option>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Selectable Staff Coordinator */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
          }}>
            <label className="form-label" style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent-blue)', marginBottom: '4px' }}>
              👤 Designated Staff Coordinator Handling Schedule:
            </label>
            <select
              className="form-select"
              value={coordinatorId}
              onChange={(e) => setCoordinatorId(Number(e.target.value))}
              style={{ fontSize: '0.85rem' }}
            >
              <option value={14686}>Ms. Menna Hussein — Dean's Executive Office Coordinator (Recommended)</option>
              <option value={6591}>Prof. Dr. Amr Ageez — Vice Dean for Academic Affairs</option>
              {staff.filter(s => s.id !== 14686 && s.id !== 6591 && s.id !== 6496).slice(0, 15).map(s => (
                <option key={s.id} value={s.id}>
                  {s.title ? `${s.title} ` : ''}{s.full_name} ({s.department})
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              The selected coordinator will receive an email and system notification with your 3 proposed timings to approve or reject.
            </span>
          </div>

          {/* 3 PREFERRED TIME OPTIONS SECTION */}
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg-inset)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--accent-blue)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  3 Required Time Slot Options (Dean will approve exactly one)
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Choose 3 distinct preferences. You can select from Dean Prof. Dr. Gehan's configured active windows or customize them.
              </p>
            </div>

            {/* Option 1 */}
            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--status-revision-bg)', border: '1px solid var(--status-revision-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--status-revision)' }}>
                  Option 1 (1st Choice) *
                </span>
                {activeDeanSlots.length > 0 && (
                  <select
                    className="form-select"
                    style={{ fontSize: '0.78rem', width: 'auto', padding: '2px 8px', height: '28px' }}
                    value={opt1SlotId}
                    onChange={(e) => handleSlotSelect(1, e.target.value)}
                  >
                    <option value="">-- Quick Pick Dean's Slot --</option>
                    {activeDeanSlots.map(s => (
                      <option key={s.id} value={s.id}>{s.day_of_week}: {s.start_time} - {s.end_time}</option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Preferred Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={opt1Date}
                    onChange={(e) => setOpt1Date(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Time Window *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 10:00 AM - 11:30 AM"
                    value={opt1Time}
                    onChange={(e) => setOpt1Time(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Option 2 */}
            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--status-progress-bg)', border: '1px solid var(--status-progress-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--status-progress)' }}>
                  Option 2 (2nd Choice) *
                </span>
                {activeDeanSlots.length > 0 && (
                  <select
                    className="form-select"
                    style={{ fontSize: '0.78rem', width: 'auto', padding: '2px 8px', height: '28px' }}
                    value={opt2SlotId}
                    onChange={(e) => handleSlotSelect(2, e.target.value)}
                  >
                    <option value="">-- Quick Pick Dean's Slot --</option>
                    {activeDeanSlots.map(s => (
                      <option key={s.id} value={s.id}>{s.day_of_week}: {s.start_time} - {s.end_time}</option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Preferred Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={opt2Date}
                    onChange={(e) => setOpt2Date(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Time Window *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 01:00 PM - 02:30 PM"
                    value={opt2Time}
                    onChange={(e) => setOpt2Time(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Option 3 */}
            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'var(--status-done-bg)', border: '1px solid var(--status-done-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--status-done)' }}>
                  Option 3 (3rd Choice) *
                </span>
                {activeDeanSlots.length > 0 && (
                  <select
                    className="form-select"
                    style={{ fontSize: '0.78rem', width: 'auto', padding: '2px 8px', height: '28px' }}
                    value={opt3SlotId}
                    onChange={(e) => handleSlotSelect(3, e.target.value)}
                  >
                    <option value="">-- Quick Pick Dean's Slot --</option>
                    {activeDeanSlots.map(s => (
                      <option key={s.id} value={s.id}>{s.day_of_week}: {s.start_time} - {s.end_time}</option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Preferred Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={opt3Date}
                    onChange={(e) => setOpt3Date(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Time Window *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 11:00 AM - 01:00 PM"
                    value={opt3Time}
                    onChange={(e) => setOpt3Time(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attendees Selection */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Users size={16} color="var(--accent-blue)" />
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                Delegation / Participating Team Members ({selectedStaffIds.length} Selected)
              </label>
            </div>
            <div
              style={{
                maxHeight: '140px',
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
                backgroundColor: 'var(--bg-inset)',
              }}
            >
              {staff.map(member => {
                const isSelected = selectedStaffIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleStaff(member.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      background: isSelected ? 'var(--status-revision-bg)' : 'transparent',
                      border: isSelected ? '1px solid var(--status-revision-border)' : '1px solid transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ color: isSelected ? 'var(--status-revision)' : 'var(--text-main)', fontWeight: isSelected ? 700 : 500 }}>
                      {member.title ? member.title + ' ' : ''}{member.full_name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Objective & Briefing Notes */}
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
              Meeting Objective & Briefing Notes for Dean Prof. Dr. Gehan
            </label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="State key points, topics to resolve, or presidential delegation matters to align on..."
              value={briefingNotes}
              onChange={(e) => setBriefingNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Submit */}
          <div
            style={{
              padding: '16px 0 0 0',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                borderColor: '#7c3aed',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
              }}
            >
              <Send size={16} />
              <span>{loading ? 'Submitting Request...' : 'Send Request with 3 Options'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
