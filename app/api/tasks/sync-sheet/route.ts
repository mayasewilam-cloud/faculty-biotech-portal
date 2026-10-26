import { NextResponse } from 'next/server';
import { syncTasksFromGoogleSheet } from '@/lib/sheet_sync';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const result = await syncTasksFromGoogleSheet();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const currentUser = await getCurrentUser();
    // Allow Dean, Admin, or any logged-in faculty staff to trigger sync
    const result = await syncTasksFromGoogleSheet();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
