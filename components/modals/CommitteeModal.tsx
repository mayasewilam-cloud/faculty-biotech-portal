'use client';

import React, { useState, useEffect } from 'react';
import { FacultyCommittee, User } from '@/types';
import { X, Building2, Shield, Plus, Trash2 } from 'lucide-react';

interface CommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  committee: FacultyCommittee | null;
  currentUser: User | null;
  onSave: (data: Partial<FacultyCommittee>) => Promise<void>;
  onDelete?: (committeeId: number, committeeName: string) => void;
}

export const CommitteeModal: React.FC<CommitteeModalProps> = ({
  isOpen,
  onClose,
  committee,
  currentUser,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'statutory' | 'standing' | 'council'>('standing');
  const [decreeRef, setDecreeRef] = useState('');
  const [chairName, setChairName] = useState('');
  const [chairTitle, setChairTitle] = useState('');
  const [rapporteurName, setRapporteurName] = useState('');
  const [rapporteurTitle, setRapporteurTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mandatesText, setMandatesText] = useState('');
  const [pillarCode, setPillarCode] = useState('A');
  const [pillarName, setPillarName] = useState('Planning & Governance');
  const [icon, setIcon] = useState('🏛️');
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (committee) {
      setName(committee.name);
      setNameAr(committee.name_ar || '');
      setCode(committee.code);
      setCategory(committee.category || 'standing');
      setDecreeRef(committee.decree_ref || '');
      setChairName(committee.chair_name || '');
      setChairTitle(committee.chair_title || '');
      setRapporteurName(committee.rapporteur_name || '');
      setRapporteurTitle(committee.rapporteur_title || '');
      setDescription(committee.description || '');
      setMandatesText((committee.mandates || []).join('\n'));
      setPillarCode(committee.pillar_code || 'A');
      setPillarName(committee.pillar_name || 'Academic Governance');
      setIcon(committee.icon || '🏛️');
      setColor(committee.color || '#3b82f6');
    } else {
      setName('');
      setNameAr('');
      setCode('');
      setCategory('standing');
      setDecreeRef('Faculty Council Decree - Statutory Academic Mandate');
      setChairName(currentUser?.full_name || 'Prof. Dr. Gehan Safwat');
      setChairTitle(currentUser?.title || 'Dean of Faculty');
      setRapporteurName('Prof. Dr. Amr Ageez');
      setRapporteurTitle('Vice Dean for Academic Affairs');
      setDescription('');
      setMandatesText('');
      setPillarCode('E');
      setPillarName('Quality Assurance & Academic Governance');
      setIcon('🏛️');
      setColor('#3b82f6');
    }
  }, [committee, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert('Committee name and code are required');
      return;
    }

    const mandates = mandatesText
      .split('\n')
      .map(m => m.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        name_ar: nameAr.trim(),
        code: code.trim().toUpperCase(),
        category,
        decree_ref: decreeRef.trim(),
        chair_name: chairName.trim(),
        chair_title: chairTitle.trim(),
        rapporteur_name: rapporteurName.trim(),
        rapporteur_title: rapporteurTitle.trim(),
        description: description.trim(),
        mandates,
        pillar_code: pillarCode,
        pillar_name: pillarName,
        icon,
        color,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save committee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 9, 20, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '94%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          borderRadius: '18px',
          border: '1.5px solid var(--border)',
          backgroundColor: 'var(--bg-secondary, #ffffff)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
          color: 'var(--text-main)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>{icon}</span>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {committee ? 'Edit Official Faculty Committee' : 'Create Official Faculty Committee'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Official statutory governance body of the Faculty of Biotechnology
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Row 1: Code, Category, Icon, Color */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 70px 70px', gap: '12px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.785rem' }}>Code (e.g. QAAC)</label>
              <input
                type="text"
                className="form-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="QAAC"
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.785rem' }}>Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="standing">Standing Committee (دائمة)</option>
                <option value="statutory">Statutory Board (مجلس/لجنة نظامية)</option>
                <option value="council">Faculty Council (مجلس)</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.785rem' }}>Icon</label>
              <input
                type="text"
                className="form-input"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                style={{ textAlign: 'center' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.785rem' }}>Color</label>
              <input
                type="color"
                className="form-input"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ padding: '2px', height: '38px', cursor: 'pointer' }}
              />
            </div>
          </div>

          {/* Row 2: English Name */}
          <div>
            <label className="form-label" style={{ fontSize: '0.785rem' }}>Official Committee Name (English) *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Accreditation & Quality Assurance Standing Committee"
              required
            />
          </div>

          {/* Row 3: Arabic Name */}
          <div>
            <label className="form-label" style={{ fontSize: '0.785rem' }}>Official Committee Name (Arabic)</label>
            <input
              type="text"
              className="form-input"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="لجنة الجودة والاعتماد الأكاديمي الدائمة"
              dir="rtl"
            />
          </div>

          {/* Row 4: Legal Decree Reference */}
          <div>
            <label className="form-label" style={{ fontSize: '0.785rem' }}>Faculty Council Decree / Bylaw Reference</label>
            <input
              type="text"
              className="form-input"
              value={decreeRef}
              onChange={(e) => setDecreeRef(e.target.value)}
              placeholder="Faculty Council Decree #104 - Statutory NAQAAE Mandate"
            />
          </div>

          {/* Row 5: Chair & Rapporteur */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.785rem' }}>Committee Chair Name</label>
              <input
                type="text"
                className="form-input"
                value={chairName}
                onChange={(e) => setChairName(e.target.value)}
                placeholder="Prof. Dr. Gehan Safwat"
              />
              <input
                type="text"
                className="form-input"
                value={chairTitle}
                onChange={(e) => setChairTitle(e.target.value)}
                placeholder="Dean of Faculty"
                style={{ marginTop: '6px', fontSize: '0.8rem' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.785rem' }}>Rapporteur Name</label>
              <input
                type="text"
                className="form-input"
                value={rapporteurName}
                onChange={(e) => setRapporteurName(e.target.value)}
                placeholder="Prof. Dr. Amr Ageez"
              />
              <input
                type="text"
                className="form-input"
                value={rapporteurTitle}
                onChange={(e) => setRapporteurTitle(e.target.value)}
                placeholder="Vice Dean for Academic Affairs"
                style={{ marginTop: '6px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          {/* Row 6: Description */}
          <div>
            <label className="form-label" style={{ fontSize: '0.785rem' }}>Institutional Mandate & Mission Overview</label>
            <textarea
              className="form-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the official mission, governance role, and institutional responsibilities of this committee..."
            />
          </div>

          {/* Row 7: Statutory Mandates (one per line) */}
          <div>
            <label className="form-label" style={{ fontSize: '0.785rem' }}>
              Statutory Mandates & Specific Responsibilities (one per line)
            </label>
            <textarea
              className="form-input"
              rows={4}
              value={mandatesText}
              onChange={(e) => setMandatesText(e.target.value)}
              placeholder="Course Learning Outcome (CLO) & PLO mapping&#10;Annual Institutional Self-Study Dossier compilation&#10;Quality audit on examination blueprints"
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: committee && onDelete ? 'space-between' : 'flex-end', gap: '12px', marginTop: '12px' }}>
            {committee && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(committee.id, committee.name);
                  onClose();
                }}
                disabled={isSubmitting}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#ef4444',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={15} />
                <span>Delete Committee</span>
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  padding: '10px 22px',
                  fontWeight: 700,
                }}
              >
                {isSubmitting ? 'Saving...' : committee ? 'Update Committee' : 'Create Committee'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
