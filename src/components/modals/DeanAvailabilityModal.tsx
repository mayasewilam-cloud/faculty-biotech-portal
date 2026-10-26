'use client';

import React, { useState } from 'react';
import { DeanAvailabilitySlot } from '@/types';
import { X, Plus, Trash2, Clock, MapPin, CheckCircle2, AlertCircle, Save } from 'lucide-react';

interface DeanAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: DeanAvailabilitySlot[];
  onSaveSlots: (slots: DeanAvailabilitySlot[]) => Promise<void>;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'];

export const DeanAvailabilityModal: React.FC<DeanAvailabilityModalProps> = ({
  isOpen,
  onClose,
  slots,
  onSaveSlots,
}) => {
  const [localSlots, setLocalSlots] = useState<DeanAvailabilitySlot[]>(slots);
  const [newDay, setNewDay] = useState('Monday');
  const [newStartTime, setNewStartTime] = useState('10:00 AM');
  const [newEndTime, setNewEndTime] = useState('11:30 AM');
  const [newLocation, setNewLocation] = useState("Dean's Office (Building A, Room 301)");
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setLocalSlots(slots);
  }, [slots, isOpen]);

  if (!isOpen) return null;

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStartTime.trim() || !newEndTime.trim()) {
      setError('Start time and end time are required.');
      return;
    }

    const created: DeanAvailabilitySlot = {
      id: `slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      day_of_week: newDay,
      start_time: newStartTime.trim(),
      end_time: newEndTime.trim(),
      location: newLocation.trim() || "Dean's Office (Building A, Room 301)",
      note: newNote.trim() || undefined,
      is_active: true,
    };

    setLocalSlots(prev => [...prev, created]);
    setNewNote('');
    setError(null);
    setSuccessMsg('Added new slot option. Click "Save All Changes" below to commit.');
  };

  const handleToggleSlot = (id: string) => {
    setLocalSlots(prev => prev.map(s => s.id === id ? { ...s, is_active: !s.is_active } : s));
  };

  const handleDeleteSlot = (id: string) => {
    setLocalSlots(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      await onSaveSlots(localSlots);
      setSuccessMsg('Dean availability settings saved successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save availability settings');
    } finally {
      setSaving(false);
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
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '16px',
          overflow: 'hidden',
          color: 'var(--text-main)',
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
            <span style={{ fontSize: '1.6rem' }}>⚙️</span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Dean Availability Settings
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', fontWeight: 500 }}>
                Configure selectable meeting windows for faculty members & presidential delegations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'var(--bg-inset)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--status-overdue-bg)', border: '1px solid var(--status-overdue-border)', color: 'var(--status-overdue)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--status-done-bg)', border: '1px solid var(--status-done-border)', color: 'var(--status-done)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Slots List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                Active Availability Options ({localSlots.filter(s => s.is_active).length} Active)
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Faculty members will choose 3 from these options
              </span>
            </div>

            {localSlots.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-inset)', borderRadius: '10px', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No availability slots configured yet. Add your first slot below.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {localSlots.map((slot, index) => (
                  <div
                    key={slot.id || index}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      background: slot.is_active ? 'var(--status-progress-bg)' : 'var(--bg-inset)',
                      border: `1.5px solid ${slot.is_active ? 'var(--status-progress-border)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: slot.is_active ? 'var(--accent-blue)' : 'var(--text-muted)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          flexShrink: 0,
                        }}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            {slot.day_of_week}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                            <Clock size={13} />
                            {slot.start_time} – {slot.end_time}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} />
                            {slot.location}
                          </span>
                          {slot.note && <span>• {slot.note}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleSlot(slot.id)}
                        className={`btn btn-sm ${slot.is_active ? 'btn-secondary' : 'btn-outline'}`}
                        style={{ fontSize: '0.8rem', padding: '5px 12px', fontWeight: 700 }}
                      >
                        {slot.is_active ? 'Active' : 'Disabled'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--status-overdue)',
                          cursor: 'pointer',
                          padding: '6px',
                        }}
                        title="Delete Slot"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Slot Form */}
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              background: 'var(--bg-inset)',
              border: '1px solid var(--border)',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '14px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} color="var(--accent-blue)" />
              <span>Add New Available Time Window</span>
            </h4>

            <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Day of the Week *</label>
                  <select
                    className="form-select"
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Start Time *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 10:00 AM"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>End Time *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 11:30 AM"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Venue / Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Category / Context (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Presidential delegations, NAQAAE briefings"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="submit"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                >
                  <Plus size={15} />
                  <span>Add Slot Option</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAll}
            disabled={saving}
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
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
