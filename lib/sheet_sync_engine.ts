import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createSheetsClient, getGoogleSheetsConfig, isGoogleSheetsConfigured } from './google_auth';
import { loadStateFromDisk, saveStateToDisk, FacultyPersistedState } from './storage';
import { INITIAL_STAFF_SEED, QUADRUPLET_ALIASES } from './staff_seed';
import { execute } from './db';

export interface SheetTaskMapping {
  portal_task_id: number;
  spreadsheet_id: string;
  sheet_name: string;
  sheet_gid?: string;
  row_number: number;
  external_record_id: string; // e.g., "TR-102"
  last_synced_at: string;
  last_synced_version: string; // SHA-256 hash of core fields
  last_sync_direction: 'inbound' | 'outbound';
}

export interface SyncConflict {
  id: string;
  task_id: number;
  external_record_id: string;
  field: string;
  portal_value: any;
  sheet_value: any;
  resolution: 'preserved_portal' | 'applied_sheet' | 'manual_review_required';
  details: string;
  timestamp: string;
}

export interface SheetSyncLog {
  id: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  timestamp: string;
  triggered_by: string;
  records_processed: number;
  records_added: number;
  records_updated: number;
  records_skipped: number;
  conflicts_detected: number;
  errors: string[];
  completion_status: 'success' | 'partial' | 'failed';
  dry_run: boolean;
}

export interface BidirectionalSyncOptions {
  direction?: 'inbound' | 'outbound' | 'bidirectional';
  dryRun?: boolean;
  targetSpreadsheetId?: string;
  targetSheetName?: string;
  triggeredBy?: string;
  allowDeletions?: boolean;
}

export interface BidirectionalSyncResult {
  success: boolean;
  syncId: string;
  direction: 'inbound' | 'outbound' | 'bidirectional';
  dryRun: boolean;
  sheets: string[];
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsSkipped: number;
  conflictsDetected: number;
  conflicts: SyncConflict[];
  errors: string[];
  timestamp: string;
}

// ─────────────────────────────────────────────────────────────
// CROSS-PROCESS SYNCHRONIZATION LOCKING
// ─────────────────────────────────────────────────────────────
let isSyncInProgress = false;
const LOCK_TIMEOUT_MS = 30000; // 30s stale lock threshold

function getLockFilePath(): string {
  if (process.cwd().includes('.next') || fs.existsSync(path.join(process.cwd(), '.local'))) {
    return path.join(process.cwd(), '.local', 'sheet_sync.lock');
  }
  const standaloneLocal = path.join(process.cwd(), '.next', 'standalone', '.local');
  if (fs.existsSync(standaloneLocal)) {
    return path.join(standaloneLocal, 'sheet_sync.lock');
  }
  return path.join(process.cwd(), '.local', 'sheet_sync.lock');
}

function acquireProcessLock(syncId: string): boolean {
  const lockFile = getLockFilePath();
  try {
    const lockDir = path.dirname(lockFile);
    if (!fs.existsSync(lockDir)) {
      fs.mkdirSync(lockDir, { recursive: true });
    }

    if (fs.existsSync(lockFile)) {
      try {
        const raw = fs.readFileSync(lockFile, 'utf8');
        const lockData = JSON.parse(raw);
        if (Date.now() - Number(lockData.timestamp) < LOCK_TIMEOUT_MS) {
          return false; // Active lock held
        }
      } catch {
        // Unparseable lock file, safe to overwrite
      }
    }

    fs.writeFileSync(lockFile, JSON.stringify({
      syncId,
      pid: process.pid,
      timestamp: Date.now()
    }), { flag: 'w' });
    return true;
  } catch {
    return false;
  }
}

function releaseProcessLock(): void {
  const lockFile = getLockFilePath();
  try {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  } catch {}
}

// ─────────────────────────────────────────────────────────────
// DATE SERIAL & FORMAT CONVERSION HELPER
// ─────────────────────────────────────────────────────────────
export function parseSheetDate(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  if (!str) return '';

  // 1. Google Sheets / Excel numeric serial date (e.g. 45596)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    // Excel epoch Dec 30 1899 -> Unix Jan 1 1970 is 25569 days
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  // 2. ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }

  // 3. Slash format MM/DD/YYYY or M/D/YYYY
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) {
    const month = mdy[1].padStart(2, '0');
    const day = mdy[2].padStart(2, '0');
    const year = mdy[3];
    return `${year}-${month}-${day}`;
  }

  return str.slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
// 1. ASSIGNEE RESOLUTION HELPER
// ─────────────────────────────────────────────────────────────
export function resolveAssignee(rawOwner: string) {
  if (!rawOwner || typeof rawOwner !== 'string') {
    return {
      id: 6496,
      name: 'Prof. Dr. Gehan Safwat',
      email: 'gehan.safwat@msa.edu.eg',
      title: 'Dean',
      role: 'dean',
      department: 'Faculty Administration',
    };
  }

  const clean = rawOwner.toLowerCase().trim();
  const normAlpha = (t: string) => t.toLowerCase().replace(/^(prof\.|dr\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.|l\.a\.|t\.a\.|mrs\.)\s*/, '').replace(/[^a-z0-9]/g, '');
  const cleanNorm = normAlpha(clean);

  let targetName = clean;
  for (const [k, v] of Object.entries(QUADRUPLET_ALIASES || {})) {
    if (normAlpha(k) === cleanNorm) {
      targetName = v;
      break;
    }
  }

  const targetNorm = normAlpha(targetName);
  for (const u of INITIAL_STAFF_SEED) {
    const uNorm = normAlpha(u.full_name);
    if (uNorm === targetNorm || uNorm.includes(targetNorm) || targetNorm.includes(uNorm)) {
      return {
        id: u.id,
        name: u.full_name,
        email: u.email,
        title: u.title,
        role: u.role,
        department: u.department,
      };
    }
  }

  const mTokens = clean.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2 && !['prof', 'dr', 'la', 'ta', 'mrs', 'ms'].includes(t));
  if (mTokens.length >= 1) {
    for (const u of INITIAL_STAFF_SEED) {
      const uTokens = u.full_name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 2 && !['prof', 'dr', 'la', 'ta', 'mrs', 'ms'].includes(t));
      if (mTokens.length >= 2 && uTokens.length >= 2) {
        if (mTokens[0] === uTokens[0] && (mTokens[mTokens.length - 1] === uTokens[uTokens.length - 1] || mTokens[1] === uTokens[1])) {
          return {
            id: u.id,
            name: u.full_name,
            email: u.email,
            title: u.title,
            role: u.role,
            department: u.department,
          };
        }
      } else if (mTokens.length >= 1 && uTokens.length >= 1) {
        if (mTokens[0] === uTokens[0]) {
          return {
            id: u.id,
            name: u.full_name,
            email: u.email,
            title: u.title,
            role: u.role,
            department: u.department,
          };
        }
      }
    }
  }

  return {
    id: 6496,
    name: rawOwner,
    email: 'gehan.safwat@msa.edu.eg',
    title: 'Dean',
    role: 'dean',
    department: 'Faculty Administration',
  };
}

// ─────────────────────────────────────────────────────────────
// 2. VERSION HASH GENERATOR (For detecting authentic content edits)
// ─────────────────────────────────────────────────────────────
export function computeTaskVersionHash(task: {
  title?: string;
  priority?: string;
  deadline?: string;
  status?: string;
  assignee_id?: number | string;
  dean_acknowledged?: number | boolean;
}): string {
  const payload = [
    (task.title || '').trim().toLowerCase(),
    (task.priority || 'medium').toLowerCase(),
    (task.deadline || '').slice(0, 10),
    (task.status || 'pending').toLowerCase(),
    String(task.assignee_id || ''),
    Boolean(task.dean_acknowledged) ? '1' : '0',
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ─────────────────────────────────────────────────────────────
// 3. TAB MATCHING & ALIAS NORMALIZATION
// ─────────────────────────────────────────────────────────────
function matchSheetTab(tabTitle: string, targetName?: string): boolean {
  if (!targetName) return true;
  const tNorm = tabTitle.trim().toLowerCase();
  const qNorm = targetName.trim().toLowerCase();

  if (tNorm === qNorm) return true;
  // Handle "November" query matching official sheet tab "Novamber"
  if ((qNorm === 'november' || qNorm === 'nov') && (tNorm === 'novamber' || tNorm === 'november')) {
    return true;
  }
  // Handle trailing spaces (e.g., "October " vs "October")
  if (tNorm.replace(/\s+/g, '') === qNorm.replace(/\s+/g, '')) {
    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// 4. BIDIRECTIONAL SYNCHRONIZATION ENGINE
// ─────────────────────────────────────────────────────────────
export async function executeBidirectionalSync(
  options: BidirectionalSyncOptions = {}
): Promise<BidirectionalSyncResult> {
  const syncId = `sync_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const direction = options.direction || 'bidirectional';
  const dryRun = Boolean(options.dryRun);
  const triggeredBy = options.triggeredBy || 'system';

  // Check in-process mutex
  if (isSyncInProgress) {
    return {
      success: false,
      syncId,
      direction,
      dryRun,
      sheets: [],
      recordsProcessed: 0,
      recordsAdded: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      conflictsDetected: 0,
      conflicts: [],
      errors: ['Another synchronization operation is currently in progress (in-process mutex locked).'],
      timestamp: new Date().toISOString(),
    };
  }

  // Check cross-process file lock
  if (!acquireProcessLock(syncId)) {
    return {
      success: false,
      syncId,
      direction,
      dryRun,
      sheets: [],
      recordsProcessed: 0,
      recordsAdded: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      conflictsDetected: 0,
      conflicts: [],
      errors: ['Another synchronization operation is currently in progress (cross-process lock active).'],
      timestamp: new Date().toISOString(),
    };
  }

  isSyncInProgress = true;
  const errors: string[] = [];
  const conflicts: SyncConflict[] = [];

  let recordsProcessed = 0;
  let recordsAdded = 0;
  let recordsUpdated = 0;
  let recordsSkipped = 0;
  const synchronizedSheets: string[] = [];

  try {
    const state = await loadStateFromDisk();
    if (!state) {
      throw new Error('Failed to load portal database state from storage.');
    }

    const g = globalThis as any;
    const tasks: any[] = g.__memoryTasks || state.tasks || [];
    const mappings: SheetTaskMapping[] = g.__sheetMappings || state.sheet_mappings || [];
    const syncLogs: SheetSyncLog[] = g.__sheetSyncLogs || state.sheet_sync_logs || [];
    const recordedConflicts: SyncConflict[] = g.__sheetConflicts || state.sheet_conflicts || [];

    const sheetsClient = createSheetsClient();
    const config = getGoogleSheetsConfig();
    const spreadsheetId = options.targetSpreadsheetId || config?.spreadsheetId || '18ptos5jsQWknMQUy9AEjhhyAlCvmlU_LreOlHALGUcA';

    // ─────────────────────────────────────────────────────────────
    // STAGE A: INBOUND SYNCHRONIZATION (Google Sheets -> Portal)
    // ─────────────────────────────────────────────────────────────
    if (direction === 'inbound' || direction === 'bidirectional') {
      let sheetTabs: Array<{ title: string; sheetId: number }> = [];

      if (sheetsClient && isGoogleSheetsConfigured()) {
        try {
          const meta = await sheetsClient.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties(sheetId,title)',
          });
          sheetTabs = (meta.data.sheets || []).map(s => ({
            title: s.properties?.title || 'Sheet1',
            sheetId: s.properties?.sheetId || 0,
          }));
        } catch (apiErr: any) {
          errors.push(`Google Sheets API metadata read failed: ${apiErr.message}`);
        }
      }

      // Complete official fallback sheets matching live spreadsheet tabs
      if (sheetTabs.length === 0) {
        sheetTabs = [
          { title: 'September', sheetId: 1987431836 },
          { title: 'October ', sheetId: 1549628634 },
          { title: 'Novamber', sheetId: 1427365837 }, // Live sheet spelling
        ];
      }

      for (const tab of sheetTabs) {
        if (!matchSheetTab(tab.title, options.targetSheetName)) {
          continue;
        }

        synchronizedSheets.push(tab.title);

        let rows: string[][] = [];

        // 1. Try Google Sheets API v4
        if (sheetsClient && isGoogleSheetsConfigured()) {
          try {
            const range = `'${tab.title}'!A1:J200`;
            const sheetData = await sheetsClient.spreadsheets.values.get({ spreadsheetId, range });
            rows = (sheetData.data.values || []) as string[][];
          } catch (readErr: any) {
            errors.push(`Failed to read sheet tab "${tab.title}": ${readErr.message}`);
          }
        }

        // 2. Fallback to public CSV export if API is unconfigured
        if (rows.length === 0) {
          try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${tab.sheetId}`;
            const csvRes = await fetch(csvUrl, { cache: 'no-store' });
            if (csvRes.ok) {
              const text = await csvRes.text();
              rows = text.split(/\r?\n/).filter(Boolean).map(line => line.split(',').map(s => s.replace(/^"|"$/g, '').trim()));
            }
          } catch (fetchErr: any) {
            errors.push(`Fallback fetch for tab "${tab.title}" failed: ${fetchErr.message}`);
          }
        }

        if (rows.length <= 1) continue;

        // Locate header row
        let headerRowIdx = 0;
        for (let r = 0; r < Math.min(rows.length, 5); r++) {
          const joined = rows[r].join(' ').toLowerCase();
          if (joined.includes('task') || joined.includes('priority')) {
            headerRowIdx = r;
            break;
          }
        }

        const headers = rows[headerRowIdx].map(h => (h || '').toLowerCase().trim());
        const trCol = headers.findIndex(h => h === 'tr' || h.includes('tr') || h.includes('#'));
        const taskCol = headers.findIndex(h => h.includes('task') && !h.includes('owner'));
        const priorityCol = headers.findIndex(h => h.includes('priority'));
        const ownerCol = headers.findIndex(h => h.includes('owner'));
        const statusCol = headers.findIndex(h => h.includes('status'));
        const commentCol = headers.findIndex(h => h.includes('comment'));
        const startCol = headers.findIndex(h => h.includes('start'));
        const dueCol = headers.findIndex(h => h.includes('due') && !h.includes('time'));
        const timeCol = headers.findIndex(h => h.includes('time'));
        const receivedCol = headers.findIndex(h => h.includes('received'));

        // Disambiguation tracker for duplicate TR numbers in the same tab
        const seenTrCount = new Map<string, number>();

        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          recordsProcessed++;

          const rawTitle = (taskCol !== -1 ? row[taskCol] : row[1] || '').trim();
          if (!rawTitle) {
            recordsSkipped++;
            continue;
          }

          const rawTr = (trCol !== -1 ? row[trCol] : row[0] || '').trim();
          const rawPriority = (priorityCol !== -1 ? row[priorityCol] : row[2] || '').trim();
          const rawOwner = (ownerCol !== -1 ? row[ownerCol] : row[3] || '').trim();
          const rawStatus = (statusCol !== -1 ? row[statusCol] : row[4] || '').trim();
          const rawComment = (commentCol !== -1 ? row[commentCol] : row[5] || '').trim();
          const rawStart = (startCol !== -1 ? row[startCol] : row[6] || '').trim();
          const rawDue = (dueCol !== -1 ? row[dueCol] : row[7] || '').trim();
          const rawDueTime = (timeCol !== -1 ? row[timeCol] : row[8] || '').trim();
          const rawReceived = (receivedCol !== -1 ? row[receivedCol] : row[9] || '').trim();

          // Handle duplicate TR numbers in the same sheet tab
          let externalRecordId: string;
          if (rawTr) {
            const count = (seenTrCount.get(rawTr) || 0) + 1;
            seenTrCount.set(rawTr, count);
            externalRecordId = count > 1 ? `TR-${rawTr}#${count}` : `TR-${rawTr}`;
          } else {
            externalRecordId = `SHEET-${tab.sheetId}-R${r + 1}`;
          }

          const assignee = resolveAssignee(rawOwner);

          const mappedPriority = rawPriority.toLowerCase().includes('urgent')
            ? 'urgent'
            : (rawPriority.toLowerCase().includes('inter') || rawPriority.toLowerCase().includes('med'))
              ? 'medium'
              : 'low';

          const mappedStatus = (rawStatus.toLowerCase().includes('complete') || rawStatus.toLowerCase().includes('done'))
            ? 'done'
            : rawStatus.toLowerCase().includes('progress')
              ? 'in_progress'
              : 'pending';

          const startDate = parseSheetDate(rawStart);
          const deadline = parseSheetDate(rawDue) || (startDate || '2026-11-15');

          // ─────────────────────────────────────────────────────────
          // STRICT STABLE IDENTITY RESOLUTION (INDEPENDENT OF ROW & TITLE)
          // NEVER auto-merge records solely based on normalized title similarity!
          // ─────────────────────────────────────────────────────────
          let existingMapping = mappings.find(
            m => m.spreadsheet_id === spreadsheetId &&
                 m.sheet_name === tab.title &&
                 m.external_record_id === externalRecordId
          );

          let matchingTask: any = null;
          if (existingMapping) {
            matchingTask = tasks.find(t => t.id === existingMapping!.portal_task_id);
          } else if (rawTr) {
            // Match exclusively by unique TR tracking number when TR is present
            matchingTask = tasks.find(t => String(t.tr) === String(rawTr));
          }

          const sheetVersionHash = computeTaskVersionHash({
            title: rawTitle,
            priority: mappedPriority,
            deadline,
            status: mappedStatus,
            assignee_id: assignee.id,
          });

          if (matchingTask) {
            // Check for conflicts:
            const portalVersionHash = computeTaskVersionHash(matchingTask);

            // Conflict Scenario: Dean approved in portal, but spreadsheet says not done
            if (matchingTask.dean_acknowledged === 1 && mappedStatus !== 'done') {
              const conflict: SyncConflict = {
                id: `cnf_${Date.now()}_${matchingTask.id}`,
                task_id: matchingTask.id,
                external_record_id: externalRecordId,
                field: 'status',
                portal_value: 'done (Dean Approved)',
                sheet_value: mappedStatus,
                resolution: 'preserved_portal',
                details: 'Preserved Dean executive approval over unverified spreadsheet status.',
                timestamp: new Date().toISOString(),
              };
              conflicts.push(conflict);
              recordedConflicts.push(conflict);
            } else if (matchingTask.status === 'revision_requested' && mappedStatus === 'done') {
              const conflict: SyncConflict = {
                id: `cnf_${Date.now()}_${matchingTask.id}`,
                task_id: matchingTask.id,
                external_record_id: externalRecordId,
                field: 'status',
                portal_value: 'revision_requested',
                sheet_value: 'done',
                resolution: 'preserved_portal',
                details: 'Preserved Dean revision request over external sheet edit.',
                timestamp: new Date().toISOString(),
              };
              conflicts.push(conflict);
              recordedConflicts.push(conflict);
            } else if (portalVersionHash !== sheetVersionHash) {
              // Standard inbound update: Apply sheet changes while preserving portal metadata
              if (!dryRun) {
                matchingTask.priority = mappedPriority;
                matchingTask.deadline = deadline;
                matchingTask.start_date = startDate || matchingTask.start_date;
                matchingTask.due_time = rawDueTime || matchingTask.due_time;
                matchingTask.task_owner_name = rawOwner || matchingTask.task_owner_name;
                matchingTask.status = mappedStatus;
                matchingTask.updated_at = new Date().toISOString();
                if (mappedStatus === 'done' && !matchingTask.dean_acknowledged) {
                  matchingTask.dean_acknowledged = 1;
                  matchingTask.completed_at = matchingTask.completed_at || new Date().toISOString();
                }
              }
              recordsUpdated++;
            } else {
              recordsSkipped++;
            }

            // Update or establish persistent mapping
            if (!dryRun) {
              if (existingMapping) {
                existingMapping.row_number = r + 1;
                existingMapping.last_synced_at = new Date().toISOString();
                existingMapping.last_synced_version = sheetVersionHash;
                existingMapping.last_sync_direction = 'inbound';
              } else {
                mappings.push({
                  portal_task_id: matchingTask.id,
                  spreadsheet_id: spreadsheetId,
                  sheet_name: tab.title,
                  sheet_gid: String(tab.sheetId),
                  row_number: r + 1,
                  external_record_id: externalRecordId,
                  last_synced_at: new Date().toISOString(),
                  last_synced_version: sheetVersionHash,
                  last_sync_direction: 'inbound',
                });
              }
            }
          } else {
            // Inbound New Task creation:
            const maxId = tasks.reduce((m, t) => Math.max(m, Number(t.id) || 0), 100);
            const newTaskId = maxId + 1;

            const newTaskRecord = {
              id: newTaskId,
              tr: rawTr ? Number(rawTr) : newTaskId,
              title: rawTitle,
              description: `Synchronized from academic follow-up tracker (${tab.title}).`,
              assigned_by_id: 6496,
              assigned_to_id: assignee.id,
              department: assignee.department,
              priority: mappedPriority,
              deadline,
              start_date: startDate || new Date().toISOString().slice(0, 10),
              due_time: rawDueTime || 'Not Specified',
              status: mappedStatus,
              dean_acknowledged: mappedStatus === 'done' ? 1 : 0,
              completed_at: mappedStatus === 'done' ? new Date().toISOString() : null,
              comment_type: rawComment,
              received_by: rawReceived,
              task_owner_id: assignee.id,
              task_owner_name: rawOwner,
              requires_dean_approval: 0,
              responsibility_model: 'standard',
              month_sheet: tab.title,
              source: 'sheet',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              assignee_name: assignee.name,
              assignee_title: assignee.title,
              assignee_email: assignee.email,
              assignee_role: assignee.role,
              assignee_department: assignee.department,
              creator_name: 'Prof. Dr. Gehan Safwat',
              creator_title: 'Dean of Faculty',
            };

            if (!dryRun) {
              tasks.push(newTaskRecord);
              mappings.push({
                portal_task_id: newTaskId,
                spreadsheet_id: spreadsheetId,
                sheet_name: tab.title,
                sheet_gid: String(tab.sheetId),
                row_number: r + 1,
                external_record_id: externalRecordId,
                last_synced_at: new Date().toISOString(),
                last_synced_version: sheetVersionHash,
                last_sync_direction: 'inbound',
              });
            }
            recordsAdded++;
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STAGE B: OUTBOUND SYNCHRONIZATION (Portal -> Google Sheets)
    // ─────────────────────────────────────────────────────────────
    if (direction === 'outbound' || direction === 'bidirectional') {
      const activeSheetName = options.targetSheetName || synchronizedSheets[0] || 'September';

      const portalTasksToSync = tasks.filter(t => t.status !== 'archived');

      for (const pt of portalTasksToSync) {
        let mapping = mappings.find(m => m.portal_task_id === pt.id);
        const currentVersionHash = computeTaskVersionHash(pt);

        // OUTBOUND RECOVERY CHECK: If mapping is missing, check if sheet already has this TR
        if (!mapping && pt.tr) {
          const existingExternal = mappings.find(m => m.external_record_id === `TR-${pt.tr}`);
          if (existingExternal) {
            existingExternal.portal_task_id = pt.id;
            mapping = existingExternal;
          }
        }

        if (mapping) {
          // Task already has a row in Google Sheets: check if modified in portal
          if (mapping.last_synced_version !== currentVersionHash) {
            recordsProcessed++;

            if (sheetsClient && isGoogleSheetsConfigured() && !dryRun) {
              try {
                const rowRange = `'${mapping.sheet_name}'!A${mapping.row_number}:J${mapping.row_number}`;
                const rowValues = [
                  [
                    pt.tr || pt.id,
                    pt.title,
                    pt.priority?.toUpperCase() || 'MEDIUM',
                    pt.task_owner_name || pt.assignee_name || 'Faculty Member',
                    pt.dean_acknowledged ? 'Completed (Dean Approved)' : (pt.status === 'done' ? 'Completed' : (pt.status === 'in_progress' ? 'In Progress' : 'Pending')),
                    pt.comment_type || (pt.status === 'revision_requested' ? 'Revision Requested' : ''),
                    pt.start_date || '',
                    pt.deadline || '',
                    pt.due_time || 'Not Specified',
                    pt.dean_acknowledged ? 'Prof. Dr. Gehan Safwat (Verified)' : (pt.received_by || ''),
                  ]
                ];

                await sheetsClient.spreadsheets.values.update({
                  spreadsheetId,
                  range: rowRange,
                  valueInputOption: 'USER_ENTERED',
                  requestBody: { values: rowValues },
                });

                mapping.last_synced_at = new Date().toISOString();
                mapping.last_synced_version = currentVersionHash;
                mapping.last_sync_direction = 'outbound';
                recordsUpdated++;
              } catch (upErr: any) {
                errors.push(`Failed outbound update for Task #${pt.id}: ${upErr.message}`);
              }
            } else {
              recordsUpdated++;
            }
          }
        } else if (pt.source === 'portal') {
          // Brand new portal directive created in UI: Append to designated sheet tab
          recordsProcessed++;

          if (sheetsClient && isGoogleSheetsConfigured() && !dryRun) {
            try {
              const appendRange = `'${activeSheetName}'!A:J`;
              const appendValues = [
                [
                  pt.tr || pt.id,
                  pt.title,
                  pt.priority?.toUpperCase() || 'MEDIUM',
                  pt.assignee_name || 'Faculty Member',
                  pt.dean_acknowledged ? 'Completed (Dean Approved)' : 'Pending',
                  pt.category || 'Portal Directive',
                  pt.start_date || new Date().toISOString().slice(0, 10),
                  pt.deadline || '',
                  pt.due_time || 'Not Specified',
                  'Prof. Dr. Gehan Safwat',
                ]
              ];

              const appendRes = await sheetsClient.spreadsheets.values.append({
                spreadsheetId,
                range: appendRange,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: appendValues },
              });

              // Extract assigned row number from updated range (e.g., "September!A45:J45")
              const updatedRange = appendRes.data.updates?.updatedRange || '';
              const match = updatedRange.match(/A(\d+)/);
              const assignedRow = match ? parseInt(match[1], 10) : 100;

              mappings.push({
                portal_task_id: pt.id,
                spreadsheet_id: spreadsheetId,
                sheet_name: activeSheetName,
                row_number: assignedRow,
                external_record_id: `TR-${pt.tr || pt.id}`,
                last_synced_at: new Date().toISOString(),
                last_synced_version: currentVersionHash,
                last_sync_direction: 'outbound',
              });
              recordsAdded++;
            } catch (appErr: any) {
              errors.push(`Failed outbound append for Task #${pt.id}: ${appErr.message}`);
            }
          } else {
            recordsAdded++;
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // STAGE C: PERSIST AUDIT LOG & UPDATED STATE
    // ─────────────────────────────────────────────────────────────
    const syncStatus: 'success' | 'partial' | 'failed' =
      errors.length === 0 ? 'success' : (recordsAdded > 0 || recordsUpdated > 0 ? 'partial' : 'failed');

    const syncLogEntry: SheetSyncLog = {
      id: syncId,
      direction,
      timestamp: new Date().toISOString(),
      triggered_by: triggeredBy,
      records_processed: recordsProcessed,
      records_added: recordsAdded,
      records_updated: recordsUpdated,
      records_skipped: recordsSkipped,
      conflicts_detected: conflicts.length,
      errors,
      completion_status: syncStatus,
      dry_run: dryRun,
    };

    syncLogs.unshift(syncLogEntry);
    if (syncLogs.length > 50) syncLogs.pop(); // retain last 50 logs

    if (!dryRun) {
      g.__memoryTasks = tasks;
      g.__sheetMappings = mappings;
      g.__sheetSyncLogs = syncLogs;
      g.__sheetConflicts = recordedConflicts;

      state.tasks = tasks;
      state.sheet_mappings = mappings;
      state.sheet_sync_logs = syncLogs;
      state.sheet_conflicts = recordedConflicts;
      await saveStateToDisk(state);

      // Record activity log
      try {
        await execute(`
          INSERT INTO activity_logs (user_id, user_name, user_role, action_type, title, details, metadata, ip_address)
          VALUES (?, ?, ?, 'SHEET_SYNC_COMPLETED', ?, ?, ?, '127.0.0.1')
        `, [
          6496,
          'Dean Prof. Dr. Gehan Safwat',
          'dean',
          `Bidirectional Sheet Sync: ${direction.toUpperCase()} (${syncStatus.toUpperCase()})`,
          `Processed: ${recordsProcessed}, Added: ${recordsAdded}, Updated: ${recordsUpdated}, Conflicts: ${conflicts.length}. DryRun: ${dryRun}`,
          JSON.stringify(syncLogEntry)
        ]);
      } catch {}
    }

    return {
      success: syncStatus !== 'failed',
      syncId,
      direction,
      dryRun,
      sheets: synchronizedSheets,
      recordsProcessed,
      recordsAdded,
      recordsUpdated,
      recordsSkipped,
      conflictsDetected: conflicts.length,
      conflicts,
      errors,
      timestamp: new Date().toISOString(),
    };
  } finally {
    isSyncInProgress = false;
    releaseProcessLock();
  }
}

export async function getSheetSyncHistory(): Promise<SheetSyncLog[]> {
  const g = globalThis as any;
  if (Array.isArray(g.__sheetSyncLogs) && g.__sheetSyncLogs.length > 0) {
    return g.__sheetSyncLogs;
  }
  const state = await loadStateFromDisk();
  return state?.sheet_sync_logs || [];
}

export async function getSheetConflicts(): Promise<SyncConflict[]> {
  const g = globalThis as any;
  if (Array.isArray(g.__sheetConflicts) && g.__sheetConflicts.length > 0) {
    return g.__sheetConflicts;
  }
  const state = await loadStateFromDisk();
  return state?.sheet_conflicts || [];
}
