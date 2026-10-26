'use client';

import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Users, Trash2 } from 'lucide-react';

interface CommitteeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => Promise<void>;
}

interface ParsedCommitteeRow {
  name: string;
  name_ar?: string;
  code: string;
  decree_ref?: string;
  chair_name: string;
  chair_title?: string;
  rapporteur_name: string;
  rapporteur_title?: string;
  description: string;
  mandates: string[];
  members: { name: string; role: string }[];
  valid: boolean;
  validationError?: string;
}

export const CommitteeImportModal: React.FC<CommitteeImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedCommitteeRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Download Sample CSV Template for Committees
  const handleDownloadTemplate = () => {
    const csvContent = [
      'Committee Name,Code,Decree Ref,Chair,Rapporteur,Description,Mandates,Members',
      '"Quality Assurance & Accreditation Steering Committee",QA-SC,"Decree 12/2026","Prof. Dr. Gehan Safwat","Dr. Nourhan El-Sayed","Oversees academic standards and accreditation readiness","Review CLOs; Audit course files; Ratify rubrics","Dr. Shaza Ahmed (Member); LA Mohamed Tarek (Coordinator); TA Fatma Mahmoud (Documentation)"',
      '"Undergraduate Examination & Moderation Board",EXAM-MOD,"Decree 14/2026","Prof. Dr. Amr Ageez","Dr. Ahmed Mansour","Moderation of exam drafts and special needs accommodations","Audit exam questions; Verify grade distributions; Handle petitions","Dr. Dina Hesham (Member); TA Sarah Gamal (Secretary)"',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Faculty_Committees_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    const rows: ParsedCommitteeRow[] = [];
    const startIndex = lines[0].toLowerCase().includes('committee name') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Regex CSV parser handling quotes
      const pattern = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const tokens: string[] = [];
      let match;
      while ((match = pattern.exec(line)) !== null) {
        let val = match[1] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        tokens.push(val.trim());
        if (pattern.lastIndex === line.length) break;
      }

      if (tokens.length < 1 || !tokens[0]) continue;

      const name = tokens[0] || '';
      const code = tokens[1] || name.split(' ').map(w => w[0]).join('').slice(0, 6).toUpperCase();
      const decree_ref = tokens[2] || '';
      const chair_name = tokens[3] || 'Prof. Dr. Gehan Safwat';
      const rapporteur_name = tokens[4] || '';
      const description = tokens[5] || `Official statutory mandate for ${name}`;
      const rawMandates = tokens[6] || '';
      const rawMembers = tokens[7] || '';

      const mandates = rawMandates
        ? rawMandates.split(';').map(m => m.trim()).filter(Boolean)
        : ['1. Regular committee proceedings', '2. Execution of statutory mandates'];

      const membersList: { name: string; role: string }[] = [];
      if (rawMembers) {
        const memberEntries = rawMembers.split(';').map(m => m.trim()).filter(Boolean);
        for (const entry of memberEntries) {
          const matchRole = entry.match(/^(.+?)\s*\((.+?)\)$/);
          if (matchRole) {
            membersList.push({ name: matchRole[1].trim(), role: matchRole[2].trim() });
          } else {
            membersList.push({ name: entry, role: 'Member' });
          }
        }
      }

      const valid = name.length >= 3;
      rows.push({
        name,
        code,
        decree_ref,
        chair_name,
        rapporteur_name,
        description,
        mandates,
        members: membersList,
        valid,
        validationError: valid ? undefined : 'Committee name is too short',
      });
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCsvText(content);
    };
    reader.onerror = () => {
      setError('Failed to read the file. Please check file format.');
    };
    reader.readAsText(uploadedFile);
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedText(text);
    setError(null);
    setImportResult(null);
    parseCsvText(text);
  };

  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      setError('No valid committee entries to import.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    let importedCount = 0;
    let skippedCount = 0;

    try {
      for (const row of validRows) {
        const payload = {
          name: row.name,
          code: row.code,
          decree_ref: row.decree_ref,
          chair_name: row.chair_name,
          chair_title: 'Committee Chair',
          rapporteur_name: row.rapporteur_name || row.chair_name,
          rapporteur_title: 'Committee Rapporteur',
          description: row.description,
          mandates: row.mandates,
          members: row.members.map(m => ({
            name: m.name,
            role: m.role || 'Member',
          })),
        };

        const res = await fetch('/api/committees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          importedCount++;
        } else {
          skippedCount++;
        }
      }

      setImportResult({ imported: importedCount, skipped: skippedCount });
      await onImportSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during committee import');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🏛️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Import Standing Committees & Appointed Members
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Upload CSV or paste text with committee names, mandates, and appointed member rosters.
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Success or Global Error Banners */}
        {importResult && (
          <div style={{ padding: '14px 18px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
              <CheckCircle2 size={18} />
              <span>Import Completed: {importResult.imported} committees created successfully! ({importResult.skipped} skipped)</span>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Done
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Input Mode Selector & Template Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMode('upload')}
              style={{ fontWeight: 700 }}
            >
              <Upload size={14} />
              <span>Upload CSV File</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeMode === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMode('paste')}
              style={{ fontWeight: 700 }}
            >
              <FileSpreadsheet size={14} />
              <span>Paste Text / Excel Rows</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadTemplate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.4)' }}
            title="Download formatted CSV spreadsheet template"
          >
            <Download size={13} />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Mode 1: File Upload */}
        {activeMode === 'upload' && (
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                cursor: 'pointer',
                background: 'var(--bg-inset)',
                transition: 'border-color 0.15s ease',
              }}
            >
              <Upload size={32} style={{ color: 'var(--accent-blue)', marginBottom: '8px' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                {file ? file.name : 'Click to select or drag CSV committee file here'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports UTF-8 CSV exports with committee names, mandates, and member names.
              </span>
              <input type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* Mode 2: Paste Area */}
        {activeMode === 'paste' && (
          <div style={{ marginBottom: '16px' }}>
            <textarea
              className="form-textarea"
              rows={5}
              placeholder="Paste comma-separated rows or columns from Excel here...&#10;Format: Committee Name, Code, Decree Ref, Chair, Rapporteur, Description, Mandates, Members"
              value={pastedText}
              onChange={handlePasteChange}
              style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}
            />
          </div>
        )}

        {/* Preview Table of Parsed Committees */}
        {parsedRows.length > 0 && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Parsed Committees Preview ({validCount} Valid, {invalidCount} Invalid)
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setParsedRows([]);
                  setFile(null);
                  setPastedText('');
                }}
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              >
                Clear Preview
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '220px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-inset)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Committee Name</th>
                    <th style={{ padding: '8px 12px' }}>Chair</th>
                    <th style={{ padding: '8px 12px' }}>Members</th>
                    <th style={{ padding: '8px 12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.name}</td>
                      <td style={{ padding: '8px 12px' }}>{row.chair_name}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {row.members.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {row.members.map((m, mIdx) => (
                              <span key={mIdx} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-inset)', border: '1px solid var(--border)' }}>
                                {m.name} ({m.role})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None specified</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {row.valid ? (
                          <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Ready</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>✗ {row.validationError}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExecuteImport}
            disabled={isProcessing || validCount === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
          >
            <span>{isProcessing ? 'Importing Committees...' : `Confirm & Import ${validCount} Committees`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
