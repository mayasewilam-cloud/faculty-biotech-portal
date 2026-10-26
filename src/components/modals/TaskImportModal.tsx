'use client';

import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface TaskImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

interface ParsedTaskRow {
  tr?: number;
  title: string;
  assignee_name?: string;
  deadline?: string;
  status?: string;
  notes?: string;
  hat_name?: string;
}

export const TaskImportModal: React.FC<TaskImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedTaskRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ updated: number; inserted: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Parse TSV (Excel copy-paste) or CSV content
  const parseSpreadsheetData = (text: string) => {
    setError(null);
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    // Determine delimiter (tab if copied from Excel, otherwise comma)
    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const rawHeaders = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

    // Map column indices
    let trIdx = rawHeaders.findIndex(h => h === 'tr' || h === 'task #' || h === '#' || h === 'id');
    let titleIdx = rawHeaders.findIndex(h => h === 'title' || h === 'task' || h === 'task title' || h === 'subject');
    let assigneeIdx = rawHeaders.findIndex(h => h.includes('assign') || h.includes('staff') || h.includes('person') || h.includes('responsible') || h.includes('name'));
    let deadlineIdx = rawHeaders.findIndex(h => h.includes('dead') || h.includes('due') || h.includes('date'));
    let statusIdx = rawHeaders.findIndex(h => h.includes('status') || h.includes('state'));
    let notesIdx = rawHeaders.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('feedback') || h.includes('description'));
    let hatIdx = rawHeaders.findIndex(h => h.includes('hat') || h.includes('category') || h.includes('domain'));

    // Fallback if no header row is detected (assume standard 5 columns: TR, Title, Assignee, Deadline, Status, Notes)
    const startRow = (titleIdx !== -1 || trIdx !== -1) ? 1 : 0;
    if (startRow === 0) {
      trIdx = 0;
      titleIdx = 1;
      assigneeIdx = 2;
      deadlineIdx = 3;
      statusIdx = 4;
      notesIdx = 5;
    }

    const rows: ParsedTaskRow[] = [];
    for (let i = startRow; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0 || (!parts[titleIdx] && !parts[trIdx])) continue;

      const trNum = trIdx !== -1 && parts[trIdx] ? parseInt(parts[trIdx].replace(/[^0-9]/g, ''), 10) : undefined;
      const title = titleIdx !== -1 && parts[titleIdx] ? parts[titleIdx] : `Task #${trNum || i}`;

      rows.push({
        tr: isNaN(trNum as any) ? undefined : trNum,
        title,
        assignee_name: assigneeIdx !== -1 ? parts[assigneeIdx] : undefined,
        deadline: deadlineIdx !== -1 ? parts[deadlineIdx] : undefined,
        status: statusIdx !== -1 ? parts[statusIdx] : undefined,
        notes: notesIdx !== -1 ? parts[notesIdx] : undefined,
        hat_name: hatIdx !== -1 ? parts[hatIdx] : undefined,
      });
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) parseSpreadsheetData(text);
    };
    reader.readAsText(f);
  };

  const handlePasteChange = (val: string) => {
    setPastedText(val);
    parseSpreadsheetData(val);
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      'TR,Task Title,Responsible Staff,Deadline,Status,Notes,Hat',
      '1,Lecture Hall Reservation - 6th of October Sessions,LA. Salma Raouf,2026-10-02,done,All halls reserved,Student Affairs',
      '2,Midterm Examination Papers Soft & Hard Copies,Dr. Amgad Mostafa,2026-11-05,in_progress,Reviewing drafts,Exams Moderation',
      '3,Fall 2026 Lab Equipment Log & Requisition,Prof. Dr. Khaled El-Din,2026-11-12,pending,Reagents inventory checked,Labs and Studios',
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Faculty_Tasks_Update_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      setError('Please paste or upload spreadsheet task rows before updating.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'sync_spreadsheet',
          rows: parsedRows,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync spreadsheet tasks');
      }

      setResult({ updated: data.updatedCount || 0, inserted: data.insertedCount || 0 });
      await onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error synchronizing spreadsheet tasks');
    } finally {
      setIsProcessing(false);
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
        backdropFilter: 'blur(12px)',
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
          backgroundColor: 'var(--bg-secondary, #ffffff)',
          border: '1.5px solid var(--border)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '88vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.55)',
          color: 'var(--text-main)',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#10b981'
            }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Update Platform from Excel / Spreadsheet
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Copy and paste cells directly from Excel, or upload a CSV file to update tasks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {result ? (
            <div style={{
              padding: '28px 20px', textAlign: 'center',
              background: 'rgba(16, 185, 129, 0.08)',
              borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle2 size={42} style={{ color: '#10b981', margin: '0 auto 12px' }} />
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                Spreadsheet Synchronization Successful!
              </h4>
              <p style={{ margin: '6px 0 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <strong>{result.updated}</strong> tasks updated and <strong>{result.inserted}</strong> new tasks created.
              </p>
              <button
                className="btn btn-primary"
                onClick={onClose}
                style={{ padding: '8px 24px' }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Tab Selector: Paste vs File */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setActiveTab('paste')}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      background: activeTab === 'paste' ? 'rgba(59, 130, 246, 0.15)' : 'none',
                      color: activeTab === 'paste' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      border: activeTab === 'paste' ? '1px solid var(--accent-blue)' : '1px solid transparent',
                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    📋 Paste Direct from Excel
                  </button>
                  <button
                    onClick={() => setActiveTab('upload')}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      background: activeTab === 'upload' ? 'rgba(59, 130, 246, 0.15)' : 'none',
                      color: activeTab === 'upload' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      border: activeTab === 'upload' ? '1px solid var(--accent-blue)' : '1px solid transparent',
                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    📁 Upload CSV File
                  </button>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'none', border: 'none', color: 'var(--accent-blue)',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                  }}
                >
                  <Download size={14} />
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* Mode 1: Paste Text */}
              {activeTab === 'paste' && (
                <div>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>
                    Select and copy rows in your Excel file (including headers), then paste below:
                  </label>
                  <textarea
                    rows={7}
                    className="form-textarea"
                    placeholder="TR	Task Title	Responsible Staff	Deadline	Status	Notes&#10;1	Lecture Hall Reservation	LA. Salma Raouf	2026-10-02	done	Completed on time&#10;2	Midterm Exam Papers	Dr. Amgad	2026-11-05	in_progress	Drafts pending"
                    value={pastedText}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      width: '100%',
                      backgroundColor: 'var(--bg-input, #ffffff)',
                      color: 'var(--text-main, #0f172a)',
                      border: '1.5px solid var(--border, #cbd5e1)',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  />
                </div>
              )}

              {/* Mode 2: Upload File */}
              {activeTab === 'upload' && (
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '12px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <Upload size={32} style={{ color: 'var(--accent-blue)', margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                    Choose a .csv file exported from Excel
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Matches existing tasks by TR number or Title
                  </div>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    style={{ fontSize: '0.85rem' }}
                  />
                  {file && <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#10b981' }}>Selected: {file.name}</div>}
                </div>
              )}

              {/* Preview of Parsed Rows */}
              {parsedRows.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      Detected {parsedRows.length} Task Rows to Sync:
                    </div>
                  </div>
                  <div style={{
                    maxHeight: '180px', overflowY: 'auto',
                    border: '1px solid var(--border)', borderRadius: '10px',
                    background: 'var(--bg-inset, rgba(0,0,0,0.15))'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>TR</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Title</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Assignee</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '8px 10px', textAlign: 'left' }}>Hat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '6px 10px' }}>{r.tr ? `#${r.tr}` : '-'}</td>
                            <td style={{ padding: '6px 10px', fontWeight: 600 }}>{r.title}</td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.assignee_name || '-'}</td>
                            <td style={{ padding: '6px 10px' }}>
                              <span style={{
                                padding: '2px 6px', borderRadius: '4px',
                                background: r.status?.toLowerCase().includes('done') ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                                color: r.status?.toLowerCase().includes('done') ? '#16a34a' : '#2563eb',
                                fontWeight: 600
                              }}>
                                {r.status || 'pending'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.hat_name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!result && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: '12px', flexShrink: 0
          }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isProcessing || parsedRows.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isProcessing && <RefreshCw size={14} className="spin" />}
              <span>Apply Updates to Platform ({parsedRows.length} Rows)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
