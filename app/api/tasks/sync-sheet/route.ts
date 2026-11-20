import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  executeBidirectionalSync,
  getSheetSyncHistory,
  getSheetConflicts,
} from '@/lib/sheet_sync_engine';
import { validateSpreadsheetAccess, isGoogleSheetsConfigured, getGoogleSheetsConfig } from '@/lib/google_auth';

// GET /api/tasks/sync-sheet: Audit logs, validation, or dry-run inspection
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isDeanOrAdmin = user.role === 'admin' || user.id === 6496 || user.id === 99 || user.role === 'dean';

    // 1. Audit History Request
    if (searchParams.get('history') === 'true') {
      if (!isDeanOrAdmin) {
        return NextResponse.json({ error: 'Forbidden: Leadership oversight required.' }, { status: 403 });
      }
      const history = await getSheetSyncHistory();
      const conflicts = await getSheetConflicts();
      return NextResponse.json({
        success: true,
        history,
        conflicts,
      });
    }

    // 2. Google Authentication & Spreadsheet Validation Request
    if (searchParams.get('validate') === 'true') {
      const targetId = searchParams.get('spreadsheet_id') || undefined;
      const validation = await validateSpreadsheetAccess(targetId);
      const safeConfig = getGoogleSheetsConfig();
      return NextResponse.json({
        success: true,
        status: isGoogleSheetsConfigured() ? 'configured' : 'unconfigured',
        configured: isGoogleSheetsConfigured(),
        service_account_email: safeConfig?.clientEmail || null,
        target_spreadsheet_id: safeConfig?.spreadsheetId || null,
        access: validation,
      });
    }

    // Default: Return latest sync status & configuration
    const history = await getSheetSyncHistory();
    return NextResponse.json({
      success: true,
      configured: isGoogleSheetsConfigured(),
      last_sync: history[0] || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tasks/sync-sheet: Trigger Manual or Scheduled Bidirectional Sync
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const isDeanOrAdmin = currentUser.role === 'admin' || currentUser.id === 6496 || currentUser.id === 99 || currentUser.role === 'dean';
    if (!isDeanOrAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only academic leadership can trigger synchronization.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const direction = body.direction || 'bidirectional';
    const dryRun = Boolean(body.dry_run);
    const targetSpreadsheetId = body.spreadsheet_id || undefined;
    const targetSheetName = body.sheet_name || undefined;

    const result = await executeBidirectionalSync({
      direction,
      dryRun,
      targetSpreadsheetId,
      targetSheetName,
      triggeredBy: `${currentUser.title || ''} ${currentUser.full_name}`.trim(),
    });

    if (!result.success && result.errors.some(e => e.includes('in progress'))) {
      return NextResponse.json({ error: result.errors[0], ...result }, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
