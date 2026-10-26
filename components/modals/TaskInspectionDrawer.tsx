'use client';

import React, { useState } from 'react';
import { Task } from '@/types';
import {
  Paperclip,
  FileText,
  Download,
  ExternalLink,
  Check,
  CheckCircle2,
  Award,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Send,
  Mail,
  X,
  Lock,
  Users,
  Plus,
  Clock,
} from 'lucide-react';
import { parseGoogleDriveUrl } from '@/lib/drive';

interface TaskInspectionDrawerProps {
  task: Task | null;
  onClose: () => void;
  onDeanAcknowledge: (taskId: number, feedback?: string) => Promise<void> | void;
  onRequestRevision?: (taskId: number, feedback: string) => Promise<void> | void;
  onOpenEmailDispatch?: (task: Task) => void;
  onRequestDeanMeeting?: (task: Task) => void;
  formatFileSize: (bytes: number | null | undefined) => string;
  allTasks?: Task[];
  currentUser?: any;
  allUsers?: any[];
  onSubTaskCreated?: () => void;
}

export const TaskInspectionDrawer: React.FC<TaskInspectionDrawerProps> = ({
  task,
  onClose,
  onDeanAcknowledge,
  onRequestRevision,
  onOpenEmailDispatch,
  onRequestDeanMeeting,
  formatFileSize,
  allTasks = [],
  currentUser,
  allUsers = [],
  onSubTaskCreated,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sub-Responsibilities state
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [subAssigneeId, setSubAssigneeId] = useState<number | ''>('');
  const [subTitle, setSubTitle] = useState('');
  const [subDeadline, setSubDeadline] = useState('');
  const [subDescription, setSubDescription] = useState('');
  const [isCreatingSubTask, setIsCreatingSubTask] = useState(false);
  const [subTaskError, setSubTaskError] = useState<string | null>(null);

  if (!task) return null;

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      setActionError(null);
      await onDeanAcknowledge(task.id, feedbackText.trim() || undefined);
      setFeedbackText('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevision = async () => {
    if (!feedbackText.trim()) {
      setActionError('Please specify the required revisions and feedback for the faculty member.');
      return;
    }
    if (!onRequestRevision) return;

    try {
      setIsSubmitting(true);
      setActionError(null);
      await onRequestRevision(task.id, feedbackText.trim());
      setFeedbackText('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to request revision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDean = currentUser?.role === 'dean' || currentUser?.role === 'vice_dean' || currentUser?.role === 'admin' || currentUser?.id === 6496 || currentUser?.id === 6591 || currentUser?.id === 99;
  const isTaskOwner = task.task_owner_id ? task.task_owner_id === currentUser?.id : task.assigned_by_id === currentUser?.id;
  const canManageSubTasks = isDean || isTaskOwner;

  const subTasks = (allTasks || []).filter(t => t.parent_task_id === task.id);
  const completedSubTasks = subTasks.filter(t => t.status === 'done').length;
  const subTaskProgress = subTasks.length > 0 ? Math.round((completedSubTasks / subTasks.length) * 100) : 0;

  const handleCreateSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subAssigneeId || !subTitle.trim() || !subDeadline) {
      setSubTaskError('Assignee, title, and deadline are required.');
      return;
    }

    try {
      setIsCreatingSubTask(true);
      setSubTaskError(null);

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: subTitle.trim(),
          description: subDescription.trim() || `Sub-responsibility for task: ${task.title}`,
          assigned_to_id: Number(subAssigneeId),
          deadline: subDeadline,
          priority: task.priority || 'medium',
          department: task.department,
          hat_id: task.hat_id || null,
          committee_id: task.committee_id || null,
          committee_name: task.committee_name || null,
          parent_task_id: task.id,
          task_owner_id: task.task_owner_id || currentUser?.id,
          task_owner_name: task.task_owner_name || currentUser?.full_name,
          group_id: task.group_id || `group_${task.id}`,
          responsibility_model: 'individual_submissions',
          requires_dean_approval: task.requires_dean_approval || 0,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create sub-responsibility');
      }

      setSubTitle('');
      setSubDescription('');
      setSubAssigneeId('');
      setSubDeadline('');
      setIsAddingSubTask(false);
      if (onSubTaskCreated) {
        onSubTaskCreated();
      }
    } catch (err: any) {
      setSubTaskError(err.message || 'Error creating sub-responsibility');
    } finally {
      setIsCreatingSubTask(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`badge badge-${task.status || 'pending'}`}>
                <span className="badge-dot"></span>
                {(task.status || 'pending').replace('_', ' ').toUpperCase()}
              </span>
              {Boolean(task.is_confidential) && (
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Lock size={12} /> Confidential Submission
                </span>
              )}
              {task.dean_acknowledged === 1 && (
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ShieldCheck size={12} /> Dean Verified
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{task.title}</h3>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Google Form / Live Tracker Link Banner */}
        {(task.google_form_url || task.form_link) && (
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.35)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.1)',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} />
                <span>Google Form / Academic Submission Link</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Click the button to open and complete the official Google Form for this directive.
              </p>
            </div>
            <a
              href={task.google_form_url || task.form_link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#7c3aed',
                borderColor: '#6d28d9',
                textDecoration: 'none',
                fontWeight: 700,
                padding: '8px 16px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
              }}
            >
              <span>📝 Open Google Form</span>
              <ExternalLink size={15} />
            </a>
          </div>
        )}

        {/* Task Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            padding: '16px',
            background: 'var(--bg-inset)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            marginBottom: '20px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Assigned Faculty Team ({Array.isArray(task.assigned_members) && task.assigned_members.length > 0 ? task.assigned_members.length : 1} Members)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {(Array.isArray(task.assigned_members) && task.assigned_members.length > 0 
                ? task.assigned_members 
                : [task.assignee_name || 'Faculty Staff']).map((name, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'rgba(37, 99, 235, 0.12)',
                    color: 'var(--accent-blue)',
                    border: '1px solid rgba(37, 99, 235, 0.3)',
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
            {task.task_owner_name && (
              <div style={{ fontSize: '0.75rem', color: 'var(--status-progress)', fontWeight: 600, marginTop: '6px' }}>
                👑 Lead: {task.task_owner_name}
              </div>
            )}
          </div>

          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Deadline & Governance
            </span>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem', marginTop: '2px' }}>
              {new Date(task.deadline).toLocaleString()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: task.priority === 'urgent' ? 'var(--status-overdue)' : 'var(--accent-blue)',
                }}
              >
                Priority: {(task.priority || 'medium').toUpperCase()}
              </span>
              <span style={{ fontSize: '0.72rem', color: task.requires_dean_approval ? 'var(--status-revision)' : 'var(--status-done)', fontWeight: 600 }}>
                {task.requires_dean_approval ? '👑 Requires Formal Dean Approval' : '🤝 Delegated Operational Task'}
              </span>
            </div>
          </div>
        </div>

        {/* Original Instructions */}
        <div style={{ marginBottom: '20px' }}>
          <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Dean's Office Directives & Instructions
          </h5>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--text-main)',
              background: 'var(--bg-inset)',
              border: '1px solid var(--border)',
              padding: '12px',
              borderRadius: '8px',
              lineHeight: 1.5,
            }}
          >
            {task.description}
          </p>

          {task.attachment_url && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
              }}
            >
              <div
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  color: 'var(--accent-blue)',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Paperclip size={13} />
                <span>Dispatched Document Attachment:</span>
              </div>

              {task.attachment_type?.startsWith('image/') ||
              (task.attachment_url.startsWith('data:image/') ||
                /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(task.attachment_name || '')) ? (
                <div style={{ marginBottom: '10px' }}>
                  <img
                    src={task.attachment_url}
                    alt={task.attachment_name || 'Task Attachment'}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '220px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                </div>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <FileText size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {task.attachment_name || 'Attached Document'}
                  </span>
                  {task.attachment_size && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      ({formatFileSize(task.attachment_size)})
                    </span>
                  )}
                </div>
                <a
                  href={task.attachment_url}
                  download={task.attachment_name || 'attached-document'}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  <Download size={14} />
                  <span>Download / Open</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Team Action Plan / Work Plan Milestones */}
        {task.action_plan && (
          <div style={{
            marginBottom: '20px',
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'var(--bg-inset)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📋</span> Team Action Plan / Work Plan
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              {task.action_plan}
            </p>
          </div>
        )}

        {/* Dedicated Google Drive Link for Any File Size */}
        {task.drive_link && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>📁</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981' }}>
                  Google Drive / Cloud Deliverable Link
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Unbounded file archive (videos, raw datasets, bulk folders)
                </div>
              </div>
            </div>
            <a
              href={task.drive_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ background: '#10b981', borderColor: '#10b981', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <ExternalLink size={13} />
              <span>Open in Google Drive</span>
            </a>
          </div>
        )}

        {/* Direct Dean Meeting Consultation Request / Directive Session */}
        {onRequestDeanMeeting && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: isDean ? 'rgba(37, 99, 235, 0.08)' : 'rgba(139, 92, 246, 0.08)',
            border: isDean ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isDean ? '#2563eb' : '#c084fc' }}>
                {isDean ? `📅 Directive Session with ${task.assignee_name || 'Assignee'}` : `📅 Consultation with Dean Prof. Dr. Gehan`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {isDean
                  ? `Schedule a direct review or follow-up session with ${task.assignee_name || 'the assigned faculty member'} regarding this task.`
                  : 'Request a consultation session with Prof. Dr. Gehan Safwat regarding this task.'}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                onClose();
                onRequestDeanMeeting(task);
              }}
              style={{ fontSize: '0.78rem', fontWeight: 700 }}
            >
              {isDean ? 'Schedule Session' : 'Request Meeting'}
            </button>
          </div>
        )}

        {/* Professor's Work Submission & Deliverables */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h5 style={{ fontSize: '0.8rem', color: 'var(--status-done)', textTransform: 'uppercase', fontWeight: 700 }}>
              Faculty Submission & Work Report
            </h5>
            {task.completed_at && (
              <span style={{ fontSize: '0.75rem', color: 'var(--status-done)', fontWeight: 600 }}>
                Submitted on: {new Date(task.completed_at).toLocaleString()}
              </span>
            )}
          </div>

          {task.completion_notes ? (
            <div
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--status-done)',
                padding: '16px',
                borderRadius: '8px',
              }}
            >
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, margin: 0 }}>
                &ldquo;{task.completion_notes}&rdquo;
              </p>

              {task.completion_url && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--status-done)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>Attached Evidence / Deliverable:</span>
                  </div>

                  {task.completion_url.startsWith('/api/files/') ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FileText size={18} color="var(--status-done)" />
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {decodeURIComponent(task.completion_url.split('/').pop()?.replace(/^\d+-/, '') || 'evidence-deliverable')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <a
                          href={task.completion_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <ExternalLink size={13} />
                          <span>Preview / Open</span>
                        </a>
                      </div>
                    </div>
                  ) : (() => {
                    const driveRes = parseGoogleDriveUrl(task.completion_url);
                    return (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.08)',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.1rem' }}>
                            {driveRes.resourceType === 'document' ? '📄' : driveRes.resourceType === 'spreadsheet' ? '📊' : driveRes.resourceType === 'presentation' ? '📽️' : driveRes.resourceType === 'folder' ? '📁' : '🔗'}
                          </span>
                          <div>
                            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {driveRes.label}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.completion_url}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {driveRes.exportDownloadUrl && (
                            <a
                              href={driveRes.exportDownloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', fontSize: '0.75rem', padding: '4px 8px' }}
                            >
                              <Download size={13} />
                              Export Direct
                            </a>
                          )}
                          <a
                            href={task.completion_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', padding: '4px 10px' }}
                          >
                            <ExternalLink size={13} />
                            <span>Open In New Tab</span>
                          </a>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-inset)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              The faculty member has not yet submitted a narrative description for this task.
            </div>
          )}
        </div>

        {/* ── SUB-RESPONSIBILITIES & TEAM BREAKDOWN (OPTION B) ── */}
        {!task.parent_task_id && (
          <div
            style={{
              padding: '18px',
              borderRadius: '10px',
              background: 'var(--bg-inset)',
              border: '1px solid var(--border)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--accent-blue)" />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Sub-Responsibilities & Team Division
                </h4>
                {subTasks.length > 0 && (
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: 700 }}>
                    {completedSubTasks} of {subTasks.length} Completed
                  </span>
                )}
              </div>

              {canManageSubTasks && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddingSubTask(!isAddingSubTask)}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={13} />
                  <span>{isAddingSubTask ? 'Cancel' : 'Add Sub-Responsibility'}</span>
                </button>
              )}
            </div>

            {/* Mini Progress Bar if there are sub-tasks */}
            {subTasks.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${subTaskProgress}%`,
                      background: subTaskProgress === 100 ? 'var(--status-done)' : 'var(--accent-blue)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Sub-Tasks List */}
            {subTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: isAddingSubTask ? '16px' : '0' }}>
                {subTasks.map((st) => {
                  const isDone = st.status === 'done';
                  const isInProgress = st.status === 'in_progress';
                  return (
                    <div
                      key={st.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-card)',
                        border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '220px' }}>
                        {isDone ? (
                          <CheckCircle2 size={16} color="var(--status-done)" style={{ flexShrink: 0 }} />
                        ) : (
                          <Clock size={16} color={isInProgress ? 'var(--accent-blue)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                        )}
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {st.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            👤 {st.assignee_title ? `${st.assignee_title} ` : ''}{st.assignee_name || 'Staff Member'} • Due: {st.deadline ? new Date(st.deadline).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            textTransform: 'uppercase',
                            background: isDone ? 'rgba(16, 185, 129, 0.15)' : isInProgress ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isDone ? '#34d399' : isInProgress ? '#60a5fa' : '#fbbf24',
                          }}
                        >
                          {st.status}
                        </span>

                        {st.attachment_url && (
                          <a
                            href={st.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Download Sub-Responsibility Deliverable"
                          >
                            <Download size={12} />
                            <span>File</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !isAddingSubTask ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No sub-responsibilities divided yet. {canManageSubTasks && 'Click "Add Sub-Responsibility" to delegate specific pieces of this task.'}
              </p>
            ) : null}

            {/* Form to Add Sub-Responsibility */}
            {isAddingSubTask && (
              <form
                onSubmit={handleCreateSubTask}
                style={{
                  marginTop: subTasks.length > 0 ? '12px' : '0',
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd', marginBottom: '10px' }}>
                  Assign Sub-Responsibility to Team Member
                </div>

                {subTaskError && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '8px' }}>
                    {subTaskError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Assignee *
                    </label>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      value={subAssigneeId}
                      onChange={(e) => setSubAssigneeId(Number(e.target.value))}
                      required
                    >
                      <option value="">-- Choose Member --</option>
                      {(allUsers || []).filter(u => u.id !== 99).map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.title || u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Deadline *
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                      value={subDeadline}
                      onChange={(e) => setSubDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Sub-Responsibility Deliverable Title *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    placeholder="e.g. Prepare station 2 lab practical rubric"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Specific Deliverable Instructions
                  </label>
                  <textarea
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 10px', minHeight: '60px' }}
                    placeholder="Instructions or requirements for this individual deliverable..."
                    value={subDescription}
                    onChange={(e) => setSubDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setIsAddingSubTask(false)}
                    disabled={isCreatingSubTask}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={isCreatingSubTask}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isCreatingSubTask ? 'Assigning...' : 'Assign Sub-Responsibility'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── CASE 1: TASK IS OFFICIALLY APPROVED BY DEAN ── */}
        {task.dean_acknowledged === 1 && (
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: 'var(--status-done-bg)',
              border: '2px solid var(--status-done-border)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <CheckCircle2 size={22} color="var(--status-done)" />
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--status-done)', margin: 0 }}>
                  Approved by Dean: Prof. Dr. Gehan Safwat
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Faculty of Biotechnology • October University for Modern Sciences and Arts (MSA)
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: '8px 0', lineHeight: 1.5 }}>
              This deliverable has been formally reviewed and officially approved by the Dean as meeting
              the academic, administrative, and institutional quality standards of the Faculty.
            </p>

            {task.dean_feedback && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-inset)',
                  borderLeft: '3px solid var(--status-done)',
                  fontSize: '0.85rem',
                  color: 'var(--text-main)',
                }}
              >
                <strong style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                  Dean's Edits & Feedback Notes:
                </strong>
                &ldquo;{task.dean_feedback}&rdquo;
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border)',
                fontSize: '0.78rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Dean Office Decision: </span>
                <strong style={{ color: 'var(--text-main)' }}>Prof. Dr. Gehan Safwat</strong>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>
                  Dean, Faculty of Biotechnology
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: 'var(--status-done)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> OFFICIAL RECORD
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── CASE 2: REVISION REQUESTED NOTICE ── */}
        {task.status === 'revision_requested' && (
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'var(--status-pending-bg)',
              border: '1px solid var(--status-pending-border)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', color: 'var(--status-pending)' }}>
              <AlertTriangle size={18} />
              <strong style={{ fontSize: '0.925rem' }}>Revisions Mandated by Dean Prof. Dr. Gehan Safwat</strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: '4px 0 0 0', lineHeight: 1.5, fontWeight: 600 }}>
              &ldquo;{task.dean_feedback || 'Please update the submission per Dean office directives.'}&rdquo;
            </p>
          </div>
        )}

        {/* ── CASE 3: PENDING DEAN REVIEW (SIGN-OFF & REVISION CONTROLS) ── */}
        {task.status === 'done' && task.dean_acknowledged !== 1 && (
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-inset)',
              border: '1px solid var(--border)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-blue)' }}>
              <Award size={18} />
              <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Dean's Executive Review & Verification Decision
              </h4>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Inspect the submitted deliverable and record Prof. Dr. Gehan Safwat's official approval or revision directives.
            </p>

            {isDean ? (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                    Executive Note / Feedback (Optional for Approval, Required for Revision):
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Add Dean's commendation or specific revision directives for the faculty member..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                {actionError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--status-overdue-bg)',
                      border: '1px solid var(--status-overdue-border)',
                      borderRadius: '6px',
                      color: 'var(--status-overdue)',
                      fontSize: '0.8rem',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>{actionError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: 'var(--status-done)',
                      borderColor: 'var(--status-done)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      padding: '8px 18px',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isSubmitting ? 'Approving...' : '✅ Approve Deliverable (Prof. Dr. Gehan Safwat)'}</span>
                  </button>

                  {onRequestRevision && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleRevision}
                      disabled={isSubmitting}
                      style={{
                        color: 'var(--status-pending)',
                        borderColor: 'var(--status-pending-border)',
                        backgroundColor: 'var(--status-pending-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        padding: '8px 14px',
                        fontWeight: 700,
                      }}
                    >
                      <RotateCcw size={15} />
                      <span>↩️ Request Revisions</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  color: '#eab308',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Clock size={16} />
                <span>
                  <strong>Submitted to Dean Office:</strong> Awaiting formal review and official approval from <strong>Prof. Dr. Gehan Safwat</strong>.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Statutory Task #{task.id} • Office of the Dean
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenEmailDispatch && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onOpenEmailDispatch(task)}
                style={{
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--accent-blue)',
                  borderColor: 'var(--border)',
                  fontWeight: 600,
                }}
                title="Compose and dispatch official academic email directive"
              >
                <Mail size={15} />
                <span>Dispatch Email / Memo</span>
              </button>
            )}
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 16px' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
