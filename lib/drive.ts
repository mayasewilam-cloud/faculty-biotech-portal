/**
 * Google Drive & Google Docs Link Parser & Validation Utility
 * Faculty of Biotechnology Management Portal
 */

export interface GoogleDriveResource {
  rawUrl: string;
  isValid: boolean;
  resourceId?: string;
  resourceType: 'document' | 'spreadsheet' | 'presentation' | 'folder' | 'file' | 'generic';
  label: string;
  embedUrl?: string;
  previewUrl?: string;
  exportDownloadUrl?: string;
}

export function parseGoogleDriveUrl(url: string | null | undefined): GoogleDriveResource {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      rawUrl: '',
      isValid: false,
      resourceType: 'generic',
      label: 'Invalid Link',
    };
  }

  const trimmed = url.trim();

  // 1. Google Docs (/document/d/<id>)
  const docMatch = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch) {
    const id = docMatch[1];
    return {
      rawUrl: trimmed,
      isValid: true,
      resourceId: id,
      resourceType: 'document',
      label: 'Google Document',
      embedUrl: `https://docs.google.com/document/d/${id}/preview`,
      previewUrl: `https://docs.google.com/document/d/${id}/preview`,
      exportDownloadUrl: `https://docs.google.com/document/d/${id}/export?format=pdf`,
    };
  }

  // 2. Google Sheets (/spreadsheets/d/<id>)
  const sheetMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch) {
    const id = sheetMatch[1];
    return {
      rawUrl: trimmed,
      isValid: true,
      resourceId: id,
      resourceType: 'spreadsheet',
      label: 'Google Spreadsheet',
      embedUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
      previewUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
      exportDownloadUrl: `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
    };
  }

  // 3. Google Slides (/presentation/d/<id>)
  const slideMatch = trimmed.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slideMatch) {
    const id = slideMatch[1];
    return {
      rawUrl: trimmed,
      isValid: true,
      resourceId: id,
      resourceType: 'presentation',
      label: 'Google Presentation',
      embedUrl: `https://docs.google.com/presentation/d/${id}/preview`,
      previewUrl: `https://docs.google.com/presentation/d/${id}/preview`,
      exportDownloadUrl: `https://docs.google.com/presentation/d/${id}/export?format=pdf`,
    };
  }

  // 4. Google Drive Folder (/drive/folders/<id>)
  const folderMatch = trimmed.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) {
    const id = folderMatch[1];
    return {
      rawUrl: trimmed,
      isValid: true,
      resourceId: id,
      resourceType: 'folder',
      label: 'Google Drive Folder',
      previewUrl: `https://drive.google.com/embeddedfolderview?id=${id}`,
    };
  }

  // 5. Google Drive File (/file/d/<id> or ?id=<id>)
  const fileMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/);

  if (fileMatch) {
    const id = fileMatch[1];
    return {
      rawUrl: trimmed,
      isValid: true,
      resourceId: id,
      resourceType: 'file',
      label: 'Google Drive File',
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      previewUrl: `https://drive.google.com/file/d/${id}/preview`,
      exportDownloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
    };
  }

  // Generic link
  const isHttp = /^https?:\/\//i.test(trimmed);
  return {
    rawUrl: trimmed,
    isValid: isHttp,
    resourceType: 'generic',
    label: isHttp ? 'External Resource Link' : 'Invalid Link',
    previewUrl: isHttp ? trimmed : undefined,
  };
}

export function isGoogleDriveUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^(https?:\/\/)?(docs|drive)\.google\.com/i.test(url.trim());
}
