'use client';

import React from 'react';
import { Meeting } from '@/types';

interface PrintableMomDossierProps {
  meeting: Meeting;
}

export const PrintableMomDossier: React.FC<PrintableMomDossierProps> = ({ meeting }) => {
  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case 'presidential_delegation':
        return 'UNIVERSITY PRESIDENTIAL COUNCIL — FACULTY DELEGATION';
      case 'faculty_board':
        return 'FACULTY BOARD & EXECUTIVE COUNCIL SESSION';
      case 'committee':
        return 'OFFICIAL SPECIALIZED COMMITTEE / HAT SESSION';
      default:
        return 'DEPARTMENTAL ACADEMIC PROCEEDINGS';
    }
  };

  const refCode = `MSA-BIO-MOM-${String(meeting.id).padStart(3, '0')}-2026`;
  const formattedDate = new Date(meeting.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="printable-mom-dossier"
      className="printable-dossier"
      style={{
        backgroundColor: '#ffffff',
        color: '#0f172a',
        padding: '36px 42px',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        lineHeight: 1.5,
        maxWidth: '850px',
        margin: '0 auto',
        boxShadow: '0 4px 25px rgba(0,0,0,0.15)',
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
            Office of the Dean • Academic Governance & Statutory Records
          </p>
        </div>

        <img
          src="/logos/faculty-of-biotechnology.jpeg"
          alt="Faculty of Biotechnology Crest"
          style={{ height: '54px', width: '54px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #cbd5e1' }}
        />
      </div>

      {/* ── FORMAL CLASSIFICATION & REFERENCE BANNER ── */}
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
          <span style={{ color: '#64748b', fontWeight: 600 }}>Reference No: </span>
          <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{refCode}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Classification: </span>
          <strong style={{ color: '#1e3a8a', textTransform: 'uppercase' }}>Official Council Record</strong>
        </div>
        <div>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Date of Session: </span>
          <strong style={{ color: '#0f172a' }}>{formattedDate}</strong>
        </div>
      </div>

      {/* ── SESSION TITLE ── */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2563eb', marginBottom: '4px' }}>
          {getMeetingTypeLabel(meeting.type)}
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.35 }}>
          {meeting.title}
        </h1>
        {meeting.hat_name && (
          <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
            Under Committee / Hat: <strong>{meeting.hat_name}</strong>
          </div>
        )}
      </div>

      {/* ── SECTION 1: GOVERNANCE & SESSION METADATA ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 700, width: '22%' }}>
              Chairperson:
            </td>
            <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '28%' }}>
              <strong>{meeting.chair}</strong>
            </td>
            <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 700, width: '22%' }}>
              Rapporteur / Secretary:
            </td>
            <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '28%' }}>
              <strong>{meeting.rapporteur || 'Vice Dean’s Secretariat'}</strong>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 700 }}>
              Session Venue:
            </td>
            <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>
              {meeting.location}
            </td>
            <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 700 }}>
              Quorum Status:
            </td>
            <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>
              <span style={{ color: '#15803d', fontWeight: 700 }}>✓ Quorum Formally Established</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── SECTION 2: OFFICIAL MANDATE & OBJECTIVE ── */}
      {meeting.objective && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
            I. Session Mandate & Strategic Purpose
          </h4>
          <p style={{ fontSize: '0.825rem', color: '#334155', margin: 0, textAlign: 'justify' }}>
            {meeting.objective}
          </p>
        </div>
      )}

      {/* ── SECTION 3: ATTENDANCE & QUORUM ROSTER ── */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
          II. Quorum & Delegation Attendance Register ({meeting.attendees?.length || 0})
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.775rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '35%' }}>Full Name & Academic Title</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '30%' }}>Delegation Role</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '25%' }}>Department / Unit</th>
              <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '10%', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {meeting.attendees?.map((att, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 600 }}>{att.name}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{att.role}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{att.department || 'Faculty Member'}</td>
                <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#15803d', fontWeight: 700 }}>Present</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── SECTION 4: ADOPTED AGENDA ── */}
      {meeting.agenda && meeting.agenda.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
            III. Formally Adopted Agenda Topics
          </h4>
          <ol style={{ margin: 0, paddingLeft: '22px', fontSize: '0.825rem', color: '#1e293b' }}>
            {meeting.agenda.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {item}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── SECTION 5: DELIBERATIONS & NARRATIVE MINUTES ── */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
          IV. Summary of Deliberations & Proceedings
        </h4>
        <div style={{ fontSize: '0.825rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.6, textAlign: 'justify' }}>
          {meeting.minutes_body || 'The deliberations concluded in accordance with official university protocols.'}
        </div>
      </div>

      {/* ── SECTION 6: FORMAL RESOLUTIONS & DECISIONS ── */}
      {meeting.decisions && meeting.decisions.length > 0 && (
        <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
          <h4 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
            V. Official Resolutions & Council Decrees
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {meeting.decisions.map((dec, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#fefce8',
                  borderLeft: '4px solid #ca8a04',
                  borderTop: '1px solid #fef08a',
                  borderRight: '1px solid #fef08a',
                  borderBottom: '1px solid #fef08a',
                  fontSize: '0.8rem',
                  color: '#713f12',
                }}
              >
                <strong>Resolution {i + 1}:</strong> {dec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 7: MANDATED ACTION ITEMS & ASSIGNMENTS ── */}
      {meeting.action_items && meeting.action_items.length > 0 && (
        <div style={{ marginBottom: '28px', pageBreakInside: 'avoid' }}>
          <h4 style={{ fontSize: '0.825rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e3a8a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '4px', marginBottom: '8px' }}>
            VI. Mandated Action Items & Faculty Directives
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '38%' }}>Direct Action Item Title</th>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '22%' }}>Assigned Lead</th>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '14%' }}>Pillar</th>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '14%' }}>Deadline</th>
                <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', width: '12%', textAlign: 'center' }}>Portal Status</th>
              </tr>
            </thead>
            <tbody>
              {meeting.action_items.map((ai, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 1 ? '#f8fafc' : '#ffffff' }}>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 600 }}>{ai.title}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{ai.assigned_to_name}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{ai.pillar_code ? `Pillar ${ai.pillar_code}` : 'General'}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{new Date(ai.deadline).toLocaleDateString()}</td>
                  <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700, color: ai.status === 'converted' || ai.task_id ? '#15803d' : '#ca8a04' }}>
                    {ai.status === 'converted' || ai.task_id ? `Live Task #${ai.task_id || ''}` : 'Pending Dispatch'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SECTION 8: OFFICIAL INSTITUTIONAL SIGNATURES & RATIFICATION ── */}
      <div
        style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '2px solid #334155',
          pageBreakInside: 'avoid',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '40px' }}>
              Recorded & Drafted By:
            </div>
            <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
              {meeting.rapporteur || 'Vice Dean for Academic Affairs'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Faculty Secretariat</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '40px' }}>
              Reviewed & Endorsed By:
            </div>
            <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
              Prof. Dr. Gehan Safwat
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Dean, Faculty of Biotechnology</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '40px' }}>
              Approved & Ratified By:
            </div>
            <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
              University President
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>President, MSA University</div>
          </div>
        </div>

        {/* Seal Watermark & Archive Notice */}
        <div
          style={{
            marginTop: '30px',
            textAlign: 'center',
            fontSize: '0.675rem',
            color: '#94a3b8',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '10px',
          }}
        >
          Official Electronic Record • Faculty of Biotechnology Academic Governance Portal • Modern Sciences and Arts University (MSA)
        </div>
      </div>
    </div>
  );
};
