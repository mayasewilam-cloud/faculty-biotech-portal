'use client';

import React, { useState } from 'react';
import { Hat, User, FacultyCommittee } from '@/types';
import { Users2, Paperclip, FileText, Send, Sparkles, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { FALL_2026_CATEGORIES } from '@/lib/fall_2026_categories';
import { FALL_2026_TASK_ROSTER } from '@/lib/fall_2026_tasks_roster';
import { QUADRUPLET_ALIASES } from '@/lib/staff_seed';
import { INSTITUTIONAL_PILLARS, PillarTaskTemplate } from '@/lib/pillar_catalog';
import { FileUploadZone } from '@/components/common/FileUploadZone';

export const formatUserDisplayName = (u?: any, fallbackId?: number) => {
  if (!u) return fallbackId ? ('Staff #' + fallbackId) : '';
  const fullName = u.full_name || '';
  const title = u.title || '';
  if (!title) return fullName;
  if (fullName.toLowerCase().startsWith(title.toLowerCase())) {
    return fullName;
  }
  return title + ' ' + fullName;
};

export const resolveTaskMemberUser = (mName: string, users: any[]) => {
  if (!mName) return undefined;
  const normAlpha = (t: string) => {
    if (!t) return '';
    let withoutTitle = t.toLowerCase();
    withoutTitle = withoutTitle.replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '');
    withoutTitle = withoutTitle.replace(/^(prof\.|dr\.|assoc\.\s*prof\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/gi, '');
    return withoutTitle.replace(/[^a-z0-9]/g, '');
  };

  const cleanM = normAlpha(mName);
  if (!cleanM) return undefined;

  for (const [k, v] of Object.entries(QUADRUPLET_ALIASES || {})) {
    if (normAlpha(k) === cleanM) {
      const target = normAlpha(v);
      const matched = users.find(u => normAlpha(u.full_name).includes(target) || target.includes(normAlpha(u.full_name)));
      if (matched) return matched;
    }
  }

  const directMatch = users.find(u => {
    const uClean = normAlpha(u.full_name);
    return cleanM === uClean || cleanM.includes(uClean) || uClean.includes(cleanM);
  });
  if (directMatch) return directMatch;

  const mTokens = mName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((t: string) => t.length > 2 && !['prof', 'dr', 'la', 'ta', 'mrs', 'ms', 'assoc'].includes(t));
  if (mTokens.length >= 1) {
    for (const u of users) {
      const uTokens = u.full_name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((t: string) => t.length > 2 && !['prof', 'dr', 'la', 'ta', 'mrs', 'ms', 'assoc'].includes(t));
      if (mTokens.length >= 2 && uTokens.length >= 2) {
        if (mTokens[0] === uTokens[0] && (mTokens[mTokens.length - 1] === uTokens[uTokens.length - 1] || mTokens[1] === uTokens[1])) {
          return u;
        }
      } else if (mTokens.length >= 1 && uTokens.length >= 1) {
        if (mTokens[0] === uTokens[0]) {
          return u;
        }
      }
    }
  }
  return undefined;
};

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  dispatchMode: 'single' | 'committee' | 'selected' | 'department' | 'all';
  setDispatchMode: (mode: 'single' | 'committee' | 'selected' | 'department' | 'all') => void;
  hats: Hat[];
  targetHatId: number | '';
  setTargetHatId: (val: number | '') => void;
  committees?: FacultyCommittee[];
  targetCommitteeId?: number | '';
  setTargetCommitteeId?: (val: number | '') => void;
  taskOwnerId?: number | '';
  setTaskOwnerId?: (val: number | '') => void;
  responsibilityModel?: 'shared_deliverable' | 'individual_submissions';
  setResponsibilityModel?: (val: 'shared_deliverable' | 'individual_submissions') => void;
  requiresDeanApproval?: boolean;
  setRequiresDeanApproval?: (val: boolean) => void;
  selectedRecipients: number[];
  setSelectedRecipients: React.Dispatch<React.SetStateAction<number[]>>;
  assignedMemberNames?: string[];
  setAssignedMemberNames?: React.Dispatch<React.SetStateAction<string[]>>;
  targetDept: string;
  setTargetDept: (dept: string) => void;
  recipientSearch: string;
  setRecipientSearch: (query: string) => void;
  newTaskTitle: string;
  setNewTaskTitle: (title: string) => void;
  newTaskPriority: 'low' | 'medium' | 'high' | 'urgent';
  setNewTaskPriority: (p: 'low' | 'medium' | 'high' | 'urgent') => void;
  newTaskDeadline: string;
  setNewTaskDeadline: (dl: string) => void;
  newTaskDescription: string;
  setNewTaskDescription: (desc: string) => void;
  newTaskAssigneeId: number | '';
  setNewTaskAssigneeId: (id: number) => void;
  newTaskCategory?: string;
  setNewTaskCategory?: (val: string) => void;
  newTaskGoogleFormUrl?: string;
  setNewTaskGoogleFormUrl?: (val: string) => void;
  newTaskAttachment: {
    name: string;
    type: string;
    size: number;
    url?: string;
    dataUrl?: string;
  } | null;
  setNewTaskAttachment: (att: any) => void;
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatFileSize: (bytes: number | null | undefined) => string;
  isCreatingTask: boolean;
  currentUser: User | null;
  allUsers: any[];
  baseUsers: any[];
  leadershipUsers: any[];
  profUsers: any[];
  drUsers: any[];
  laUsers: any[];
  taUsers: any[];
  raN112Users: any[];
  prototypingRaUsers: any[];
  adminCadreUsers: any[];
  facultyDepartments: string[];
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dispatchMode,
  setDispatchMode,
  hats,
  targetHatId,
  setTargetHatId,
  committees = [],
  targetCommitteeId = '',
  setTargetCommitteeId,
  taskOwnerId = '',
  setTaskOwnerId,
  responsibilityModel = 'individual_submissions',
  setResponsibilityModel,
  requiresDeanApproval = false,
  setRequiresDeanApproval,
  selectedRecipients,
  setSelectedRecipients,
  assignedMemberNames: propAssignedMemberNames,
  setAssignedMemberNames: propSetAssignedMemberNames,
  targetDept,
  setTargetDept,
  recipientSearch,
  setRecipientSearch,
  newTaskTitle,
  setNewTaskTitle,
  newTaskPriority,
  setNewTaskPriority,
  newTaskDeadline,
  setNewTaskDeadline,
  newTaskDescription,
  setNewTaskDescription,
  newTaskAssigneeId,
  setNewTaskAssigneeId,
  newTaskCategory = 'Fall 2026 Academic Directives',
  setNewTaskCategory,
  newTaskGoogleFormUrl = '',
  setNewTaskGoogleFormUrl,
  newTaskAttachment,
  setNewTaskAttachment,
  handleFileChange,
  formatFileSize,
  isCreatingTask,
  currentUser,
  allUsers,
  baseUsers,
  leadershipUsers,
  profUsers,
  drUsers,
  laUsers,
  taUsers,
  raN112Users,
  prototypingRaUsers,
  adminCadreUsers,
  facultyDepartments,
}) => {
  const [localMemberNames, setLocalMemberNames] = useState<string[]>([]);
  const assignedMemberNames = propAssignedMemberNames !== undefined ? propAssignedMemberNames : localMemberNames;
  const setAssignedMemberNames = propSetAssignedMemberNames !== undefined ? propSetAssignedMemberNames : setLocalMemberNames;

  const [selectedTaskTemplate, setSelectedTaskTemplate] = useState<string>('');
  const [memberToAdd, setMemberToAdd] = useState<string>('');
  const [customMemberInput, setCustomMemberInput] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Fall 2026 Directive Template Selection Handler
  const handleSelectDirectiveTemplate = (title: string) => {
    setSelectedTaskTemplate(title);
    if (!title || title === 'custom') {
      if (title === 'custom') {
        setNewTaskTitle('');
      }
      return;
    }

    setNewTaskTitle(title);
    const directive = FALL_2026_TASK_ROSTER.find(t => t.title.toLowerCase().trim() === title.toLowerCase().trim());
    if (directive) {
      if (directive.priority && setNewTaskPriority) {
        setNewTaskPriority(directive.priority as any);
      }
      if (directive.deadline && setNewTaskDeadline) {
        setNewTaskDeadline(directive.deadline.slice(0, 10));
      }
      if (directive.google_form_url && setNewTaskGoogleFormUrl) {
        setNewTaskGoogleFormUrl(directive.google_form_url);
      }
      if (setNewTaskDescription) {
        setNewTaskDescription(`Official academic task directive: ${directive.title}. Please review assigned deliverables and submit on schedule.`);
      }

      // 1. Populate all member names so every single one displays as a badge
      const members = [...directive.members];
      setAssignedMemberNames(members);

      // 2. Resolve matching IDs
      const matchedUserIds: number[] = [];
      for (const mName of members) {
        const found = resolveTaskMemberUser(mName, allUsers);
        if (found && !matchedUserIds.includes(found.id)) {
          matchedUserIds.push(found.id);
        }
      }

      setSelectedRecipients(matchedUserIds);
      if (matchedUserIds.length > 0) {
        setNewTaskAssigneeId(matchedUserIds[0]);
      } else if (currentUser) {
        setNewTaskAssigneeId(currentUser.id);
      } else {
        setNewTaskAssigneeId(6496);
      }
    }
  };

  const handleRemoveMember = (nameToRemove: string) => {
    setAssignedMemberNames(prev => prev.filter(m => m !== nameToRemove));
    const matched = resolveTaskMemberUser(nameToRemove, allUsers);
    if (matched) {
      setSelectedRecipients(prev => prev.filter(id => id !== matched.id));
      if (newTaskAssigneeId === matched.id) {
        const rem = selectedRecipients.filter(id => id !== matched.id);
        setNewTaskAssigneeId(rem.length > 0 ? rem[0] : (currentUser?.id || 6496));
      }
    }
  };

  const handleAddUserMember = (uidStr: string) => {
    if (!uidStr) return;
    const uid = Number(uidStr);
    const u = allUsers.find(x => x.id === uid);
    if (!u) return;
    const displayName = formatUserDisplayName(u);
    setAssignedMemberNames(prev => prev.includes(displayName) ? prev : [...prev, displayName]);
    setSelectedRecipients(prev => prev.includes(uid) ? prev : [...prev, uid]);
    if (!newTaskAssigneeId) {
      setNewTaskAssigneeId(uid);
    }
    setMemberToAdd('');
  };

  const handleAddCustomMember = () => {
    const trimmed = customMemberInput.trim();
    if (!trimmed) return;
    setAssignedMemberNames(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    const matched = resolveTaskMemberUser(trimmed, allUsers);
    if (matched && !selectedRecipients.includes(matched.id)) {
      setSelectedRecipients(prev => [...prev, matched.id]);
      if (!newTaskAssigneeId) {
        setNewTaskAssigneeId(matched.id);
      }
    }
    setCustomMemberInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Dispatch Task Directive</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Select an official Fall 2026 task or type a custom directive. Immediately synchronized to the portal and audit log.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '4px 8px', fontSize: '1rem', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate>
          {/* 1. PRIMARY: Task Directive Preset Selection */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>📋 Select Task Directive</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
                {FALL_2026_TASK_ROSTER.length} Official Directives Available
              </span>
            </label>
            <select
              className="form-select"
              value={selectedTaskTemplate}
              onChange={(e) => handleSelectDirectiveTemplate(e.target.value)}
              style={{ fontSize: '0.92rem', height: '42px', fontWeight: 600 }}
            >
              <option value="">-- Choose a Task from Fall 2026 Allocation --</option>
              <option value="custom">✍️ Custom Task (Type New Title)</option>
              <optgroup label="📋 Fall 2026 Tasks Allocation">
                {FALL_2026_TASK_ROSTER.map((t) => (
                  <option key={t.title} value={t.title}>
                    📌 {t.title} ({t.members.length} member{t.members.length === 1 ? '' : 's'})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 2. Task Title / Directive Name */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Task Title / Directive Name</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>✍️ Edit or type custom title</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Midterm Exams Schedule & Examination Rosters"
              value={newTaskTitle}
              onChange={(e) => {
                setNewTaskTitle(e.target.value);
                if (selectedTaskTemplate !== 'custom' && selectedTaskTemplate !== e.target.value) {
                  setSelectedTaskTemplate('custom');
                }
              }}
              style={{ fontSize: '0.92rem', height: '40px' }}
            />
          </div>

          {/* 3. Assigned Members Roster - Shows ALL members (Roster + Added) */}
          <div className="form-group" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem' }}>
                👥 Assigned Members ({assignedMemberNames.length} Members)
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Click ✕ to remove any member, or use options below to add someone new
              </span>
            </div>

            {/* Badges container */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-inset)',
              border: '1px solid var(--border)',
              minHeight: '48px',
              alignItems: 'center',
            }}>
              {assignedMemberNames.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No members assigned yet. Pick a task directive above or add members below.
                </span>
              ) : (
                assignedMemberNames.map((mName, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.35)',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>👤 {mName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(mName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0 2px',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                      title={`Remove ${mName} from this task`}
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Add Member Controls (Dropdown + Custom Name Input) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              {/* Option A: Pick registered faculty member */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <select
                  className="form-select"
                  value={memberToAdd}
                  onChange={(e) => {
                    setMemberToAdd(e.target.value);
                    if (e.target.value) handleAddUserMember(e.target.value);
                  }}
                  style={{ fontSize: '0.82rem', height: '36px' }}
                >
                  <option value="">➕ Add faculty from staff directory...</option>
                  <optgroup label="👑 Faculty Leadership">
                    {leadershipUsers.filter(u => u.id !== 99).map(u => (
                      <option key={u.id} value={u.id}>👑 {u.full_name} ({u.title})</option>
                    ))}
                  </optgroup>
                  <optgroup label={`🏛️ Professors (${profUsers.length})`}>
                    {profUsers.map(u => (
                      <option key={u.id} value={u.id}>🏛️ {u.full_name} ({u.department})</option>
                    ))}
                  </optgroup>
                  <optgroup label={`🩺 Lecturers / Dr (${drUsers.length})`}>
                    {drUsers.map(u => (
                      <option key={u.id} value={u.id}>🩺 {u.full_name} ({u.department})</option>
                    ))}
                  </optgroup>
                  <optgroup label={`🧬 Lecturer Assistants (${laUsers.length})`}>
                    {laUsers.map(u => (
                      <option key={u.id} value={u.id}>🧬 {u.full_name} ({u.department})</option>
                    ))}
                  </optgroup>
                  <optgroup label={`📚 Teaching Assistants (${taUsers.length})`}>
                    {taUsers.map(u => (
                      <option key={u.id} value={u.id}>📚 {u.full_name} ({u.department})</option>
                    ))}
                  </optgroup>
                  <optgroup label={`🧪 Research Assistants (${raN112Users.length + prototypingRaUsers.length})`}>
                    {raN112Users.concat(prototypingRaUsers).map(u => (
                      <option key={u.id} value={u.id}>🔬 {u.full_name}</option>
                    ))}
                  </optgroup>
                  <optgroup label={`🏢 Academic Administration (${adminCadreUsers.length})`}>
                    {adminCadreUsers.map(u => (
                      <option key={u.id} value={u.id}>💼 {u.full_name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Option B: Type custom name */}
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Or type custom member name..."
                  value={customMemberInput}
                  onChange={(e) => setCustomMemberInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomMember();
                    }
                  }}
                  style={{ fontSize: '0.82rem', height: '36px', flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddCustomMember}
                  disabled={!customMemberInput.trim()}
                  style={{ padding: '0 10px', fontWeight: 700 }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* 4. Priority & Deadline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Priority Level</label>
              <select
                className="form-select"
                value={newTaskPriority}
                onChange={(e: any) => setNewTaskPriority(e.target.value)}
                style={{ height: '38px' }}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">🚨 Urgent (Immediate Attention)</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Deadline (Date)</label>
              <input
                type="date"
                className="form-input"
                value={newTaskDeadline ? newTaskDeadline.slice(0, 10) : ''}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                style={{ height: '38px' }}
              />
            </div>
          </div>

          {/* 5. Google Form Link (Optional) */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>📝 Google Form Link (Optional)</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Adds a direct &quot;Open Google Form&quot; button</span>
            </label>
            <input
              type="url"
              className="form-input"
              placeholder="https://docs.google.com/forms/d/e/.../viewform"
              value={newTaskGoogleFormUrl}
              onChange={(e) => setNewTaskGoogleFormUrl && setNewTaskGoogleFormUrl(e.target.value)}
              style={{ fontSize: '0.85rem', height: '38px' }}
            />
          </div>

          {/* 6. Task Instructions & Deliverables */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700 }}>Task Instructions & Deliverables</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Provide instructions for the faculty team..."
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          {/* 7. Document Attachment Zone */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <FileUploadZone
              label="Attach Document, Exam, or Evidence File (Optional)"
              hint="PDF, DOCX, XLSX, Images up to 25 MB"
              currentFile={
                newTaskAttachment
                  ? {
                      name: newTaskAttachment.name,
                      url: newTaskAttachment.url || newTaskAttachment.dataUrl || '',
                      size: newTaskAttachment.size,
                      type: newTaskAttachment.type,
                    }
                  : null
              }
              onFileUploaded={(uploaded) => {
                setNewTaskAttachment({
                  name: uploaded.name,
                  type: uploaded.type,
                  size: uploaded.size,
                  url: uploaded.url,
                  dataUrl: uploaded.url,
                });
              }}
              onFileRemoved={() => setNewTaskAttachment(null)}
            />
          </div>

          {/* 8. Formal Dean Approval Switch */}
          <div style={{ marginBottom: '16px', padding: '10px 12px', background: 'var(--bg-inset)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={requiresDeanApproval}
                onChange={(e) => setRequiresDeanApproval && setRequiresDeanApproval(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  Requires Formal Dean Approval & Decision
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                  {requiresDeanApproval
                    ? 'Dean Prof. Dr. Gehan Safwat must review and formally approve the submitted deliverable.'
                    : 'Delegated / Operational: Task lead can complete directly.'}
                </span>
              </div>
            </label>
          </div>

          {/* 9. Optional Advanced Targeting Collapsible (Committees / Department / Broadcast) */}
          <div style={{ marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{showAdvanced ? '▼ Hide Advanced Targeting Options' : '▶ Show Advanced Targeting Options (Department / Committee / Broadcast)'}</span>
            </button>

            {showAdvanced && (
              <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-inset)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {/* Mode Selector */}
                <div className="segmented-control" style={{ marginBottom: '12px' }}>
                  <button
                    type="button"
                    className={`segmented-btn ${dispatchMode === 'single' ? 'active' : ''}`}
                    onClick={() => setDispatchMode('single')}
                  >
                    <span>👤 Single</span>
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${dispatchMode === 'committee' ? 'active' : ''}`}
                    onClick={() => setDispatchMode('committee')}
                  >
                    <span>🏛️ Committee</span>
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${dispatchMode === 'department' ? 'active' : ''}`}
                    onClick={() => setDispatchMode('department')}
                  >
                    <span>🏢 Department</span>
                  </button>
                  <button
                    type="button"
                    className={`segmented-btn ${dispatchMode === 'all' ? 'active' : ''}`}
                    onClick={() => setDispatchMode('all')}
                  >
                    <span>🌐 Broadcast (All)</span>
                  </button>
                </div>

                {dispatchMode === 'committee' && (
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Target Standing Committee</label>
                    <select
                      className="form-select"
                      value={targetCommitteeId}
                      onChange={(e) => setTargetCommitteeId && setTargetCommitteeId(e.target.value ? Number(e.target.value) : '')}
                      style={{ fontSize: '0.84rem' }}
                    >
                      <option value="">-- Choose Standing Committee --</option>
                      {committees.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon || '🏛️'} {c.name} ({c.members?.length || 0} appointed members)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {dispatchMode === 'department' && (
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Target Department</label>
                    <select
                      className="form-select"
                      value={targetDept}
                      onChange={(e) => setTargetDept(e.target.value)}
                      style={{ fontSize: '0.84rem' }}
                    >
                      {facultyDepartments.map(d => (
                        <option key={d} value={d}>
                          {d} ({allUsers.filter(u => u.department === d && u.role !== 'dean').length} Staff)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
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
              disabled={isCreatingTask}
              style={{ fontWeight: 800, minWidth: '150px' }}
            >
              <Send size={16} />
              <span>{isCreatingTask ? 'Dispatching...' : 'Dispatch Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
