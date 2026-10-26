import fs from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const LOCAL_DIR = path.join(process.cwd(), '.local');
const LOCAL_FILE = path.join(LOCAL_DIR, 'faculty_storage.json');

export async function GET() {
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
      return NextResponse.json({ ok: true, data });
    }
  } catch {}
  return NextResponse.json({ ok: true, data: null });
}

export async function POST(req: Request) {
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
