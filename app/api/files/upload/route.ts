import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const UPLOADS_DIR = path.join(process.cwd(), '.local', 'uploads');

// Ensure uploads directory exists for local development
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

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

// Allowed academic deliverable file extensions
const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg',
  '.zip', '.txt', '.csv'
]);

// Block dangerous executable extensions
const DISALLOWED_EXTENSIONS = new Set([
  '.exe', '.sh', '.bat', '.cmd', '.js', '.mjs', '.php', '.phtml', '.py', '.vbs', '.scr', '.bin'
]);

export async function POST(req: Request) {
  try {
    // 1. Authentication Guard: Must be logged-in faculty or leadership user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged into the Faculty Portal to upload deliverables.' },
        { status: 401 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in form data' }, { status: 400 });
    }

    // 2. File size enforcement: 25 MB max limit
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowable limit of 25 MB' },
        { status: 413 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Empty file detected. Deliverable files must contain data.' },
        { status: 400 }
      );
    }

    // 3. Extension & Type Validation
    const rawName = path.basename(file.name || 'document');
    const ext = path.extname(rawName).toLowerCase();

    if (DISALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `Executable or script upload prohibited (${ext}). Only academic documents, spreadsheets, slides, images, and archives are allowed.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_EXTENSIONS.has(ext) && ext !== '') {
      return NextResponse.json(
        { error: `Unsupported file extension (${ext}). Allowed formats: PDF, DOCX, XLSX, PPTX, Images, ZIP, CSV, TXT.` },
        { status: 400 }
      );
    }

    // 4. Filename sanitization against path traversal
    const timestamp = Date.now();
    const baseCleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedFilename = `${timestamp}-${baseCleanName}`;

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Cloudflare R2 vs Local Dev Storage
    const r2 = getR2Bucket();
    if (r2) {
      await r2.put(storedFilename, buffer, {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
        customMetadata: {
          originalName: file.name,
          size: file.size.toString(),
          uploadedByUserId: String(user.id),
          uploadedByName: user.full_name,
        },
      });
    } else {
      // Local development disk storage fallback with graceful error handling
      try {
        ensureUploadsDir();
        const destinationPath = path.join(UPLOADS_DIR, storedFilename);
        await fs.promises.writeFile(destinationPath, buffer);
      } catch (fsErr: any) {
        console.error('Storage backend error:', fsErr);
        return NextResponse.json(
          { error: 'Storage backend unavailable. Cloudflare R2 bucket binding required in production environments.' },
          { status: 503 }
        );
      }
    }

    const fileUrl = `/api/files/${encodeURIComponent(storedFilename)}`;

    return NextResponse.json({
      ok: true,
      name: file.name,
      filename: storedFilename,
      storedFilename,
      type: file.type || 'application/octet-stream',
      size: file.size,
      url: fileUrl,
      uploadedBy: user.full_name,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while processing upload' },
      { status: 500 }
    );
  }
}
