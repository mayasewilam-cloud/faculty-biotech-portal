'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { PublicStaffMember } from '@/lib/public_staff';
import {
  X,
  Lock,
  Link as LinkIcon,
  UploadCloud,
  FileText,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  Search,
  Check,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface CreateSubmissionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  staffList: any[];
  onCreated: () => void;
}

export const CreateSubmissionRequestModal: React.FC<CreateSubmissionRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  staffList,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submissionType, setSubmissionType] = useState<'external_link' | 'file_upload' | 'form_fill'>('file_upload');
  const [formLink, setFormLink] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [dueTime, setDueTime] = useState('1:00 PM');
  const [priority, setPriority] = useState<'urgent' | 'medium' | 'high' | 'low'>('medium');
  const [commentType, setCommentType] = useState('Comment');
  const [isConfidential, setIsConfidential] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Quick staff helpers
  const handleToggleStaff = (id: number) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectRole = (category: string) => {
    const matching = staffList.filter((s) => {
      const cat = (s.category || '').toLowerCase();
      const rank = (s.rank || '').toLowerCase();
      const role = (s.role || '').toLowerCase();
      if (category === 'ta') return cat === 'ta' || rank.includes('teaching assistant');
      if (category === 'la') return cat === 'la' || rank.includes('assistant lecturer');
      if (category === 'professor') return cat === 'professors' || role === 'professor' || rank.includes('prof');
      if (category === 'admin') return cat === 'administration' || role === 'staff';
      return false;
    }).map((s) => s.id);

    const merged = Array.from(new Set([...selectedStaffIds, ...matching]));
    setSelectedStaffIds(merged);
  };

  const handleSelectAll = () => {
    setSelectedStaffIds(staffList.map((s) => s.id));
  };

  const handleClearAll = () => {
    setSelectedStaffIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for the request.');
      return;
    }
    if (selectedStaffIds.length === 0) {
      setError('Please select at least one faculty member who should fill/submit this request.');
      return;
    }
    if (!deadlineDate) {
      setError('Please set a deadline date.');
      return;
    }
    if (submissionType === 'external_link' && !formLink.trim()) {
      setError('Please provide the external form or tracker URL (e.g. Google Sheets, Google Form).');
      return;
    }

    try {
      setIsSubmitting(true);

      const deadlineIso = new Date(`${deadlineDate}T13:00:00`).toISOString();

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || `Please submit your response or upload the requested file by the deadline.`,
          assigned_to_ids: selectedStaffIds,
          priority,
          deadline: deadlineIso,
          start_date: startDate,
          due_time: dueTime,
          comment_type: commentType,
          submission_type: submissionType,
          form_link: formLink.trim() || null,
          is_confidential: isConfidential ? 1 : 0,
          is_submission_request: true,
          received_by: currentUser?.full_name || 'Leadership Office',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to dispatch request');
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.ar_name && s.ar_name.includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.rank && s.rank.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                Direct Action Request
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={11} />
                Strict Privacy Guard
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Create Form / File Submission Request
            </h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '6px 10px' }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              Request Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., Newly Hired TA Evaluation Form, Model Answers Upload, Lab Safety Log"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Submission Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
              Required Submission Action
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div
                onClick={() => setSubmissionType('file_upload')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: submissionType === 'file_upload' ? '2px solid var(--accent-blue)' : '1px solid var(--border)',
                  background: submissionType === 'file_upload' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-inset)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <UploadCloud size={20} color={submissionType === 'file_upload' ? 'var(--accent-blue)' : 'var(--text-muted)'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>File Upload Required</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>PDF, Word, Excel, Exam Keys</div>
                </div>
              </div>

              <div
                onClick={() => setSubmissionType('external_link')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: submissionType === 'external_link' ? '2px solid #10b981' : '1px solid var(--border)',
                  background: submissionType === 'external_link' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-inset)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <LinkIcon size={20} color={submissionType === 'external_link' ? '#10b981' : 'var(--text-muted)'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>External Link / Sheet</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Google Sheet, Google Form</div>
                </div>
              </div>

              <div
                onClick={() => setSubmissionType('form_fill')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: submissionType === 'form_fill' ? '2px solid #8b5cf6' : '1px solid var(--border)',
                  background: submissionType === 'form_fill' ? 'rgba(139, 92, 246, 0.1)' : 'var(--bg-inset)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <FileText size={20} color={submissionType === 'form_fill' ? '#8b5cf6' : 'var(--text-muted)'} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Form Response</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Status & Notes report</div>
                </div>
              </div>
            </div>
          </div>

          {/* External Link Input if external_link */}
          {submissionType === 'external_link' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
                Form or Tracker URL <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://docs.google.com/spreadsheets/d/... or Google Form URL"
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setFormLink('https://docs.google.com/spreadsheets/d/18ptos5jsQWknMQUy9AEjhhyAlCvmlU_LreOlHALGUcA/edit?usp=drivesdk')}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                >
                  Insert Lab Tracker Link
                </button>
              </div>
            </div>
          )}

          {/* Instructions / Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>
              Instructions for Assignees
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Explain clearly what each person should do, what to fill, and any specific deadlines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Assignees Selection */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Target Assignees ({selectedStaffIds.length} selected) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleSelectRole('ta')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  + All TAs
                </button>
                <button type="button" onClick={() => handleSelectRole('la')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  + All LAs
                </button>
                <button type="button" onClick={() => handleSelectRole('professor')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  + All Professors
                </button>
                <button type="button" onClick={() => handleSelectRole('admin')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  + Admin Staff
                </button>
                <button type="button" onClick={handleSelectAll} className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                  Select All
                </button>
                {selectedStaffIds.length > 0 && (
                  <button type="button" onClick={handleClearAll} className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '2px 8px', color: '#ef4444' }}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search staff by English name, Arabic name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
              />
            </div>

            {/* Staff Checkbox List */}
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '6px',
                background: 'var(--bg-inset)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '4px',
              }}
            >
              {filteredStaff.map((staff) => {
                const isSelected = selectedStaffIds.includes(staff.id);
                return (
                  <div
                    key={staff.id}
                    onClick={() => handleToggleStaff(staff.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{staff.full_name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {staff.ar_name || staff.rank || staff.email}
                      </div>
                    </div>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: isSelected ? 'none' : '1px solid var(--border)',
                        background: isSelected ? 'var(--accent-blue)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dates & Due Time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                Start Date
              </label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                Deadline Date <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                className="input-field"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                Due Time
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 1:00 PM, 5:00 PM"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                Priority
              </label>
              <select
                className="input-field"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="urgent">Urgent 🔴</option>
                <option value="medium">Intermediate 🟡</option>
                <option value="high">High</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Strict Confidentiality Checkbox Banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <input
              type="checkbox"
              id="confidential_toggle"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="confidential_toggle" style={{ cursor: 'pointer', fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <strong style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> Strict Confidentiality Enforcement
              </strong>
              <span>
                Only you (<strong>{currentUser?.full_name || 'the requester'}</strong>) will have permission to see and download the submitted files and responses. Other faculty members and assignees cannot view each other's submissions.
              </span>
            </label>
          </div>

          {/* Footer Submit Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 800,
                padding: '10px 22px',
              }}
            >
              {isSubmitting ? 'Dispatching...' : `Dispatch Request to ${selectedStaffIds.length} Assignees`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
