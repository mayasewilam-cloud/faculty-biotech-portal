'use client';

import React, { useState, useEffect } from 'react';
import { Task, User, Hat } from '@/types';
import { Mail, Send, CheckCircle2, Copy, X, FileText, AlertCircle, Building2 } from 'lucide-react';

interface EmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  users: User[];
  hats?: Hat[];
  currentUser: User | null;
  onDispatchSuccess?: () => void;
}

export const EmailDispatchModal: React.FC<EmailDispatchModalProps> = ({
  isOpen,
  onClose,
  task,
  users,
  hats = [],
  currentUser,
  onDispatchSuccess,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [templateType, setTemplateType] = useState<'directive' | 'sign_off' | 'exam' | 'mom'>('directive');
  const [customInstructions, setCustomInstructions] = useState('');
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (task) {
      const assignee = users.find((u) => u.id === task.assigned_to_id);
      const email = task.assignee_email || assignee?.email || 'faculty.member@msa.edu.eg';
      const name = task.assignee_name || assignee?.full_name || 'Faculty Member';
      setRecipientEmail(email);
      setRecipientName(name);

      if (templateType === 'directive') {
        setSubject(`[MSA BIO] Academic Directive: ${task.title}`);
        setCustomInstructions(
          `Please ensure the deliverables for task #${task.id} ("${task.title}") are submitted through the portal prior to the deadline on ${
            task.deadline ? new Date(task.deadline).toLocaleDateString('en-GB') : 'the scheduled date'
          }. Priority: ${(task.priority || 'medium').toUpperCase()}.`
        );
      } else if (templateType === 'sign_off') {
        setSubject(`[MSA BIO] Dean Official Sign-Off: ${task.title}`);
        setCustomInstructions(
          `The Office of the Dean has reviewed and officially signed off on your completed submission for task #${task.id} ("${task.title}"). This item has been archived in the NAQAAE Continuous Quality Assurance Dossier.`
        );
      } else if (templateType === 'exam') {
        setSubject(`[MSA BIO] Examination & Invigilation Notice: ${task.title}`);
        setCustomInstructions(
          `This is an official invigilation mandate regarding the upcoming practical / final examinations. Please report to the examination control room 30 minutes prior to scheduled station setup.`
        );
      } else if (templateType === 'mom') {
        setSubject(`[MSA BIO] Council Action Item: ${task.title}`);
        setCustomInstructions(
          `Per the ratified Minutes of Meeting (MoM), this action item has been assigned to your committee portfolio for formal implementation and reporting.`
        );
      }
    } else {
      setSubject('[MSA BIO] Executive Academic Directive');
      setCustomInstructions('Please review the attached academic instructions and take necessary action.');
    }
  }, [task, templateType, users]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !subject) return;

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const res = await fetch('/api/dispatch/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task?.id,
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          subject,
          content: customInstructions,
          email_type: templateType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch email');

      setStatusMessage({ type: 'success', text: `Email directive simulated and logged: ${data.message}` });
      if (onDispatchSuccess) onDispatchSuccess();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Dispatch failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEmailText = () => {
    const textToCopy = `To: ${recipientName} <${recipientEmail}>
Subject: ${subject}
From: Office of the Dean, Faculty of Biotechnology <gehan.safwat@msa.edu.eg>

--------------------------------------------------
MODERN SCIENCES AND ARTS UNIVERSITY (MSA)
FACULTY OF BIOTECHNOLOGY - DEAN'S EXECUTIVE OFFICE
--------------------------------------------------

Dear ${recipientName},

${customInstructions}

Task ID: #${task?.id || 'N/A'}
Priority: ${(task?.priority || 'medium').toUpperCase()}
Deadline: ${task?.deadline ? new Date(task.deadline).toLocaleDateString('en-GB') : 'Open'}
Department: ${task?.department || 'Biotechnology'}

Portal Access: ${typeof window !== 'undefined' ? window.location.origin : 'https://portal.msa.edu.eg'}

Prof. Dr. Gehan Safwat
Dean, Faculty of Biotechnology
Modern Sciences and Arts University (MSA)
`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1250,
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
          maxWidth: '680px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
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
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <Mail size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Academic Email Directive Dispatcher
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Official University Communications Gateway & Audit Logging
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('compose')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'compose' ? '#2563eb' : 'transparent',
                  color: activeTab === 'compose' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                Compose
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === 'preview' ? '#2563eb' : 'transparent',
                  color: activeTab === 'preview' ? '#ffffff' : 'var(--text-secondary)',
                }}
              >
                Letterhead Preview
              </button>
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
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            style={{
              margin: '16px 24px 0',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: statusMessage.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: statusMessage.type === 'success' ? '#6ee7b7' : '#fca5a5',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Content Tabs */}
        {activeTab === 'compose' ? (
          <form onSubmit={handleSend} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Template Chooser */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Communication Template Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {[
                  { key: 'directive', label: 'Mandate / Directive', desc: 'Task Assignment' },
                  { key: 'sign_off', label: 'Dean Sign-Off', desc: 'Verification Notice' },
                  { key: 'exam', label: 'Exam / Invigilation', desc: 'Proctoring Schedule' },
                  { key: 'mom', label: 'Council Action Item', desc: 'MoM Follow-Up' },
                ].map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => setTemplateType(tpl.key as any)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: templateType === tpl.key ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: templateType === tpl.key ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: templateType === tpl.key ? '#60a5fa' : 'var(--text-main)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{tpl.label}</div>
                    <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>{tpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Recipient Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Recipient Email *
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Subject */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Subject Line *
              </label>
              <input
                type="text"
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Custom Instructions */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Executive Directives & Body Text *
              </label>
              <textarea
                className="form-textarea"
                rows={5}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyEmailText}
                style={{ gap: '6px' }}
              >
                {copied ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Email Text'}</span>
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ background: '#2563eb', gap: '6px' }}
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Email Directive'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Official Letterhead Preview Tab */
          <div style={{ padding: '24px', backgroundColor: '#090d16', flex: 1, overflowY: 'auto' }}>
            <div
              style={{
                backgroundColor: '#ffffff',
                color: '#0f172a',
                borderRadius: '8px',
                padding: '30px',
                maxWidth: '600px',
                margin: '0 auto',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              }}
            >
              {/* MSA Header */}
              <div style={{ borderBottom: '2px solid #1e3a8a', paddingBottom: '14px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '0.04em' }}>
                    MODERN SCIENCES AND ARTS UNIVERSITY
                  </h4>
                  <h5 style={{ margin: '2px 0 0', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                    FACULTY OF BIOTECHNOLOGY • DEAN&apos;S OFFICE
                  </h5>
                </div>
                <img src="/logos/msa-university.jpeg" alt="MSA" style={{ height: '36px', width: 'auto' }} />
              </div>

              {/* Metadata */}
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.6 }}>
                <div><strong>To:</strong> {recipientName} &lt;{recipientEmail}&gt;</div>
                <div><strong>From:</strong> Office of the Dean &lt;gehan.safwat@msa.edu.eg&gt;</div>
                <div><strong>Date:</strong> {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <div><strong>Subject:</strong> {subject}</div>
              </div>

              {/* Body */}
              <div style={{ fontSize: '0.85rem', color: '#1e293b', lineHeight: 1.6, marginBottom: '20px' }}>
                <p>Dear {recipientName},</p>
                <p>{customInstructions}</p>
                {task && (
                  <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #2563eb', padding: '10px 14px', margin: '14px 0', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 700, color: '#1e3a8a' }}>Task Mandate: #{task.id} - {task.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      Priority: {(task.priority || 'medium').toUpperCase()} • Department: {task.department || 'Biotechnology'} • Deadline: {task.deadline ? new Date(task.deadline).toLocaleDateString('en-GB') : 'Open'}
                    </div>
                  </div>
                )}
                <p>For official documentation and deliverable upload, please access the faculty portal directly.</p>
              </div>

              {/* Sign-Off */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', fontSize: '0.8rem', color: '#334155' }}>
                <strong>Prof. Dr. Gehan Safwat</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Dean, Faculty of Biotechnology</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Modern Sciences and Arts University (MSA)</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyEmailText}
                style={{ gap: '6px' }}
              >
                {copied ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSend}
                disabled={isSubmitting}
                style={{ background: '#2563eb', gap: '6px' }}
              >
                <Send size={14} />
                <span>Dispatch Directive</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
