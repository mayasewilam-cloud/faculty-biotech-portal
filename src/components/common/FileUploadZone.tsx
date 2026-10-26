'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  ExternalLink,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  Paperclip,
} from 'lucide-react';

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface FileUploadZoneProps {
  onFileUploaded: (file: UploadedFile) => void;
  onFileRemoved: () => void;
  currentFile?: UploadedFile | null;
  label?: string;
  hint?: string;
  maxSizeMB?: number;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileUploaded,
  onFileRemoved,
  currentFile = null,
  label = 'Attach Document, Exam, or Evidence File',
  hint = 'PDF, DOCX, XLSX, PPTX, or Images up to 25 MB. Drag & drop or browse.',
  maxSizeMB = 25,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const uploadFile = async (file: File) => {
    setUploadError(null);

    if (file.size > maxSizeMB * 1024 * 1024) {
      setUploadError(`File size (${formatFileSize(file.size)}) exceeds the ${maxSizeMB} MB limit.`);
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      onFileUploaded({
        name: data.name,
        url: data.url,
        size: data.size,
        type: data.type,
      });
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during file upload');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(name)) {
      return <ImageIcon size={22} color="#60a5fa" />;
    }
    if (type.includes('spreadsheet') || type.includes('excel') || /\.(xlsx|xls|csv)$/i.test(name)) {
      return <FileSpreadsheet size={22} color="#34d399" />;
    }
    if (type.includes('pdf') || /\.pdf$/i.test(name)) {
      return <FileText size={22} color="#f87171" />;
    }
    return <Paperclip size={22} color="#a78bfa" />;
  };

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Paperclip size={14} color="#60a5fa" />
            <span>{label}</span>
          </label>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            🔒 Stored in faculty repository
          </span>
        </div>
      )}

      {!currentFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{
            border: isDragging ? '2px dashed #3b82f6' : '2px dashed rgba(255, 255, 255, 0.15)',
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            padding: '24px 18px',
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={isUploading}
          />

          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: isDragging ? '#60a5fa' : 'var(--text-muted)',
            }}
          >
            {isUploading ? (
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  border: '3px solid rgba(59, 130, 246, 0.3)',
                  borderTopColor: '#3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <UploadCloud size={24} />
            )}
          </div>

          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>
            {isUploading ? 'Uploading binary document to storage...' : isDragging ? 'Drop file here to upload' : 'Click to browse or drag & drop file'}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {hint}
          </div>

          {uploadError && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '0.775rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={15} />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      ) : (
        /* Attached File Display Card */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '10px',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getFileIcon(currentFile.type, currentFile.name)}
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={currentFile.name}
              >
                {currentFile.name}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{formatFileSize(currentFile.size)}</span>
                <span>•</span>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <CheckCircle2 size={12} />
                  <span>Stored</span>
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <a
              href={currentFile.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '5px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                textDecoration: 'none',
              }}
              title="Open or preview document"
            >
              <ExternalLink size={13} />
              <span>Preview</span>
            </a>

            <button
              type="button"
              onClick={onFileRemoved}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                borderRadius: '6px',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Remove file"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
