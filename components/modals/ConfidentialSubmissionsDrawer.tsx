'use client';

import React, { useState } from 'react';
import { Task, User } from '@/types';
import {
  X,
  Lock,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  RotateCcw,
  Check,
  ExternalLink,
  ShieldCheck,
  Paperclip,
  UploadCloud,
} from 'lucide-react';

interface ConfidentialSubmissionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  rootTask: Task | null;
  allTasks: Task[];
  currentUser: User | null;
  onAcknowledgeSubmission: (taskId: number, feedback?: string) => Promise<void>;
  onRequestRevision: (taskId: number, feedback: string) => Promise<void>;
  formatFileSize: (bytes: number | null | undefined) => string;
}

export const ConfidentialSubmissionsDrawer: React.FC<ConfidentialSubmissionsDrawerProps> = ({
  isOpen,
  onClose,
  rootTask,
  allTasks,
  currentUser,
  onAcknowledgeSubmission,
  onRequestRevision,
  formatFileSize,
}) => {
  const [feedbackMap, setFeedbackMap] = useState<Record<number, string>>({});
  const [activeActionId, setActiveActionId] = useState<number | null>(null);

  if (!isOpen || !rootTask) return null;

  // Find all tasks related to this submission request (by group_id or root task title)
  const relatedTasks = allTasks.filter((t) => {
    if (rootTask.group_id && t.group_id) {
      return t.group_id === rootTask.group_id;
    }
    return (
      t.title.toLowerCase().trim() === rootTask.title.toLowerCase().trim() &&
      t.assigned_by_id === rootTask.assigned_by_id
    );
  });

  const displayTasks = relatedTasks.length > 0 ? relatedTasks : [rootTask];
  const completedCount = displayTasks.filter((t) => t.status === 'done').length;
  const progressPercent = Math.round((completedCount / displayTasks.length) * 100);

  const handleFeedbackChange = (taskId: number, val: string) => {
    setFeedbackMap((prev) => ({ ...prev, [taskId]: val }));
  };

  const handleAcknowledge = async (task: Task) => {
    try {
      setActiveActionId(task.id);
      const notes = feedbackMap[task.id];
      await onAcknowledgeSubmission(task.id, notes);
      setFeedbackMap((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    } finally {
      setActiveActionId(null);
    }
  };

  const handleRevision = async (task: Task) => {
    const feedback = feedbackMap[task.id];
    if (!feedback || !feedback.trim()) {
      alert('Please enter revision feedback notes for this staff member.');
      return;
    }
    try {
      setActiveActionId(task.id);
      await onRequestRevision(task.id, feedback.trim());
      setFeedbackMap((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    } finally {
      setActiveActionId(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '800px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Lock size={12} /> Confidential Submissions
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Created by {rootTask.creator_name || 'You'}
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {rootTask.title}
            </h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '6px 10px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Privacy Notice Banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '20px',
            fontSize: '0.84rem',
            color: 'var(--text-main)',
          }}
        >
          <ShieldCheck size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <strong>Strict Confidentiality Guard Active:</strong> Only you as the requester have permission to view and download these submitted files and notes. Other staff members cannot view each other's submissions.
          </div>
        </div>

        {/* Progress Card */}
        <div
          style={{
            background: 'var(--bg-inset)',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid var(--border)',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
              Submission Completion Rate:
            </span>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: progressPercent === 100 ? '#10b981' : 'var(--accent-blue)' }}>
              {completedCount} of {displayTasks.length} Completed ({progressPercent}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: progressPercent === 100 ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Submissions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {displayTasks.map((task) => {
            const isDone = task.status === 'done';
            const isInProgress = task.status === 'in_progress';
            const isAcknowledged = task.dean_acknowledged === 1;

            return (
              <div
                key={task.id}
                style={{
                  borderRadius: '12px',
                  border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
                  background: isDone ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-inset)',
                  padding: '18px 20px',
                }}
              >
                {/* Assignee Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {task.assignee_avatar ? (
                      <img src={task.assignee_avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                    ) : (
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: 'var(--accent-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                        }}
                      >
                        {task.assignee_name?.[0] || 'U'}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {task.assignee_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {task.assignee_title} • {task.assignee_department} • {task.assignee_email}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: isDone ? 'rgba(16, 185, 129, 0.15)' : isInProgress ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: isDone ? '#10b981' : isInProgress ? '#f59e0b' : 'var(--text-muted)',
                      }}
                    >
                      {isDone ? 'Completed' : isInProgress ? 'In progress' : 'Pending Submission'}
                    </span>

                    {isAcknowledged && (
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--accent-blue)',
                        }}
                      >
                        ✓ Verified & Acknowledged
                      </span>
                    )}
                  </div>
                </div>

                {/* Submission Content: Files, URLs, Notes */}
                {isDone ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {/* Completion Notes */}
                    {task.completion_notes && (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border)',
                          fontSize: '0.84rem',
                          color: 'var(--text-main)',
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Staff Response / Report:
                        </div>
                        {task.completion_notes}
                      </div>
                    )}

                    {/* Uploaded Deliverable File */}
                    {task.attachment_url && (
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Paperclip size={18} color="var(--accent-blue)" />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                              {task.attachment_name || 'Submitted Deliverable File'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {formatFileSize(task.attachment_size)} • {task.attachment_type || 'Document'}
                            </div>
                          </div>
                        </div>

                        <a
                          href={task.attachment_url}
                          download={task.attachment_name || 'deliverable'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                        >
                          <Download size={13} />
                          <span>Download Deliverable</span>
                        </a>
                      </div>
                    )}

                    {/* Completion Link */}
                    {task.completion_url && (
                      <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ExternalLink size={14} color="#10b981" />
                        <a href={task.completion_url} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontWeight: 600 }}>
                          {task.completion_url}
                        </a>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>Submitted: {task.completed_at ? new Date(task.completed_at).toLocaleString() : 'Recently'}</span>
                    </div>

                    {/* Requester Actions (Acknowledge / Revision) */}
                    {!isAcknowledged && (
                      <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Optional feedback or notes to this staff member..."
                            value={feedbackMap[task.id] || ''}
                            onChange={(e) => handleFeedbackChange(task.id, e.target.value)}
                            style={{ fontSize: '0.82rem' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleRevision(task)}
                            disabled={activeActionId === task.id}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                          >
                            <RotateCcw size={13} />
                            <span>Request Revision</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAcknowledge(task)}
                            disabled={activeActionId === task.id}
                            className="btn btn-primary btn-sm"
                          >
                            <Check size={13} />
                            <span>Verify & Acknowledge</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
                    Awaiting submission. Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Pending'} {task.due_time ? `at ${task.due_time}` : ''}.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
