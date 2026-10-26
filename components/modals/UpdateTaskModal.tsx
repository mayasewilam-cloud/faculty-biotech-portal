'use client';

import React from 'react';
import { Task } from '@/types';
import { Paperclip, FileText, Download, CheckCircle2, Clock, RotateCcw, Send, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import { FileUploadZone } from '@/components/common/FileUploadZone';

interface UpdateTaskModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  updateStatus: 'pending' | 'in_progress' | 'done';
  setUpdateStatus: (status: 'pending' | 'in_progress' | 'done') => void;
  updateNotes: string;
  setUpdateNotes: (notes: string) => void;
  updateUrl: string;
  setUpdateUrl: (url: string) => void;
  driveLink?: string;
  setDriveLink?: (link: string) => void;
  actionPlan?: string;
  setActionPlan?: (plan: string) => void;
  onRequestDeanMeeting?: (task: Task) => void;
  isSubmittingUpdate: boolean;
  formatFileSize: (bytes: number | null | undefined) => string;
  isDean?: boolean;
}

export const UpdateTaskModal: React.FC<UpdateTaskModalProps> = ({
  isOpen,
  task,
  onClose,
  onSubmit,
  updateStatus,
  setUpdateStatus,
  updateNotes,
  setUpdateNotes,
  updateUrl,
  setUpdateUrl,
  driveLink,
  setDriveLink,
  actionPlan,
  setActionPlan,
  onRequestDeanMeeting,
  isSubmittingUpdate,
  formatFileSize,
  isDean = false,
}) => {
  if (!isOpen || !task) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-in_progress" style={{ marginBottom: '6px' }}>
              Updating Task #{task.id}
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{task.title}</h3>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        {/* Dean's Original Instructions Box */}
        <div style={{
          background: 'var(--bg-inset)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '20px',
        }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Instructions from Dean's Office:
          </span>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            {task.description}
          </p>

          {task.attachment_url && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Paperclip size={13} />
                <span>Attached Document / Deliverable Material:</span>
              </div>

              {task.attachment_type?.startsWith('image/') || (task.attachment_url.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(task.attachment_name || '')) ? (
                <div style={{ marginBottom: '10px' }}>
                  <img
                    src={task.attachment_url}
                    alt={task.attachment_name || 'Task Attachment'}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '240px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </div>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <FileText size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.attachment_name || 'Attached File'}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Due: <strong>{new Date(task.deadline).toLocaleString()}</strong></span>
            <span>Priority: <strong>{(task.priority || 'medium').toUpperCase()}</strong></span>
          </div>
        </div>

        {/* Revision Directives from Dean */}
        {task.dean_feedback && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: 'var(--status-pending-bg)',
              border: '1px solid var(--status-pending-border)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-pending)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '4px' }}>
              <AlertTriangle size={16} />
              <span>Directives from Dean Prof. Dr. Gehan Safwat</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.5, fontWeight: 500 }}>
              &ldquo;{task.dean_feedback}&rdquo;
            </p>
          </div>
        )}

        {/* Required Form / Tracker Link Card */}
        {task.form_link && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👉 Required Form / Tracker Link</span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Please open the tracker, find your name, and update your status or add a comment.
              </p>
            </div>
            <a
              href={task.form_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', borderColor: '#10b981', textDecoration: 'none' }}
            >
              <ExternalLink size={14} />
              <span>Open Link in New Tab</span>
            </a>
          </div>
        )}

        {/* Strict Confidentiality Banner */}
        {Boolean(task.is_confidential) && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck size={20} color="#ef4444" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
              <strong>🔒 Strict Confidentiality Active:</strong> Your uploaded file and notes are private and will be submitted <em>only</em> to the requester (<strong>{task.creator_name || 'the requester'}</strong>). Other faculty members cannot view your submission.
            </div>
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={onSubmit}>
          {/* Status Radio Buttons */}
          <div className="form-group">
            <label className="form-label">Task Status *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: updateStatus === 'done' ? '2px solid var(--status-done)' : '1px solid var(--border)',
                background: updateStatus === 'done' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: updateStatus === 'done' ? 'var(--status-done)' : 'var(--text-secondary)'
              }}>
                <input
                  type="radio"
                  name="status"
                  value="done"
                  checked={updateStatus === 'done'}
                  onChange={() => setUpdateStatus('done')}
                  style={{ display: 'none' }}
                />
                <CheckCircle2 size={16} />
                <span>Done (Completed)</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: updateStatus === 'in_progress' ? '2px solid var(--status-progress)' : '1px solid var(--border)',
                background: updateStatus === 'in_progress' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: updateStatus === 'in_progress' ? 'var(--status-progress)' : 'var(--text-secondary)'
              }}>
                <input
                  type="radio"
                  name="status"
                  value="in_progress"
                  checked={updateStatus === 'in_progress'}
                  onChange={() => setUpdateStatus('in_progress')}
                  style={{ display: 'none' }}
                />
                <Clock size={16} />
                <span>In Progress</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: updateStatus === 'pending' ? '2px solid var(--status-pending)' : '1px solid var(--border)',
                background: updateStatus === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                color: updateStatus === 'pending' ? 'var(--status-pending)' : 'var(--text-secondary)'
              }}>
                <input
                  type="radio"
                  name="status"
                  value="pending"
                  checked={updateStatus === 'pending'}
                  onChange={() => setUpdateStatus('pending')}
                  style={{ display: 'none' }}
                />
                <RotateCcw size={16} />
                <span>Pending</span>
              </label>
            </div>
          </div>

          {/* Text Description of Work Done */}
          <div className="form-group">
            <label className="form-label">
              Describe in Text What You Did (For Dean's Office) *
            </label>
            <textarea
              className="form-textarea"
              rows={5}
              placeholder="Explain exactly what was completed, steps taken, committee meetings held, or current status for the Dean's inspection..."
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              This text description will be logged directly into the Dean's live tracking feed with an exact timestamp.
            </span>
          </div>

          {/* Action Plan / Work Plan Milestones */}
          {setActionPlan && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Team Action Plan / Work Plan Milestones</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Phases, execution steps & timeline</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Phase 1: Compile syllabus drafts by Oct 12;&#10;Phase 2: Moderation committee verification by Oct 14;&#10;Phase 3: Final dossier sign-off by Oct 15..."
                value={actionPlan || ''}
                onChange={(e) => setActionPlan(e.target.value)}
              />
            </div>
          )}

          {/* Deliverable Document or File Upload */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <FileUploadZone
              label="Deliverable File / Evidence (Direct File)"
              hint="Upload signed exam roster, course file PDF, syllabus, images, or report up to 25 MB."
              currentFile={
                updateUrl && updateUrl.startsWith('/api/files/')
                  ? {
                      name: decodeURIComponent(updateUrl.split('/').pop()?.replace(/^\d+-/, '') || 'evidence-document'),
                      url: updateUrl,
                      size: 0,
                      type: 'application/octet-stream',
                    }
                  : null
              }
              onFileUploaded={(uploaded) => {
                setUpdateUrl(uploaded.url);
              }}
              onFileRemoved={() => {
                setUpdateUrl('');
              }}
            />
          </div>

          {/* Dedicated Google Drive / Cloud Link for Any File Size */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#10b981' }}>🔗</span>
              <span>Google Drive / Cloud Folder Link (For Any File Size)</span>
            </label>
            <input
              type="url"
              className="form-input"
              placeholder="https://drive.google.com/drive/folders/... or OneDrive folder link"
              value={driveLink !== undefined ? driveLink : (updateUrl.startsWith('/api/files/') ? '' : updateUrl)}
              onChange={(e) => {
                if (setDriveLink) setDriveLink(e.target.value);
                else setUpdateUrl(e.target.value);
              }}
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Paste link to large video recordings, high-res scans, or bulk accreditation folders of any size.
            </span>
          </div>

          {/* Shortcut: Request Meeting / Directive Session */}
          {onRequestDeanMeeting && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: isDean ? 'rgba(37, 99, 235, 0.08)' : 'rgba(139, 92, 246, 0.08)',
              border: isDean ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid rgba(139, 92, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isDean ? '#2563eb' : '#c084fc' }}>
                  {isDean ? '📅 Schedule Directive Session with Assignee' : '📅 Need Dean Guidance on this Task?'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {isDean
                    ? `Schedule a direct review session with ${task.assignee_name || 'assignee'} regarding this task.`
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
                style={{ padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {isDean ? 'Schedule Session' : 'Request Meeting'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmittingUpdate}
            >
              <Send size={16} />
              <span>{isSubmittingUpdate ? 'Submitting...' : 'Submit Update to Dean Office'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
