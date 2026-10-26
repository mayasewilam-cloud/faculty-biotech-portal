'use client';

import React, { useState, useEffect } from 'react';
import { Meeting, MeetingActionItem, User } from '@/types';
import {
  Users,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Award,
  Plus,
  Trash2,
  Save,
  MessageSquare,
} from 'lucide-react';

interface DeanBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  staffList: User[];
  currentUser: User | null;
  onSaveBriefing: (meetingId: number, briefingData: any) => Promise<void>;
}

export const DeanBriefingModal: React.FC<DeanBriefingModalProps> = ({
  isOpen,
  onClose,
  meeting,
  staffList,
  currentUser,
  onSaveBriefing,
}) => {
  const [isRequired, setIsRequired] = useState(true);
  const [phase, setPhase] = useState<'before' | 'after' | 'both'>('before');
  const [status, setStatus] = useState<'scheduled' | 'completed' | 'not_required'>('scheduled');
  const [briefingDate, setBriefingDate] = useState('');
  const [location, setLocation] = useState("Dean's Executive Office (Building A, Room 301)");
  const [minutes, setMinutes] = useState('');
  const [decisions, setDecisions] = useState<string[]>(['']);
  const [actionItems, setActionItems] = useState<
    Array<{
      id: string;
      title: string;
      assigned_to_id: number;
      assigned_to_name: string;
      department: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      deadline: string;
      status: 'pending' | 'converted' | 'completed';
    }>
  >([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meeting) {
      const existing = meeting.dean_briefing;
      if (existing) {
        setIsRequired(existing.required ?? true);
        setPhase(existing.phase === 'after' || existing.phase === 'both' ? existing.phase : 'before');
        setStatus(existing.status === 'completed' ? 'completed' : existing.status === 'not_required' ? 'not_required' : 'scheduled');
        setBriefingDate(existing.briefing_date || (meeting.date ? meeting.date.split('T')[0] : new Date().toISOString().split('T')[0]));
        setLocation(existing.location || "Dean's Executive Office (Building A, Room 301)");
        setMinutes(existing.minutes || '');
        setDecisions(existing.decisions && existing.decisions.length > 0 ? existing.decisions : ['']);
        setActionItems(existing.action_items || []);
      } else {
        setIsRequired(true);
        setPhase('before');
        setStatus('scheduled');
        setBriefingDate(meeting.date ? meeting.date.split('T')[0] : new Date().toISOString().split('T')[0]);
        setLocation("Dean's Executive Office (Building A, Room 301)");
        setMinutes('');
        setDecisions(['']);
        setActionItems([]);
      }
    }
  }, [meeting, isOpen]);

  if (!isOpen || !meeting) return null;

  const handleAddDecision = () => setDecisions((prev) => [...prev, '']);
  const handleRemoveDecision = (idx: number) => setDecisions((prev) => prev.filter((_, i) => i !== idx));
  const handleDecisionChange = (idx: number, val: string) => {
    setDecisions((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleAddActionItem = () => {
    const defaultStaff = staffList.find((s) => s.id === 6496) || staffList[0];
    setActionItems((prev) => [
      ...prev,
      {
        id: `DBA-${Date.now()}-${prev.length + 1}`,
        title: '',
        assigned_to_id: defaultStaff?.id || 6496,
        assigned_to_name: defaultStaff?.full_name || 'Prof. Dr. Gehan Safwat',
        department: defaultStaff?.department || 'Academic Staff',
        priority: 'high',
        deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        status: 'pending',
      },
    ]);
  };

  const handleRemoveActionItem = (idx: number) => {
    setActionItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleActionItemChange = (idx: number, field: string, val: any) => {
    setActionItems((prev) => {
      const copy = [...prev];
      if (field === 'assigned_to_id') {
        const found = staffList.find((s) => s.id === Number(val));
        copy[idx] = {
          ...copy[idx],
          assigned_to_id: Number(val),
          assigned_to_name: found?.full_name || 'Assigned Staff',
          department: found?.department || copy[idx].department,
        };
      } else {
        copy[idx] = { ...copy[idx], [field]: val };
      }
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const briefingData = {
        required: isRequired,
        phase: isRequired ? phase : 'none',
        status: !isRequired ? 'not_required' : status,
        briefing_date: isRequired ? briefingDate : undefined,
        location: isRequired ? location : undefined,
        minutes: isRequired ? minutes : undefined,
        decisions: isRequired ? decisions.filter((d) => d.trim().length > 0) : [],
        action_items: isRequired ? actionItems.filter((ai) => ai.title.trim().length > 0) : [],
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      };

      await onSaveBriefing(meeting.id, briefingData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save Dean briefing details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          maxWidth: '780px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-blue)', fontWeight: 800 }}>
                Presidential Delegation Executive Alignment
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-main)' }}>
                Briefing with Dean Prof. Dr. Gehan Safwat
              </h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', fontWeight: 500 }}>
                Meeting with President: &ldquo;{meeting.title}&rdquo; &bull; {new Date(meeting.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '6px 10px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px', background: 'var(--status-overdue-bg)', border: '1px solid var(--status-overdue-border)', borderRadius: '8px', color: 'var(--status-overdue)', fontSize: '0.85rem', fontWeight: 700 }}>
              {error}
            </div>
          )}

          {/* Requirement Selection */}
          <div style={{ padding: '16px', background: 'var(--bg-inset)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <label className="form-label" style={{ marginBottom: '10px', display: 'block', fontSize: '0.9rem', fontWeight: 800 }}>
              Is a strategic briefing session with Dean Prof. Dr. Gehan Safwat required for this presidential delegation?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isRequired && phase === 'before' ? '2px solid var(--accent-blue)' : '1px solid var(--border)',
                  background: isRequired && phase === 'before' ? 'var(--status-progress-bg)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                }}
              >
                <input
                  type="radio"
                  name="briefingRequirement"
                  checked={isRequired && phase === 'before'}
                  onChange={() => {
                    setIsRequired(true);
                    setPhase('before');
                  }}
                />
                <span>Pre-Meeting Briefing (Before President)</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isRequired && phase === 'after' ? '2px solid var(--accent-blue)' : '1px solid var(--border)',
                  background: isRequired && phase === 'after' ? 'var(--status-progress-bg)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                }}
              >
                <input
                  type="radio"
                  name="briefingRequirement"
                  checked={isRequired && phase === 'after'}
                  onChange={() => {
                    setIsRequired(true);
                    setPhase('after');
                  }}
                />
                <span>Post-Meeting Debriefing (After President)</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isRequired && phase === 'both' ? '2px solid var(--accent-blue)' : '1px solid var(--border)',
                  background: isRequired && phase === 'both' ? 'var(--status-progress-bg)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                }}
              >
                <input
                  type="radio"
                  name="briefingRequirement"
                  checked={isRequired && phase === 'both'}
                  onChange={() => {
                    setIsRequired(true);
                    setPhase('both');
                  }}
                />
                <span>Both Pre & Post Briefings</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: !isRequired ? '2px solid var(--border)' : '1px solid var(--border)',
                  background: !isRequired ? 'var(--bg-inset)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                }}
              >
                <input
                  type="radio"
                  name="briefingRequirement"
                  checked={!isRequired}
                  onChange={() => {
                    setIsRequired(false);
                    setStatus('not_required');
                  }}
                />
                <span>Not Required</span>
              </label>
            </div>
          </div>

          {isRequired && (
            <>
              {/* Session Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Briefing Session Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={briefingDate}
                    onChange={(e) => setBriefingDate(e.target.value)}
                    required={isRequired}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Venue / Meeting Room</label>
                  <input
                    type="text"
                    className="form-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Dean's Executive Office (Room 301)"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Briefing Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="scheduled">📅 Scheduled / Upcoming</option>
                    <option value="completed">✅ Briefing Completed & Minutes Signed</option>
                  </select>
                </div>
              </div>

              {/* Narrative Minutes of Meeting with Dean Gehan */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Minutes of Meeting with Dean Prof. Dr. Gehan Safwat *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600 }}>
                    {phase === 'before'
                      ? 'Pre-Meeting Alignment Directives'
                      : phase === 'after'
                      ? 'Post-Meeting Debriefing & President Feedback'
                      : 'Comprehensive Briefing Notes'}
                  </span>
                </div>
                <textarea
                  className="form-textarea"
                  rows={5}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="Record full executive minutes of the discussion with Dean Prof. Dr. Gehan Safwat (e.g. presentation guidance, policy stances, student data review, and presidential talking points)..."
                  style={{ fontSize: '0.875rem', lineHeight: 1.6 }}
                />
              </div>

              {/* Key Directives & Decisions */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Dean Gehan Directives & Key Decisions
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddDecision}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px' }}
                  >
                    <Plus size={12} />
                    <span>Add Directive</span>
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {decisions.map((dec, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', width: '20px' }}>
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        className="form-input"
                        value={dec}
                        onChange={(e) => handleDecisionChange(idx, e.target.value)}
                        placeholder="e.g. Dean instructed team to emphasize accreditation milestone benchmarks in Section 3..."
                        style={{ fontSize: '0.85rem' }}
                      />
                      {decisions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDecision(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items for Delegation */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Action Items Dispatched by Dean Gehan
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddActionItem}
                    style={{ fontSize: '0.75rem', padding: '4px 8px', gap: '4px' }}
                  >
                    <Plus size={12} />
                    <span>Add Action Item</span>
                  </button>
                </div>

                {actionItems.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                    No separate action items created yet. Click &ldquo;Add Action Item&rdquo; to assign preparatory deliverables to faculty members.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {actionItems.map((ai, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={ai.title}
                            onChange={(e) => handleActionItemChange(idx, 'title', e.target.value)}
                            placeholder="Action Item title (e.g. Finalize executive slide deck on lab sequencing gear)..."
                            style={{ flex: 1, marginRight: '8px', fontSize: '0.85rem' }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveActionItem(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assigned Faculty</span>
                            <select
                              className="form-select"
                              value={ai.assigned_to_id}
                              onChange={(e) => handleActionItemChange(idx, 'assigned_to_id', e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                            >
                              {staffList.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.title || ''} {s.full_name} ({s.department})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deadline</span>
                            <input
                              type="date"
                              className="form-input"
                              value={ai.deadline}
                              onChange={(e) => handleActionItemChange(idx, 'deadline', e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Dean Briefing & Minutes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
