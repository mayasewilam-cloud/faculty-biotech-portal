'use client';

import React, { useState } from 'react';
import { Hat, Meeting, Task, User } from '@/types';
import { INSTITUTIONAL_PILLARS } from '@/lib/pillar_catalog';
import { generateDynamicAgenda } from '@/lib/agendaGenerator';
import { X, Plus, Trash2, Calendar, MapPin, UserCheck, Shield, FileText, Zap, Award, Layers, Sparkles, Repeat } from 'lucide-react';

interface NewMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  hats: Hat[];
  staff: Array<{ id: number; full_name: string; title: string; department: string; email: string }>;
  onCreated: (newMeeting: Meeting, recurringSeries?: Meeting[]) => void;
  onUpdated?: (updatedMeeting: Meeting) => void;
  editingMeeting?: Meeting | null;
  meetings?: Meeting[];
  tasks?: Task[];
}

interface NewActionItemState {
  id?: string;
  title: string;
  assigned_to_id: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deadline: string;
  pillar_code: string;
}

export const NewMeetingModal: React.FC<NewMeetingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  hats,
  staff,
  onCreated,
  onUpdated,
  editingMeeting,
  meetings = [],
  tasks = [],
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'pre_presidential' | 'post_presidential' | 'presidential_delegation' | 'faculty_board' | 'committee' | 'departmental' | 'external'>('committee');
  const [hatId, setHatId] = useState<string>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('Presidential Boardroom (Building A)');
  const [chair, setChair] = useState('University President');
  const [rapporteur, setRapporteur] = useState(currentUser?.full_name ? `${currentUser.title || ''} ${currentUser.full_name}`.trim() : 'Prof. Dr. Gehan Safwat');
  const [objective, setObjective] = useState('');
  const [recurrencePattern, setRecurrencePattern] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('none');
  const [repeatCount, setRepeatCount] = useState<number>(4);
  
  // Attendees
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>(() => {
    return currentUser ? [currentUser.id] : [6496];
  });

  // Agenda
  const [agendaList, setAgendaList] = useState<string[]>(['']);
  
  // Narrative Minutes
  const [minutesBody, setMinutesBody] = useState('');

  // Decisions
  const [decisionsList, setDecisionsList] = useState<string[]>(['']);

  // Action Items
  const [actionItems, setActionItems] = useState<NewActionItemState[]>([
    {
      title: '',
      assigned_to_id: staff[0]?.id || 6496,
      priority: 'high',
      deadline: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      pillar_code: 'A',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (editingMeeting) {
      setTitle(editingMeeting.title || '');
      setType((editingMeeting.type as any) || 'committee');
      setHatId(editingMeeting.hat_id ? String(editingMeeting.hat_id) : '');
      setDate(editingMeeting.date ? editingMeeting.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setLocation(editingMeeting.location || 'Presidential Boardroom (Building A)');
      setChair(editingMeeting.chair || 'University President');
      setRapporteur(editingMeeting.rapporteur || '');
      setObjective(editingMeeting.objective || '');
      setSelectedStaffIds(
        editingMeeting.attendees
          ? editingMeeting.attendees.map(a => a.user_id).filter((id): id is number => typeof id === 'number')
          : (currentUser ? [currentUser.id] : [6496])
      );
      setAgendaList(editingMeeting.agenda && editingMeeting.agenda.length > 0 ? editingMeeting.agenda : ['']);
      setMinutesBody(editingMeeting.minutes_body || '');
      setDecisionsList(editingMeeting.decisions && editingMeeting.decisions.length > 0 ? editingMeeting.decisions : ['']);
      if (editingMeeting.action_items && editingMeeting.action_items.length > 0) {
        setActionItems(editingMeeting.action_items.map(ai => ({
          id: ai.id,
          title: ai.title,
          assigned_to_id: ai.assigned_to_id,
          priority: ai.priority as any || 'high',
          deadline: ai.deadline ? ai.deadline.split('T')[0] : new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          pillar_code: ai.pillar_code || 'A',
        })));
      } else {
        setActionItems([{
          title: '',
          assigned_to_id: staff[0]?.id || 6496,
          priority: 'high',
          deadline: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          pillar_code: 'A',
        }]);
      }
    } else {
      setTitle('');
      setType('committee');
      setHatId('');
      setDate(new Date().toISOString().split('T')[0]);
      setLocation('Presidential Boardroom (Building A)');
      setChair('University President');
      setRapporteur(currentUser?.full_name ? `${currentUser.title || ''} ${currentUser.full_name}`.trim() : 'Prof. Dr. Gehan Safwat');
      setObjective('');
      setSelectedStaffIds(currentUser ? [currentUser.id] : [6496]);
      setAgendaList(['']);
      setMinutesBody('');
      setDecisionsList(['']);
      setActionItems([{
        title: '',
        assigned_to_id: staff[0]?.id || 6496,
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        pillar_code: 'A',
      }]);
    }
  }, [editingMeeting, isOpen, currentUser, staff]);

  if (!isOpen) return null;

  const handleToggleAttendee = (id: number) => {
    setSelectedStaffIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddAgenda = () => setAgendaList(prev => [...prev, '']);
  const handleRemoveAgenda = (idx: number) => setAgendaList(prev => prev.filter((_, i) => i !== idx));
  const handleUpdateAgenda = (idx: number, val: string) => {
    setAgendaList(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleAddDecision = () => setDecisionsList(prev => [...prev, '']);
  const handleRemoveDecision = (idx: number) => setDecisionsList(prev => prev.filter((_, i) => i !== idx));
  const handleUpdateDecision = (idx: number, val: string) => {
    setDecisionsList(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleAddActionItem = () => {
    setActionItems(prev => [
      ...prev,
      {
        title: '',
        assigned_to_id: staff[0]?.id || 6496,
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        pillar_code: 'A',
      },
    ]);
  };
  const handleRemoveActionItem = (idx: number) => setActionItems(prev => prev.filter((_, i) => i !== idx));
  const handleUpdateActionItem = (idx: number, field: keyof NewActionItemState, val: any) => {
    setActionItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Meeting title is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build attendees list
      const attendees = selectedStaffIds.map(id => {
        const u = staff.find(s => s.id === id);
        return {
          user_id: id,
          name: u ? `${u.title ? u.title + ' ' : ''}${u.full_name}` : `Staff #${id}`,
          email: u?.email || '',
          role: id === 6496 ? 'Dean & Delegation Lead' : id === 6591 ? 'Vice Dean' : 'Delegation Member',
          department: u?.department || 'Academic Staff',
          attended: true,
        };
      });

      // Selected hat
      const selectedHat = hatId ? hats.find(h => h.id === Number(hatId)) : null;

      // Filtered agenda and decisions
      const cleanAgenda = agendaList.map(a => a.trim()).filter(Boolean);
      const cleanDecisions = decisionsList.map(d => d.trim()).filter(Boolean);

      // Clean action items
      const cleanActionItems = actionItems
        .filter(ai => ai.title.trim().length > 0)
        .map((ai, index) => {
          const assignee = staff.find(s => s.id === Number(ai.assigned_to_id));
          const pillar = INSTITUTIONAL_PILLARS.find(p => p.code === ai.pillar_code);
          return {
            id: `AI-NEW-${Date.now()}-${index}`,
            meeting_id: 0,
            title: ai.title.trim(),
            assigned_to_id: Number(ai.assigned_to_id),
            assigned_to_name: assignee ? `${assignee.title || ''} ${assignee.full_name}`.trim() : 'Staff Member',
            department: assignee?.department || 'Academic Staff',
            priority: ai.priority,
            deadline: new Date(ai.deadline).toISOString(),
            pillar_code: ai.pillar_code,
            pillar_name: pillar?.name || '',
            status: 'pending' as const,
          };
        });

      const payload = {
        title: title.trim(),
        type,
        hat_id: selectedHat ? selectedHat.id : null,
        hat_name: selectedHat ? selectedHat.name : null,
        date: new Date(date).toISOString(),
        location: location.trim(),
        chair: chair.trim(),
        rapporteur: rapporteur.trim(),
        objective: objective.trim(),
        attendees,
        agenda: cleanAgenda,
        minutes_body: minutesBody.trim(),
        decisions: cleanDecisions,
        action_items: cleanActionItems,
        status: cleanActionItems.length > 0 ? 'action_items_pending' : 'approved',
        recurrence: recurrencePattern !== 'none' ? {
          pattern: recurrencePattern,
          interval: recurrencePattern === 'biweekly' ? 2 : 1,
          repeat_count: Number(repeatCount),
        } : undefined,
      };

      if (editingMeeting) {
        const res = await fetch('/api/meetings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meeting_id: editingMeeting.id,
            ...payload,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to update meeting');
        }

        const json = await res.json();
        if (onUpdated) {
          onUpdated(json.meeting);
        } else {
          onCreated(json.meeting);
        }
      } else {
        const res = await fetch('/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to record meeting');
        }

        const json = await res.json();
        onCreated(json.meeting, json.recurring_series || []);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error processing meeting');
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
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          color: 'var(--text-main)',
        }}
        onClick={(e) => e.stopPropagation()}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>📝</span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {editingMeeting ? 'Edit Delegation / Executive Meeting Record' : 'Record Official Session & Minutes of Meeting (MoM)'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                {editingMeeting ? 'Update meeting minutes, attendance, decisions, or action items.' : 'Log high-level presidential delegations, faculty board decisions, and dispatch actionable directives.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Row 1: Session Type & Linked Hat */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Session Classification *</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setType(val);
                  if (val === 'pre_presidential') {
                    setLocation("Dean's Office / Faculty Board Room");
                    setChair('Prof. Dr. Gehan Safwat (Dean)');
                  } else if (val === 'post_presidential') {
                    setLocation("Dean's Office / Faculty Board Room");
                    setChair('Prof. Dr. Gehan Safwat (Dean)');
                  } else if (val === 'presidential_delegation') {
                    setLocation("President's Office (Administration Building A)");
                    setChair('University President');
                  } else if (val === 'faculty_board') {
                    setLocation('Faculty Council Chamber (Floor 3)');
                    setChair('Prof. Dr. Gehan Safwat (Dean)');
                  }
                }}
              >
                <option value="pre_presidential">🔵 Pre-Presidential: Internal Preparation Session</option>
                <option value="post_presidential">🟣 Post-Presidential: Follow-Up & Debrief Session</option>
                <option value="presidential_delegation">🤝 Presidential Council Delegation</option>
                <option value="faculty_board">🏛️ Faculty Board & Executive Council</option>
                <option value="committee">🎩 Committee / Hat Session</option>
                <option value="departmental">👥 Departmental Coordination</option>
                <option value="external">🌐 External Delegation / Partner</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Linked Faculty Hat / Committee (Optional)</label>
              <select
                className="form-select"
                value={hatId}
                onChange={(e) => setHatId(e.target.value)}
              >
                <option value="">None (Independent Executive Session)</option>
                {hats.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.icon || '🎩'} {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Meeting Title / Formal Subject *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Presidential Council - Biotechnology Delegation on Strategic Expansion"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Row 3: Date, Location, Chair, Rapporteur */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Session Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Venue / Location</label>
              <input
                type="text"
                className="form-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Chairperson</label>
              <input
                type="text"
                className="form-input"
                value={chair}
                onChange={(e) => setChair(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Rapporteur / Secretary</label>
              <input
                type="text"
                className="form-input"
                value={rapporteur}
                onChange={(e) => setRapporteur(e.target.value)}
              />
            </div>
          </div>

          {/* Objective */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Session Mandate & Strategic Objective</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Summary of why the meeting was called and primary outcomes sought..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>

          {/* Row: Meeting Recurrence Cadence */}
          {!editingMeeting && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'grid',
                gridTemplateColumns: recurrencePattern !== 'none' ? '1fr 1fr' : '1fr',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, marginBottom: '4px' }}>
                  <Repeat size={14} className="text-blue-400" />
                  Recurrence Schedule
                </label>
                <select
                  className="form-select"
                  style={{ height: '34px', fontSize: '0.8rem' }}
                  value={recurrencePattern}
                  onChange={(e) => setRecurrencePattern(e.target.value as any)}
                >
                  <option value="none">One-Time Session (No Recurrence)</option>
                  <option value="weekly">Weekly Cadence (Every 7 Days)</option>
                  <option value="biweekly">Bi-Weekly Cadence (Every 14 Days)</option>
                  <option value="monthly">Monthly Cadence (Every 30 Days)</option>
                </select>
              </div>

              {recurrencePattern !== 'none' && (
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', margin: 0, marginBottom: '4px' }}>
                    Occurrences To Schedule
                  </label>
                  <select
                    className="form-select"
                    style={{ height: '34px', fontSize: '0.8rem' }}
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(Number(e.target.value))}
                  >
                    <option value={2}>2 Recurring Sessions</option>
                    <option value={4}>4 Recurring Sessions (~1 Month / Semester)</option>
                    <option value={6}>6 Recurring Sessions</option>
                    <option value={8}>8 Recurring Sessions</option>
                    <option value={12}>12 Recurring Sessions (Full Academic Term)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Delegation & Attendees Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>
                Delegation Attendees ({selectedStaffIds.length} Selected)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Click to add/remove faculty members
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                maxHeight: '130px',
                overflowY: 'auto',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {staff.slice(0, 25).map(s => {
                const selected = selectedStaffIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleAttendee(s.id)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: selected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: selected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      color: selected ? '#93c5fd' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>{selected ? '✓' : '+'}</span>
                    <span>{s.title ? `${s.title} ` : ''}{s.full_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Builder */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>
                Agenda Items
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const selectedHat = hatId ? hats.find(h => h.id === Number(hatId)) : null;
                    const dynamic = generateDynamicAgenda({
                      type,
                      title: title || 'Executive Proceeding',
                      hatId: selectedHat ? selectedHat.id : null,
                      hatName: selectedHat ? selectedHat.name : null,
                      previousMeetings: meetings || [],
                      tasks: tasks || [],
                    });
                    setAgendaList(dynamic);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.725rem',
                    padding: '3px 9px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  }}
                >
                  <Sparkles size={13} />
                  Auto-Generate Dynamic Agenda
                </button>
                <button
                  type="button"
                  onClick={handleAddAgenda}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.725rem', padding: '3px 8px' }}
                >
                  + Add Item
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {agendaList.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '20px' }}>#{idx + 1}</span>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, height: '34px', fontSize: '0.825rem' }}
                    placeholder={`Agenda topic #${idx + 1}...`}
                    value={item}
                    onChange={(e) => handleUpdateAgenda(idx, e.target.value)}
                  />
                  {agendaList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAgenda(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Deliberations & Narrative Minutes */}
          <div>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
              Narrative Minutes & Deliberations (MoM)
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Record the official discussion points, presentations, and deliberations during the session..."
              value={minutesBody}
              onChange={(e) => setMinutesBody(e.target.value)}
            />
          </div>

          {/* Decisions Builder */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', margin: 0 }}>
                Official Resolutions & Decisions Taken
              </label>
              <button
                type="button"
                onClick={handleAddDecision}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.725rem', padding: '3px 8px' }}
              >
                + Add Decision
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {decisionsList.map((dec, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#eab308' }}>⚖️</span>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, height: '34px', fontSize: '0.825rem' }}
                    placeholder={`Decision #${idx + 1}...`}
                    value={dec}
                    onChange={(e) => handleUpdateDecision(idx, e.target.value)}
                  />
                  {decisionsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDecision(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Items Builder */}
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} color="#ec4899" />
                <label className="form-label" style={{ fontWeight: 800, fontSize: '0.825rem', color: '#f472b6', margin: 0 }}>
                  Mandated Action Items (Directly Convertible to Tasks)
                </label>
              </div>
              <button
                type="button"
                onClick={handleAddActionItem}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.725rem', padding: '3px 8px' }}
              >
                + Add Action Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {actionItems.map((ai, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-inset)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, height: '34px', fontSize: '0.825rem' }}
                      placeholder="Action item task title..."
                      value={ai.title}
                      onChange={(e) => handleUpdateActionItem(idx, 'title', e.target.value)}
                    />
                    {actionItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveActionItem(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assigned Staff</label>
                      <select
                        className="form-select"
                        style={{ height: '32px', fontSize: '0.775rem' }}
                        value={ai.assigned_to_id}
                        onChange={(e) => handleUpdateActionItem(idx, 'assigned_to_id', Number(e.target.value))}
                      >
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.title ? `${s.title} ` : ''}{s.full_name} ({s.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>12 Pillars Category</label>
                      <select
                        className="form-select"
                        style={{ height: '32px', fontSize: '0.775rem' }}
                        value={ai.pillar_code}
                        onChange={(e) => handleUpdateActionItem(idx, 'pillar_code', e.target.value)}
                      >
                        {INSTITUTIONAL_PILLARS.map(p => (
                          <option key={p.code} value={p.code}>
                            {p.icon} Pillar {p.code}: {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Priority</label>
                      <select
                        className="form-select"
                        style={{ height: '32px', fontSize: '0.775rem' }}
                        value={ai.priority}
                        onChange={(e) => handleUpdateActionItem(idx, 'priority', e.target.value as any)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deadline</label>
                      <input
                        type="date"
                        className="form-input"
                        style={{ height: '32px', fontSize: '0.775rem' }}
                        value={ai.deadline}
                        onChange={(e) => handleUpdateActionItem(idx, 'deadline', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderColor: '#6366f1',
                padding: '10px 24px',
                fontWeight: 700,
              }}
            >
              {loading ? (editingMeeting ? 'Saving Changes...' : 'Submitting MoM...') : (editingMeeting ? 'Save Meeting Changes' : 'Record & Publish MoM')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
