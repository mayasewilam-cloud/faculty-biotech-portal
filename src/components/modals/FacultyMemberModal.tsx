'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { X, UserCheck, Shield, Phone, Mail, Building, Award, Key } from 'lucide-react';

interface FacultyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: User | null;
  onSave: (data: any) => Promise<void>;
  facultyDepartments: string[];
}

export const FacultyMemberModal: React.FC<FacultyMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onSave,
  facultyDepartments,
}) => {
  const isEdit = !!member;

  const [title, setTitle] = useState('Prof. Dr.');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('faculty123');
  const [role, setRole] = useState<'professor' | 'staff' | 'dept_head' | 'vice_dean' | 'dean' | 'admin'>('staff');
  const [department, setDepartment] = useState('Academic Staff');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'on_leave' | 'sabbatical'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) {
      setTitle(member.title || 'Dr.');
      setFullName(member.full_name || '');
      setEmail(member.email || '');
      setPassword(''); // Blank means do not change password
      setRole((member.role as any) || 'staff');
      setDepartment(member.department || 'Academic Staff');
      setPhone(member.phone || '');
      setStatus((member.status as any) || 'active');
      setError(null);
    } else {
      setTitle('Prof. Dr.');
      setFullName('');
      setEmail('');
      setPassword('faculty123');
      setRole('staff');
      setDepartment('Academic Staff');
      setPhone('');
      setStatus('active');
      setError(null);
    }
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required.');
      return;
    }
    if (!isEdit && !password.trim()) {
      setError('Password is required for new accounts.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: any = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        title,
        role,
        department,
        phone: phone.trim(),
        status,
      };

      if (isEdit) {
        payload.id = member.id;
        if (password.trim()) {
          payload.password = password.trim();
        }
      } else {
        payload.password = password.trim();
      }

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save faculty member profile.');
    } finally {
      setIsSubmitting(false);
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
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
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
            background: 'var(--bg-card-hover)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {isEdit ? 'Edit Faculty Member Profile' : 'Register New Faculty Member'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                {isEdit
                  ? `Update academic title, department cadre, role, or credentials for ID #${member.id}`
                  : 'Enroll a new professor, doctor, assistant, or administrator into the faculty portal.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}
            >
              {error}
            </div>
          )}

          {/* Row 1: Academic Title & Full Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                Academic Title *
              </label>
              <select
                className="form-select"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', height: '40px' }}
              >
                <option value="Prof. Dr.">Prof. Dr.</option>
                <option value="Assoc. Prof. Dr.">Assoc. Prof. Dr.</option>
                <option value="Dr.">Dr.</option>
                <option value="Lecturer Dr.">Lecturer Dr.</option>
                <option value="LA">LA (Lecturer Assistant)</option>
                <option value="TA">TA (Teaching Assistant)</option>
                <option value="RA">RA (Research Assistant)</option>
                <option value="Eng.">Eng.</option>
                <option value="Ms.">Ms.</option>
                <option value="Mr.">Mr.</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Gehan Safwat or Amr Ageez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: '100%', height: '40px' }}
              />
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                University Email Address *
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="name@msa.edu.eg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', height: '40px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                Mobile / Extension
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +20 100 123 4567 or Ext. 2104"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', height: '40px' }}
              />
            </div>
          </div>

          {/* Row 3: Role & Cadre Department */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                System Access Role *
              </label>
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{ width: '100%', height: '40px' }}
              >
                <option value="staff">Staff Member / Teaching / Research</option>
                <option value="professor">Professor / Senior Faculty</option>
                <option value="dept_head">Department Head</option>
                <option value="vice_dean">Vice Dean</option>
                <option value="dean">Dean of Faculty</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                Department / Program Cadre *
              </label>
              <select
                className="form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%', height: '40px' }}
              >
                {facultyDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value="Biotechnology Academic Staff">Biotechnology Academic Staff</option>
                <option value="N112 Research Team">N112 Research Team</option>
                <option value="Prototyping Laboratory">Prototyping Laboratory</option>
                <option value="Administrative Staff">Administrative Staff</option>
                <option value="Dean Office">Dean Office</option>
              </select>
            </div>
          </div>

          {/* Row 4: Password & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                {isEdit ? 'Reset Password (leave empty to keep current)' : 'Account Password *'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={isEdit ? 'Unchanged' : 'Default: faculty123'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', height: '40px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                Academic Employment Status
              </label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                style={{ width: '100%', height: '40px' }}
              >
                <option value="active">Active On Duty</option>
                <option value="on_leave">On Official Leave</option>
                <option value="sabbatical">Sabbatical / Scientific Mission</option>
              </select>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderColor: '#6366f1',
                padding: '10px 24px',
                fontWeight: 700,
              }}
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Save Member Changes' : 'Register Faculty Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
