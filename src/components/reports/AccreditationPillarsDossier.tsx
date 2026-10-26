'use client';

import React from 'react';
import { Task, Hat } from '@/types';
import { INSTITUTIONAL_PILLARS } from '@/lib/pillar_catalog';
import { Printer, ShieldCheck, CheckCircle2, AlertCircle, Clock, Award, Building2, Layers } from 'lucide-react';

interface AccreditationPillarsDossierProps {
  tasks: Task[];
  hats?: Hat[];
}

export const AccreditationPillarsDossier: React.FC<AccreditationPillarsDossierProps> = ({
  tasks,
  hats = [],
}) => {
  const refCode = `MSA-BIO-ACCRED-2026-NAQAAE-DOSS`;
  const currentDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate stats for each pillar
  const pillarStats = INSTITUTIONAL_PILLARS.map((pillar) => {
    const taskTitles = pillar.tasks.map((t) => t.title.toLowerCase());
    const matchedTasks = tasks.filter((t) => {
      if (t.pillar_code && t.pillar_code.toUpperCase() === pillar.code) return true;
      const titleLower = (t.title || '').toLowerCase();
      const descLower = (t.description || '').toLowerCase();
      return taskTitles.some((templateTitle) => titleLower.includes(templateTitle) || descLower.includes(templateTitle));
    });

    const total = matchedTasks.length;
    const completed = matchedTasks.filter((t) => t.status === 'done').length;
    const inProgress = matchedTasks.filter((t) => t.status === 'in_progress').length;
    const pending = matchedTasks.filter((t) => t.status === 'pending').length;
    const overdue = matchedTasks.filter((t) => {
      if (t.status === 'done' || !t.deadline) return false;
      return new Date(t.deadline) < new Date();
    }).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    // Find committees matching this pillar
    const matchedHats = hats.filter(
      (h) =>
        (h.pillar_code && h.pillar_code.toUpperCase() === pillar.code) ||
        (h.name && h.name.toLowerCase().includes(pillar.name.toLowerCase().split(' ')[0]))
    );

    return {
      pillar,
      total,
      completed,
      inProgress,
      pending,
      overdue,
      completionRate,
      matchedTasks,
      matchedHats,
    };
  });

  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((t) => t.status === 'done').length;
  const overallComplianceRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 100;

  return (
    <div
      id="printable-accreditation-dossier"
      className="printable-dossier"
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        padding: '38px 44px',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        lineHeight: 1.5,
        maxWidth: '900px',
        margin: '0 auto',
        boxShadow: '0 4px 25px rgba(0,0,0,0.12)',
        borderRadius: '8px',
      }}
    >
      {/* ── OFFICIAL UNIVERSITY LETTERHEAD ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px double #1e293b',
          paddingBottom: '16px',
          marginBottom: '20px',
        }}
      >
        <img
          src="/logos/msa-university.jpeg"
          alt="MSA University Logo"
          style={{ height: '54px', width: 'auto', objectFit: 'contain' }}
        />

        <div style={{ textAlign: 'center', flex: 1, padding: '0 16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.04em', margin: 0, color: '#0f172a' }}>
            MODERN SCIENCES AND ARTS UNIVERSITY (MSA)
          </h2>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.03em', margin: '2px 0', color: '#1e3a8a' }}>
            FACULTY OF BIOTECHNOLOGY
          </h3>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', margin: 0 }}>
            Quality Assurance & NAQAAE Institutional Accreditation Unit
          </p>
        </div>

        <img
          src="/logos/faculty-of-biotechnology.jpeg"
          alt="Faculty of Biotechnology Crest"
          style={{ height: '54px', width: '54px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #cbd5e1' }}
        />
      </div>

      {/* ── FORMAL CLASSIFICATION BANNER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          padding: '8px 14px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '0.75rem',
        }}
      >
        <div>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Review Ref: </span>
          <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{refCode}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Academic Year: </span>
          <strong style={{ color: '#0f172a' }}>2025/2026 — Second Semester</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Date of Review: </span>
          <strong style={{ color: '#0f172a' }}>{currentDate}</strong>
        </div>
      </div>

      {/* ── REPORT TITLE ── */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: '4px 12px',
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            borderRadius: '999px',
            marginBottom: '8px',
          }}
        >
          Institutional Academic Governance & Performance Review
        </span>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '4px 0', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Faculty Comprehensive Academic Quality & Performance Review
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#475569', margin: '2px 0' }}>
          Comprehensive Institutional Evaluation of Academic Governance, Curriculum Delivery, Laboratory Infrastructure, and National Quality Benchmarks
        </p>
      </div>

      {/* ── OVERALL READINESS SCORECARD ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          padding: '16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '8px',
          marginBottom: '24px',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
            Overall Compliance
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d', marginTop: '2px' }}>
            {overallComplianceRate}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
            Tracked Directives
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1d4ed8', marginTop: '2px' }}>
            {totalTasks}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
            Fulfilled Actions
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#16a34a', marginTop: '2px' }}>
            {totalCompleted}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
            Accreditation Pillars
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#b91c1c', marginTop: '2px' }}>
            12 / 12
          </div>
        </div>
      </div>

      {/* ── EXECUTIVE DEAN ENDORSEMENT STATEMENT ── */}
      <div
        style={{
          borderLeft: '4px solid #1e3a8a',
          padding: '12px 18px',
          backgroundColor: '#f8fafc',
          marginBottom: '24px',
          fontSize: '0.85rem',
          color: '#334155',
          fontStyle: 'italic',
        }}
      >
        <strong style={{ fontStyle: 'normal', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
          Executive Mandate & Quality Assurance Declaration:
        </strong>
        &ldquo;The Faculty of Biotechnology at Modern Sciences and Arts University hereby attests that this statutory
        matrix represents an accurate, verified, and continuous audit of institutional operations across all 12 NAQAAE
        pillars of academic governance, program development, graduate attributes, and community integration for the
        2025/2026 academic calendar.&rdquo;
        <div style={{ marginTop: '6px', fontSize: '0.8rem', fontWeight: 700, fontStyle: 'normal', color: '#1e3a8a' }}>
          — Prof. Dr. Gehan Safwat, Dean of the Faculty of Biotechnology
        </div>
      </div>

      {/* ── 12 PILLARS AUDIT TABLE ── */}
      <div style={{ marginBottom: '28px' }}>
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#1e293b',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '8px',
            marginBottom: '14px',
          }}
        >
          Institutional Compliance Roster Across NAQAAE Pillars (A through L)
        </h3>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.775rem',
            lineHeight: 1.4,
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#1e293b', color: '#ffffff', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', width: '60px' }}>Pillar</th>
              <th style={{ padding: '8px 10px' }}>Domain & Focus Description</th>
              <th style={{ padding: '8px 10px', width: '130px' }}>Compliance Metric</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '75px' }}>Total</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '75px' }}>Done</th>
              <th style={{ padding: '8px 10px', textAlign: 'center', width: '90px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {pillarStats.map((item, index) => {
              const p = item.pillar;
              return (
                <tr
                  key={p.code}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <td style={{ padding: '10px 10px', fontWeight: 800, color: '#1e3a8a', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{p.icon}</span>
                      <span>{p.code}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.825rem' }}>{p.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.725rem', marginTop: '2px' }}>{p.description}</div>
                    {item.matchedHats.length > 0 && (
                      <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {item.matchedHats.map((h) => (
                          <span
                            key={h.id}
                            style={{
                              backgroundColor: '#e2e8f0',
                              color: '#334155',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '0.675rem',
                              fontWeight: 600,
                            }}
                          >
                            🎩 {h.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, color: item.completionRate >= 70 ? '#15803d' : '#b45309' }}>
                        {item.completionRate}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#e2e8f0',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${item.completionRate}%`,
                          height: '100%',
                          backgroundColor: item.completionRate >= 70 ? '#16a34a' : '#f59e0b',
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700, verticalAlign: 'top' }}>
                    {item.total}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center', fontWeight: 700, color: '#16a34a', verticalAlign: 'top' }}>
                    {item.completed}
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center', verticalAlign: 'top' }}>
                    {item.overdue > 0 ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.675rem' }}>
                        {item.overdue} Overdue
                      </span>
                    ) : item.completionRate === 100 ? (
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.675rem' }}>
                        ✓ Satisfied
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '0.675rem' }}>
                        Active Audit
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── STATUTORY EVIDENCE CHECKLIST SUMMARY ── */}
      <div
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '6px',
          padding: '14px 18px',
          backgroundColor: '#f8fafc',
          marginBottom: '32px',
          pageBreakInside: 'avoid',
        }}
      >
        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
          Statutory Verification & Continuous Improvement Log
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.75rem', color: '#334155' }}>
          <div>
            ✓ <strong>Program ILOs Matrix:</strong> Verified & aligned with NAQAAE National Academic Reference Standards (NARS).
          </div>
          <div>
            ✓ <strong>Course Files & Portfolios:</strong> Midterm and practical assessments audited by Academic Administration.
          </div>
          <div>
            ✓ <strong>Graduation Research Theses:</strong> Dual-evaluated with external industry & clinical supervisors.
          </div>
          <div>
            ✓ <strong>Stakeholder Advisory Council:</strong> Bi-annual industrial feedback incorporated into syllabus revision.
          </div>
        </div>
      </div>

      {/* ── TRIPARTITE SIGNATURES & OFFICIAL SEAL ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          borderTop: '2px solid #cbd5e1',
          paddingTop: '20px',
          pageBreakInside: 'avoid',
        }}
      >
        {/* Signer 1: Quality Assurance Director */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            Director of Quality Assurance
          </div>
          <div
            style={{
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '8px 0',
              fontFamily: "'Brush Script MT', 'Great Vibes', cursive",
              fontSize: '1.4rem',
              color: '#1e3a8a',
            }}
          >
            QA Director / Rapporteur
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
            Assoc. Prof. Dr. QA Unit Head
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Internal Audit & Compliance
          </div>
        </div>

        {/* Signer 2: Faculty Dean */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          {/* Official Stamp Watermark */}
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90px',
              height: '90px',
              border: '2px dashed #93c5fd',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.35,
              pointerEvents: 'none',
              color: '#1e3a8a',
              fontSize: '0.55rem',
              fontWeight: 900,
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            <span>★ MSA ★</span>
            <span>FACULTY OF</span>
            <span>BIOTECHNOLOGY</span>
            <span>DEAN'S OFFICE</span>
          </div>

          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#1e3a8a' }}>
            Dean of Faculty of Biotechnology
          </div>
          <div
            style={{
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '8px 0',
              fontFamily: "'Brush Script MT', 'Great Vibes', cursive",
              fontSize: '1.6rem',
              color: '#1e3a8a',
            }}
          >
            Gehan Safwat
          </div>
          <div style={{ fontSize: '0.825rem', fontWeight: 900, color: '#0f172a' }}>
            Prof. Dr. Gehan Safwat
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Dean & Head of Faculty Council
          </div>
        </div>

        {/* Signer 3: University President */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
            University Presidency Endorsement
          </div>
          <div
            style={{
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '8px 0',
              fontFamily: "'Brush Script MT', 'Great Vibes', cursive",
              fontSize: '1.35rem',
              color: '#1e3a8a',
            }}
          >
            President Council
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
            President of MSA University
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Supreme Council of Universities
          </div>
        </div>
      </div>

      {/* ── FOOTER NOTATION ── */}
      <div
        style={{
          marginTop: '28px',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.675rem',
          color: '#94a3b8',
        }}
      >
        <span>MSA University • 26th of July Corridor, 6th of October City, Giza, Egypt</span>
        <span>Page 1 of 1 • Statutory Accreditation Record</span>
        <span>Ref: {refCode}</span>
      </div>
    </div>
  );
};
