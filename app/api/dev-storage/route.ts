import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const LOCAL_DIR = path.join(process.cwd(), '.local');
const LOCAL_FILE = path.join(LOCAL_DIR, 'faculty_storage.json');

// Helper to check if caller is an authorized Super Admin / Dean in non-production environment
async function verifyDevStorageAccess() {
  // 1. Strictly block any access in production environments
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Not Found', status: 404 };
  }

  // 2. Require active authentication session
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Unauthorized: Authentication required to access development storage', status: 401 };
  }

  // 3. Require Super Admin / Dean privileges
  const isSuperAdminOrDean = user.role === 'admin' || user.role === 'dean' || user.id === 6496 || user.email === 'gehan.safwat@msa.edu.eg';
  if (!isSuperAdminOrDean) {
    return { error: 'Forbidden: Insufficient permissions to access development storage', status: 403 };
  }

  return { ok: true, user };
}

export async function GET() {
  const auth = await verifyDevStorageAccess();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
      return NextResponse.json({ ok: true, data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data: null });
}

export async function POST(req: Request) {
  const auth = await verifyDevStorageAccess();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    if (!fs.existsSync(LOCAL_DIR)) {
      fs.mkdirSync(LOCAL_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
