'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, Download, CheckCircle2, AlertCircle, Users, Trash2 } from 'lucide-react';

interface FacultyImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => Promise<void>;
}

interface ParsedFacultyRow {
  full_name: string;
  email: string;
  title: string;
  role: string;
  department: string;
  phone: string;
  valid: boolean;
  validationError?: string;
}

export const FacultyImportModal: React.FC<FacultyImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedFacultyRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = [
      'Full Name,Email,Title,Role,Department,Phone',
      'Prof. Dr. Ahmed Mansour,ahmed.mansour@msa.edu.eg,Prof. Dr.,professor,Molecular Diagnostics & Therapeutics,+20 100 111 2233',
      'Dr. Nourhan El-Sayed,nourhan.elsayed@msa.edu.eg,Dr.,staff,Agricultural & Environmental Biotech,+20 101 222 3344',
      'LA Mohamed Tarek,mohamed.tarek@msa.edu.eg,LA,staff,Industrial & Pharmaceutical Biotech,+20 102 333 4455',
      'TA Fatma Mahmoud,fatma.mahmoud@msa.edu.eg,TA,staff,Quality Assurance & Accreditation,+20 103 444 5566',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'faculty_directory_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse raw text into structured rows
  const parseRawContent = (content: string) => {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Check if first line is a header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('name') || firstLine.includes('email') || firstLine.includes('title');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const rows: ParsedFacultyRow[] = [];

    for (const line of dataLines) {
      // Split by comma or tab (handles TSV from Excel copy-paste as well)
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const cleaned = parts.map((p) => p.replace(/^["']|["']$/g, '').trim());

      if (cleaned.length === 0 || cleaned.every((p) => !p)) continue;

      let name = '';
      let email = '';
      let title = 'Dr.';
      let role = 'staff';
      let dept = 'Academic Staff';
      let phone = '';

      if (cleaned.length === 1 && cleaned[0].includes('@')) {
        // Just email
        email = cleaned[0];
        name = cleaned[0].split('@')[0].replace(/[._]/g, ' ');
      } else if (cleaned.length >= 2) {
        // Name, Email, ...
        name = cleaned[0];
        email = cleaned[1];
        if (cleaned.length >= 3 && cleaned[2]) title = cleaned[2];
        if (cleaned.length >= 4 && cleaned[3]) role = cleaned[3].toLowerCase();
        if (cleaned.length >= 5 && cleaned[4]) dept = cleaned[4];
        if (cleaned.length >= 6 && cleaned[5]) phone = cleaned[5];
      }

      // Basic role normalization
      if (title.toLowerCase().includes('prof') || role.includes('prof')) {
        role = 'professor';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(email);

      rows.push({
        full_name: name,
        email,
        title,
        role,
        department: dept,
        phone,
        valid: Boolean(name && email && isValidEmail),
        validationError: !name ? 'Missing name' : !email ? 'Missing email' : !isValidEmail ? 'Invalid email format' : undefined,
      });
    }

    setParsedRows(rows);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseRawContent(content);
    };
    reader.readAsText(selected);
  };

  // Handle pasted text parsing
  const handlePasteChange = (text: string) => {
    setPastedText(text);
    setError(null);
    setImportResult(null);
    parseRawContent(text);
  };

  // Submit bulk import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      setError('No valid faculty records found to import.');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: validRows.map((r) => ({
            full_name: r.full_name,
            email: r.email,
            title: r.title,
            role: r.role,
            department: r.department,
            phone: r.phone,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import faculty members.');
      }

      setImportResult({
        imported: data.imported || 0,
        updated: data.updated || 0,
        skipped: data.skipped || 0,
      });

      await onImportSuccess();
    } catch (err: any) {
      setError(err.message || 'Error occurred during batch import.');
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.length - validCount;

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
          maxWidth: '850px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
                background: 'linear-gradient(135deg, #059669, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Upload size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Batch Import Faculty & Staff Directory
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Upload a CSV file or paste spreadsheet rows to automatically enroll multiple faculty members.
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

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          {importResult && (
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid #10b981',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Import Completed Successfully!</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <strong>{importResult.imported}</strong> new members registered, <strong>{importResult.updated}</strong> updated,{' '}
                    <strong>{importResult.skipped}</strong> skipped.
                  </div>
                </div>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
                Done
              </button>
            </div>
          )}

          {/* Action Row: Mode Switch & Template Download */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveMode('upload')}
              >
                <FileText size={14} /> Upload File (.csv)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeMode === 'paste' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveMode('paste')}
              >
                📋 Paste from Excel / Text
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadTemplate}
              style={{ gap: '6px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)' }}
            >
              <Download size={14} /> Download Sample CSV Template
            </button>
          </div>

          {/* Input Method */}
          {activeMode === 'upload' ? (
            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                background: 'var(--bg-inset)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('faculty-csv-input')?.click()}
            >
              <input
                id="faculty-csv-input"
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Upload size={32} style={{ margin: '0 auto 10px', color: '#10b981' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {file ? file.name : 'Click to select or drag and drop a CSV file'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports standard CSV with columns: Full Name, Email, Title, Role, Department, Phone
              </div>
            </div>
          ) : (
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                Paste CSV or Tab-Delimited Data (e.g. copied directly from Excel):
              </label>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder={`Prof. Dr. Ahmed Mansour, ahmed.mansour@msa.edu.eg, Prof. Dr., professor, Molecular Diagnostics\nDr. Nourhan El-Sayed, nourhan.elsayed@msa.edu.eg, Dr., staff, Biotechnology`}
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.825rem' }}
              />
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    Preview Parsed Members ({parsedRows.length})
                  </span>
                  <span className="tag-cat tag-cat-ta">
                    ✅ {validCount} Ready
                  </span>
                  {invalidCount > 0 && (
                    <span className="tag-cat tag-cat-overdue">
                      ⚠️ {invalidCount} Invalid
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setParsedRows([]);
                    setFile(null);
                    setPastedText('');
                  }}
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  <Trash2 size={12} /> Clear
                </button>
              </div>

              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                }}
              >
                <table className="custom-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px' }}>Name</th>
                      <th style={{ padding: '8px 12px' }}>Email</th>
                      <th style={{ padding: '8px 12px' }}>Title</th>
                      <th style={{ padding: '8px 12px' }}>Role</th>
                      <th style={{ padding: '8px 12px' }}>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} style={{ opacity: r.valid ? 1 : 0.6 }}>
                        <td style={{ padding: '6px 12px' }}>
                          {r.valid ? (
                            <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Valid</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontWeight: 700 }} title={r.validationError}>
                              ✕ Error
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '6px 12px', fontWeight: 600 }}>{r.full_name || '—'}</td>
                        <td style={{ padding: '6px 12px' }}>{r.email || '—'}</td>
                        <td style={{ padding: '6px 12px' }}>{r.title}</td>
                        <td style={{ padding: '6px 12px', textTransform: 'uppercase', fontSize: '0.7rem' }}>{r.role}</td>
                        <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>{r.department}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            background: 'var(--bg-card-hover)',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExecuteImport}
            disabled={isProcessing || validCount === 0}
            style={{
              background: 'linear-gradient(135deg, #059669, #10b981)',
              borderColor: '#10b981',
              fontWeight: 700,
            }}
          >
            {isProcessing ? 'Importing Members...' : `Enroll & Import ${validCount} Faculty Member${validCount === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  );
};
