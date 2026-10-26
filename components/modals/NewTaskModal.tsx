'use client';

import React, { useState } from 'react';
import { Hat, User, FacultyCommittee } from '@/types';
import { Users2, Paperclip, FileText, Send, Sparkles } from 'lucide-react';
import { FALL_2026_CATEGORIES } from '@/lib/fall_2026_categories';
import { INSTITUTIONAL_PILLARS, PillarTaskTemplate } from '@/lib/pillar_catalog';
import { FileUploadZone } from '@/components/common/FileUploadZone';

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
  newTaskCategory = 'Schedules, Load & Faculty Board',
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
  const [selectedPillarCode, setSelectedPillarCode] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [committeeTaskChoice, setCommitteeTaskChoice] = useState<string>('');
  const [customCommitteeTask, setCustomCommitteeTask] = useState<string>('');

  const handleSelectTemplate = (template: PillarTaskTemplate) => {
    setNewTaskTitle(template.title);
    setNewTaskDescription(template.description);
    setNewTaskPriority(template.suggested_priority);
    const deadlineDate = new Date(Date.now() + (template.estimated_days || 7) * 86400000);
    const formattedDeadline = deadlineDate.toISOString().slice(0, 16);
    setNewTaskDeadline(formattedDeadline);
    if (dispatchMode === 'department' && template.suggested_department) {
      if (facultyDepartments.includes(template.suggested_department)) {
        setTargetDept(template.suggested_department);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Dispatch Task to Faculty Member</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Task will be immediately routed to the professor's individual portal and logged in the faculty audit trail.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ padding: '4px 8px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit}>
          {/* Dispatch Mode Selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Dispatch Target Mode</span>
              <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>
                {dispatchMode === 'single' ? 'Single Staff Member' :
                 
                 dispatchMode === 'selected' ? `${selectedRecipients.length} Staff Selected` :
                 dispatchMode === 'department' ? `Department: ${targetDept}` : 'All Faculty & Staff'}
              </span>
            </label>
            <div className="segmented-control" style={{ marginBottom: '14px' }}>
              <button
                type="button"
                className={`segmented-btn ${dispatchMode === 'single' ? 'active' : ''}`}
                onClick={() => setDispatchMode('single')}
              >
                <span>👤 Single</span>
              </button>
              <button
                type="button"
                className={`segmented-btn ${dispatchMode === 'selected' ? 'active' : ''}`}
                onClick={() => setDispatchMode('selected')}
              >
                <span>👥 Multiple ({selectedRecipients.length})</span>
              </button>
              <button
                type="button"
                className={`segmented-btn ${dispatchMode === 'department' ? 'active' : ''}`}
                onClick={() => setDispatchMode('department')}
              >
                <span>🏢 By Dept</span>
              </button>
              <button
                type="button"
                className={`segmented-btn ${dispatchMode === 'all' ? 'active' : ''}`}
                onClick={() => setDispatchMode('all')}
              >
                <span>🌐 Broadcast (All)</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Single Assignee */}
          {dispatchMode === 'single' && (
            <div className="form-group">
              <label className="form-label">Assign To Faculty Member *</label>
              <select
                className="form-select"
                value={newTaskAssigneeId}
                onChange={(e) => setNewTaskAssigneeId(Number(e.target.value))}
                required
              >
                <option value="">-- Choose Faculty Member --</option>
                <optgroup label="👑 Faculty Leadership">
                  {leadershipUsers.filter(u => u.id !== 99 && u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      👑 {u.full_name} — {u.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`🏛️ Professors & Assoc. Professors (${profUsers.length})`}>
                  {profUsers.filter(u => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      🏛️ {u.full_name} — {u.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`🩺 Lecturers (Dr.) (${drUsers.length})`}>
                  {drUsers.filter(u => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      🩺 {u.full_name} — {u.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`🧬 Lecturer Assistants (LA) (${laUsers.length})`}>
                  {laUsers.filter(u => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      🧬 {u.full_name} — {u.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`📚 Teaching Assistants (TA) (${taUsers.length})`}>
                  {taUsers.filter(u => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      📚 {u.full_name} — {u.title}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`🧪 RA N112 (${raN112Users.length})`}>
                  {raN112Users.filter(u => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      🔬 {u.full_name} (RA N112)
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`🔬 Prototyping RA (${prototypingRaUsers.length})`}>
                  {prototypingRaUsers.filter(u => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      🧪 {u.full_name} (Prototyping RA)
                    </option>
                  ))}
                </optgroup>
                <optgroup label={`🏢 Academic Administration (${adminCadreUsers.length})`}>
                  {adminCadreUsers.filter(u => u.id !== currentUser?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      💼 {u.full_name} — {u.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Mode: Committee Dispatch */}
          {dispatchMode === 'committee' && (
            <div className="form-group">
              <label className="form-label">Select Official Statutory Committee *</label>
              <select
                className="form-select"
                value={targetCommitteeId}
                onChange={(e) => setTargetCommitteeId && setTargetCommitteeId(e.target.value ? Number(e.target.value) : '')}
                required
              >
                <option value="">-- Choose Standing Committee --</option>
                {committees.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon || '🏛️'} {c.name} ({c.members?.length || 0} appointed members)
                  </option>
                ))}
              </select>

              {targetCommitteeId && (
                <div style={{ marginTop: '12px' }}>
                  {(() => {
                    const selComm = committees.find(c => c.id === Number(targetCommitteeId));
                    if (!selComm) return null;
                    return (
                      <div style={{
                        padding: '14px 16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderLeft: `4px solid ${selComm.color || '#3b82f6'}`,
                        borderRadius: '10px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            {selComm.icon || '🏛️'} {selComm.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--status-progress)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                            {selComm.members?.length || 0} Appointed Members
                          </span>
                        </div>
                        {selComm.decree_ref && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            <strong>Decree Ref:</strong> {selComm.decree_ref}
                          </div>
                        )}
                        {/* Statutory Committee Task Template or Custom Task Directive */}
                        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                          <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 800 }}>
                            Choose Committee Task Template or Type Custom Below
                          </label>
                          <select
                            className="form-select"
                            value={committeeTaskChoice}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCommitteeTaskChoice(val);
                              if (val && val !== 'custom') {
                                setNewTaskTitle(val);
                              } else if (val === 'custom') {
                                setNewTaskTitle(customCommitteeTask || `[${selComm.name}] `);
                              }
                            }}
                            style={{ fontSize: '0.9rem', minHeight: '40px' }}
                          >
                            <option value="">-- Choose Mandate or Pre-defined Committee Task --</option>
                            <option value="custom">✍️ Type Custom Task Directive...</option>
                            {selComm.mandates && selComm.mandates.length > 0 && (
                              <optgroup label="📋 Statutory Mandates of this Committee">
                                {selComm.mandates.map((m, idx) => (
                                  <option key={idx} value={`[${selComm.name}] ${m}`}>
                                    📌 {m}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="🏛️ Common Statutory Deliverables">
                              <option value={`[${selComm.name}] Prepare Official Committee Minutes of Meeting (MoM)`}>
                                📝 Prepare Official Committee Minutes of Meeting (MoM)
                              </option>
                              <option value={`[${selComm.name}] Accreditation Self-Study Dossier & Evidence Collection (NAQAAE)`}>
                                📑 Accreditation Self-Study Dossier & Evidence Collection (NAQAAE)
                              </option>
                              <option value={`[${selComm.name}] Semester Curriculum & Module Specifications Review`}>
                                📚 Semester Curriculum & Module Specifications Review
                              </option>
                              <option value={`[${selComm.name}] Student Appeals, Complaints & Grade Petitions Audit`}>
                                ⚖️ Student Appeals, Complaints & Grade Petitions Audit
                              </option>
                              <option value={`[${selComm.name}] Examination Moderation & Control Logistics Roster`}>
                                📋 Examination Moderation & Control Logistics Roster
                              </option>
                              <option value={`[${selComm.name}] Laboratory Equipment & Biosafety Compliance Report`}>
                                🧪 Laboratory Equipment & Biosafety Compliance Report
                              </option>
                              <option value={`[${selComm.name}] Postgraduate Theses Defense & Research Progress Follow-Up`}>
                                🎓 Postgraduate Theses Defense & Research Progress Follow-Up
                              </option>
                            </optgroup>
                          </select>
                          {committeeTaskChoice === 'custom' && (
                            <div style={{ marginTop: '10px', marginBottom: '8px' }}>
                              <label className="form-label" style={{ fontSize: '0.86rem', fontWeight: 800 }}>
                                Type Custom Committee Task Directive *
                              </label>
                              <input
                                type="text"
                                className="form-input"
                                placeholder={`e.g. [${selComm.name}] Comprehensive Spring Audit & Action Plan`}
                                value={customCommitteeTask}
                                onChange={(e) => {
                                  setCustomCommitteeTask(e.target.value);
                                  setNewTaskTitle(e.target.value);
                                }}
                                required
                                style={{ fontSize: '0.92rem', minHeight: '42px' }}
                              />
                            </div>
                          )}
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                            💡 Choose an official mandate preset or select &quot;Type Custom Task Directive&quot; to write your own specific task.
                          </span>
                        </div>

                        {/* Task Owner / Lead Selector */}
                        <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                          <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 800 }}>
                            Designated Task Lead / Owner (Defaults to Chair)
                          </label>
                          <select
                            className="form-select"
                            value={taskOwnerId || selComm.chair_id}
                            onChange={(e) => setTaskOwnerId && setTaskOwnerId(e.target.value ? Number(e.target.value) : '')}
                            style={{ fontSize: '0.85rem' }}
                          >
                            <option value={selComm.chair_id}>👑 Committee Chair: {selComm.chair_name} ({selComm.chair_title})</option>
                            {selComm.rapporteur_id && selComm.rapporteur_id !== selComm.chair_id && (
                              <option value={selComm.rapporteur_id}>📝 Rapporteur: {selComm.rapporteur_name} ({selComm.rapporteur_title})</option>
                            )}
                            {selComm.members?.filter(m => m.user_id !== selComm.chair_id && m.user_id !== selComm.rapporteur_id).map(m => (
                              <option key={m.user_id} value={m.user_id}>👤 Member: {m.title} {m.name} ({m.role})</option>
                            ))}
                            {currentUser && (
                              <option value={currentUser.id}>⭐ Retain Direct Ownership ({currentUser.title} {currentUser.full_name})</option>
                            )}
                          </select>
                        </div>

                        {/* Responsibility Model Selector */}
                        <div style={{ marginBottom: '12px' }}>
                          <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 800 }}>
                            Responsibility & Deliverable Model
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <label style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: responsibilityModel === 'shared_deliverable' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-inset)',
                              border: responsibilityModel === 'shared_deliverable' ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                              cursor: 'pointer'
                            }}>
                              <input
                                type="radio"
                                name="commRespModel"
                                checked={responsibilityModel === 'shared_deliverable'}
                                onChange={() => setResponsibilityModel && setResponsibilityModel('shared_deliverable')}
                                style={{ marginTop: '3px' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>One Shared Deliverable</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Team submits 1 joint report</div>
                              </div>
                            </label>

                            <label style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '8px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              background: responsibilityModel === 'individual_submissions' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-inset)',
                              border: responsibilityModel === 'individual_submissions' ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                              cursor: 'pointer'
                            }}>
                              <input
                                type="radio"
                                name="commRespModel"
                                checked={responsibilityModel === 'individual_submissions'}
                                onChange={() => setResponsibilityModel && setResponsibilityModel('individual_submissions')}
                                style={{ marginTop: '3px' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>Separate Submissions</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Each member submits their own piece</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase' }}>
                          Task will be dispatched to committee members:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                          {selComm.members && selComm.members.length > 0 ? (
                            selComm.members.map(m => (
                              <span key={m.user_id} style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: 'var(--bg-inset)',
                                border: '1px solid var(--border)'
                              }}>
                                <span>👤</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{m.title || ''} {m.name}</span>
                                <span style={{ color: 'var(--accent-blue)', fontSize: '0.7rem' }}>({m.role})</span>
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--status-overdue)' }}>No members appointed in this committee yet.</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Multi-Select Staff Members */}
          {dispatchMode === 'selected' && (
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Select Faculty Recipients *</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="chip-filter active-prof"
                    onClick={() => setSelectedRecipients(profUsers.map(u => u.id))}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    🏛️ Prof ({profUsers.length})
                  </button>
                  <button
                    type="button"
                    className="chip-filter active-dr"
                    onClick={() => setSelectedRecipients(drUsers.map(u => u.id))}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    🩺 Dr ({drUsers.length})
                  </button>
                  <button
                    type="button"
                    className="chip-filter active-la"
                    onClick={() => setSelectedRecipients(laUsers.map(u => u.id))}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    🧬 LA ({laUsers.length})
                  </button>
                  <button
                    type="button"
                    className="chip-filter active-ta"
                    onClick={() => setSelectedRecipients(taUsers.map(u => u.id))}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    📚 TA ({taUsers.length})
                  </button>
                  <button
                    type="button"
                    className="chip-filter active-ra-n112"
                    onClick={() => setSelectedRecipients(raN112Users.map(u => u.id))}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    🧪 RA N112
                  </button>
                  <button
                    type="button"
                    className="chip-filter active-proto-ra"
                    onClick={() => setSelectedRecipients(prototypingRaUsers.map(u => u.id))}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    🔬 Prototyping RA
                  </button>
                  <button
                    type="button"
                    className="chip-filter active-admin"
                    onClick={() => setSelectedRecipients(adminCadreUsers.map(u => u.id))}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    🏢 Admin
                  </button>
                  <button
                    type="button"
                    className="chip-filter active"
                    onClick={() => setSelectedRecipients(baseUsers.filter(u => u.id !== 99 && u.id !== currentUser?.id).map(u => u.id))}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    All ({baseUsers.filter(u => u.id !== 99 && u.id !== currentUser?.id).length})
                  </button>
                  <button
                    type="button"
                    className="chip-filter"
                    onClick={() => setSelectedRecipients([])}
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <input
                type="text"
                className="form-input"
                placeholder="Search staff by name or department..."
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                style={{ height: '34px', fontSize: '0.8rem', marginBottom: '10px' }}
              />

              <div style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px',
                background: 'var(--bg-inset)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {baseUsers
                  .filter(u => u.id !== 99 && u.id !== currentUser?.id)
                  .filter(u => !recipientSearch || u.full_name.toLowerCase().includes(recipientSearch.toLowerCase()) || u.department.toLowerCase().includes(recipientSearch.toLowerCase()))
                  .map((u) => {
                    const isSelected = selectedRecipients.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                          border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="checkbox"
                            className="custom-checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedRecipients(prev =>
                                prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                              );
                            }}
                          />
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={u.full_name}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                              {u.title} {u.full_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {u.department}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.675rem',
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--bg-inset)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)'
                        }}>
                          {u.role}
                        </span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Mode 4: By Department */}
          {dispatchMode === 'department' && (
            <div className="form-group">
              <label className="form-label">Target Academic Department *</label>
              <select
                className="form-select"
                value={targetDept}
                onChange={(e) => setTargetDept(e.target.value)}
                required
              >
                {facultyDepartments.map(d => (
                  <option key={d} value={d}>
                    {d} ({allUsers.filter(u => u.department === d && u.role !== 'dean').length} Staff)
                  </option>
                ))}
              </select>

              <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Faculty in this department who will receive this task:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {allUsers
                    .filter(u => u.department === targetDept && u.role !== 'dean')
                    .map(u => (
                      <span
                        key={u.id}
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#93c5fd',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}
                      >
                        👤 {u.full_name} ({u.title})
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Mode 5: Broadcast to Entire Faculty */}
          {dispatchMode === 'all' && (
            <div style={{
              padding: '14px',
              background: 'rgba(37, 99, 235, 0.12)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                <Users2 size={16} />
                <span>Faculty-Wide Broadcast Dispatch</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                This task will be automatically distributed to <strong>{allUsers.filter(u => u.role !== 'dean').length} faculty and staff members</strong> across all Biotechnology departments. Individual compliance and audit entries will be created for each person.
              </p>
            </div>
          )}

          {/* Official Academic Category (Fall 2026 Allocation) */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Academic Task Category *</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-blue)', fontWeight: 700 }}>16 Official Fall 2026 Categories</span>
            </label>
            <select
              className="form-select"
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory && setNewTaskCategory(e.target.value)}
              style={{ fontSize: '0.86rem', height: '38px' }}
            >
              {FALL_2026_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  📂 {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Task Title (Custom Directives Supported) */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Task Title / Directive *</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>✍️ Type any custom task title freely</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Midterm Exams Schedule & Examination Rosters"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              style={{ fontSize: '0.92rem', height: '40px' }}
            />
          </div>

          {/* Google Form Link (Optional) */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

          {/* Priority & Deadline Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                className="form-select"
                value={newTaskPriority}
                onChange={(e: any) => setNewTaskPriority(e.target.value)}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">🚨 Urgent (Immediate Attention)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Deadline (Date & Time) *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label">Task Instructions & Deliverables *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Provide precise requirements for the faculty. Mention expected documents, evaluation criteria, or specific committee guidelines..."
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              required
            />
          </div>

          {/* Document & Binary Evidence Upload Zone */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <FileUploadZone
              label="Attach Document, Exam, or Evidence File (Drag & Drop)"
              hint="PDF, DOCX, XLSX, PPTX, Images up to 25 MB. Automatically stored in faculty repository."
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

          {/* Formal Dean Approval Requirement Switch */}
          <div style={{ marginTop: '16px', padding: '12px 14px', background: 'var(--bg-inset)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={requiresDeanApproval}
                onChange={(e) => setRequiresDeanApproval && setRequiresDeanApproval(e.target.checked)}
                style={{ width: '17px', height: '17px', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  Requires Formal Dean Approval & Decision
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                  {requiresDeanApproval
                    ? 'Official Accreditation, Exam, or Council deliverable. Dean Prof. Dr. Gehan Safwat must review and approve/provide feedback.'
                    : 'Delegated / Operational: Task Owner or Committee Chair can sign off and finalize directly.'}
                </span>
              </div>
            </label>
          </div>

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
              disabled={isCreatingTask}
            >
              <Send size={16} />
              <span>
                {isCreatingTask ? 'Dispatching...' :
                 dispatchMode === 'single' ? 'Dispatch Task' :
                 dispatchMode === 'selected' ? `Bulk Dispatch to ${selectedRecipients.length} Faculty` :
                 dispatchMode === 'department' ? `Bulk Dispatch to ${targetDept}` :
                 `Broadcast to All Faculty (${allUsers.filter(u => u.role !== 'dean').length})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
