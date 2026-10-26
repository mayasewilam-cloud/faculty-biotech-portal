'use client';

import React, { useState } from 'react';
import { Task, Hat } from '@/types';
import { AccreditationPillarsDossier } from '@/components/reports/AccreditationPillarsDossier';
import { AccreditationRadarChart } from '@/components/reports/AccreditationRadarChart';
import { exportAccreditationEvidencePack } from '@/lib/exportEvidencePack';
import { X, Printer, Award, Download, FileText, Compass } from 'lucide-react';

interface AccreditationExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  hats?: Hat[];
}

export const AccreditationExportModal: React.FC<AccreditationExportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  hats = [],
}) => {
  const [modalView, setModalView] = useState<'dossier' | 'radar'>('dossier');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
          maxWidth: '960px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="no-print"
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
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
              <Award size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Faculty Comprehensive Academic Quality & Performance Review
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Dean&apos;s Comprehensive Institutional Governance & Performance Review
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Switcher */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '3px' }}>
              <button
                type="button"
                onClick={() => setModalView('dossier')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: modalView === 'dossier' ? '#2563eb' : 'transparent',
                  color: modalView === 'dossier' ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <FileText size={13} />
                <span>Review Report</span>
              </button>
              <button
                type="button"
                onClick={() => setModalView('radar')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: modalView === 'radar' ? '#2563eb' : 'transparent',
                  color: modalView === 'radar' ? '#ffffff' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Compass size={13} />
                <span>Compliance Radar</span>
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => exportAccreditationEvidencePack(tasks, hats)}
              style={{
                fontSize: '0.8rem',
                padding: '7px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}
              title="Download structured Accreditation Evidence Pack as CSV spreadsheet"
            >
              <Download size={15} />
              <span>Export Evidence (CSV)</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.print()}
              style={{
                fontSize: '0.8rem',
                padding: '7px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#2563eb',
              }}
              title="Print or Save to PDF"
            >
              <Printer size={15} />
              <span>Print / Save as PDF</span>
            </button>
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Container */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: modalView === 'dossier' ? '#0b1120' : '#090d16',
          }}
        >
          {modalView === 'dossier' ? (
            <AccreditationPillarsDossier tasks={tasks} hats={hats} />
          ) : (
            <AccreditationRadarChart tasks={tasks} hats={hats} />
          )}
        </div>

        {/* Footer */}
        <div
          className="no-print"
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-inset)',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Office of the Dean • Continuous Quality Assurance and Institutional Accreditation
          </span>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 18px', fontWeight: 700 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
