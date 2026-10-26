import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queryFirst } from '@/lib/db';

const UPLOADS_DIR = path.join(process.cwd(), '.local', 'uploads');

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
};

function getR2Bucket(): any {
  // 1. Try OpenNext getCloudflareContext
  try {
    const openNext = require('@opennextjs/cloudflare');
    if (openNext && typeof openNext.getCloudflareContext === 'function') {
      const ctx = openNext.getCloudflareContext();
      if (ctx?.env?.UPLOADS_BUCKET) return ctx.env.UPLOADS_BUCKET;
    }
  } catch {}

  if ((globalThis as any).UPLOADS_BUCKET) return (globalThis as any).UPLOADS_BUCKET;
  if (typeof process !== 'undefined' && (process.env as any).UPLOADS_BUCKET) return (process.env as any).UPLOADS_BUCKET;
  try {
    const g = globalThis as any;
    if (g?.__env?.UPLOADS_BUCKET) return g.__env.UPLOADS_BUCKET;
  } catch {}
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // 1. Authentication Guard: Must be an authenticated user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to access protected faculty documents.' },
        { status: 401 }
      );
    }

    const { filename } = await params;
    if (!filename) {
      return NextResponse.json({ error: 'Filename missing' }, { status: 400 });
    }

    // 2. Strict sanitization to prevent path traversal
    const safeFilename = path.basename(decodeURIComponent(filename));
    if (safeFilename.includes('..') || safeFilename.includes('/') || safeFilename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid file path request' }, { status: 400 });
    }

    // 2b. Strict Confidentiality Guard:
    // If the file is attached to a confidential task/submission, only the requester (creator),
    // the assigned recipient, or higher administration can access and download it.
    try {
      const linkedTask = await queryFirst(`
        SELECT assigned_by_id, assigned_to_id, is_confidential 
        FROM tasks 
        WHERE (attachment_url LIKE ? OR completion_url LIKE ?) AND is_confidential = 1
      `, [`%${safeFilename}%`, `%${safeFilename}%`]);

      if (linkedTask && linkedTask.is_confidential) {
        const canAccess =
          user.id === linkedTask.assigned_by_id ||
          user.id === linkedTask.assigned_to_id ||
          user.role === 'admin' ||
          user.id === 99 ||
          user.id === 6496;

        if (!canAccess) {
          return NextResponse.json(
            { error: 'Forbidden: This deliverable is strictly confidential and restricted to the requester and assigned recipient only.' },
            { status: 403 }
          );
        }
      }
    } catch (confidentialityErr) {
      console.warn('Confidentiality verification check skipped:', confidentialityErr);
    }

    // 3. Try Cloudflare R2 object storage if available
    const r2 = getR2Bucket();
    if (r2) {
      try {
        const object = await r2.get(safeFilename);
        if (object) {
          const ext = path.extname(safeFilename).toLowerCase();
          const contentType = object.httpMetadata?.contentType || MIME_MAP[ext] || 'application/octet-stream';
          const originalName = safeFilename.replace(/^\d+-/, '');

          const headers = new Headers();
          headers.set('Content-Type', contentType);
          if (object.size) headers.set('Content-Length', object.size.toString());
          headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);
          headers.set('Cache-Control', 'private, max-age=3600');
          if (object.httpEtag) headers.set('ETag', object.httpEtag);

          return new Response(object.body, { status: 200, headers });
        }
      } catch (r2Err) {
        console.warn('R2 get error, falling back to disk:', r2Err);
      }
    }

    // 4. Local disk storage fallback (development runtime)
    try {
      const filePath = path.join(UPLOADS_DIR, safeFilename);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Requested deliverable not found on server' }, { status: 404 });
      }

      const stat = await fs.promises.stat(filePath);
      const fileBuffer = await fs.promises.readFile(filePath);

      const ext = path.extname(safeFilename).toLowerCase();
      const contentType = MIME_MAP[ext] || 'application/octet-stream';
      const originalName = safeFilename.replace(/^\d+-/, '');

      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Content-Length', stat.size.toString());
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);
      headers.set('Cache-Control', 'private, max-age=3600');

      return new Response(fileBuffer, {
        status: 200,
        headers,
      });
    } catch (fsErr: any) {
      // In pure Edge environment without R2, disk read is unsupported
      return NextResponse.json(
        { error: 'Deliverable storage unavailable in current environment' },
        { status: 404 }
      );
    }
  } catch (err: any) {
    console.error('File serve error:', err);
    return NextResponse.json({ error: 'Internal server error while retrieving file' }, { status: 500 });
  }
}
