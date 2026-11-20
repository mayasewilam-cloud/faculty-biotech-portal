import fs from 'node:fs';
import path from 'node:path';

export interface FacultyPersistedState {
  tasks: any[];
  hats: any[];
  hat_members: any[];
  logs: any[];
  users?: any[];
  custom_users?: any[];
  meetings?: any[];
  committees?: any[];
  push_subscriptions?: any[];
  dean_availability_slots?: any[];
  password_reset_tokens?: any[];
  notifications?: any[];
  notification_queue?: any[];
  sheet_mappings?: any[];
  sheet_sync_logs?: any[];
  sheet_conflicts?: any[];
}

// On serverless environments (Vercel, AWS Lambda), process.cwd() is read-only.
// /tmp is guaranteed to be writable across functions on the same container.
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.TMPDIR);

const PRIMARY_DIR = isServerless 
  ? path.join(process.env.TMPDIR || '/tmp', '.faculty_portal') 
  : path.join(process.cwd(), '.local');

const FALLBACK_TMP_DIR = path.join(process.env.TMPDIR || '/tmp', '.faculty_portal');

function ensureDirectoryExists(targetDir: string): boolean {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return true;
  } catch {
    return false;
  }
}

function getWritableDir(): string {
  if (ensureDirectoryExists(PRIMARY_DIR)) {
    try {
      const probe = path.join(PRIMARY_DIR, `.probe_${process.pid}.tmp`);
      fs.writeFileSync(probe, '1', 'utf8');
      fs.unlinkSync(probe);
      return PRIMARY_DIR;
    } catch {}
  }

  ensureDirectoryExists(FALLBACK_TMP_DIR);
  return FALLBACK_TMP_DIR;
}

const MAX_BACKUPS = 5;

// Concurrency write lock queue
let writeQueue: Promise<void> = Promise.resolve();
let lastBackupTime = 0;

export function validateStateIntegrity(data: any): data is FacultyPersistedState {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (!Array.isArray(data.tasks)) return false;
  if (!Array.isArray(data.hats)) return false;
  return true;
}

function rotateBackups(backupDir: string): void {
  try {
    if (!fs.existsSync(backupDir)) return;
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('faculty_storage_backup_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time); // newest first

    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      for (const file of toDelete) {
        try { fs.unlinkSync(file.path); } catch {}
      }
    }
  } catch (err) {
    console.warn('Backup rotation error:', err);
  }
}

export async function saveStateToDisk(data: FacultyPersistedState): Promise<void> {
  // Validate integrity before persisting to avoid writing broken state
  if (!validateStateIntegrity(data)) {
    console.error('[STORAGE WARNING] Attempted to save invalid state data to disk; aborted.');
    return;
  }

  // Queue write sequentially to prevent concurrent file contention
  writeQueue = writeQueue.then(async () => {
    try {
      const dir = getWritableDir();
      const backupDir = path.join(dir, 'backups');
      const file = path.join(dir, 'faculty_storage.json');

      ensureDirectoryExists(dir);
      ensureDirectoryExists(backupDir);

      const content = JSON.stringify(data, null, 2);

      // 1. Atomic write using temporary file + rename
      const tmpFile = path.join(
        dir,
        `faculty_storage.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
      );
      fs.writeFileSync(tmpFile, content, 'utf8');
      fs.renameSync(tmpFile, file);

      // 2. Create timestamped backup snapshot (throttled to at most once every 5 seconds)
      const now = Date.now();
      if (now - lastBackupTime > 5000) {
        lastBackupTime = now;
        const backupFile = path.join(backupDir, `faculty_storage_backup_${now}.json`);
        fs.copyFileSync(file, backupFile);
        rotateBackups(backupDir);
      }
    } catch (err) {
      console.error('[STORAGE ERROR] Failed atomic write to disk:', err);
    }
  });

  return writeQueue;
}

export async function loadStateFromDisk(): Promise<FacultyPersistedState | null> {
  try {
    const candidateDirs = [
      PRIMARY_DIR,
      FALLBACK_TMP_DIR,
      path.join(process.cwd(), '.local'),
    ];

    for (const dir of candidateDirs) {
      const mainFile = path.join(dir, 'faculty_storage.json');
      if (fs.existsSync(mainFile)) {
        try {
          const content = fs.readFileSync(mainFile, 'utf8');
          const data = JSON.parse(content);
          if (validateStateIntegrity(data)) {
            return data;
          }
        } catch (parseErr) {
          console.error('[STORAGE CORRUPTION] Primary file corrupted in:', dir, parseErr);
        }
      }

      // Check backups in this directory
      const backupDir = path.join(dir, 'backups');
      if (fs.existsSync(backupDir)) {
        try {
          const backupFiles = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('faculty_storage_backup_') && f.endsWith('.json'))
            .map(f => ({
              path: path.join(backupDir, f),
              time: fs.statSync(path.join(backupDir, f)).mtimeMs
            }))
            .sort((a, b) => b.time - a.time);

          for (const backup of backupFiles) {
            try {
              const bContent = fs.readFileSync(backup.path, 'utf8');
              const bData = JSON.parse(bContent);
              if (validateStateIntegrity(bData)) {
                return bData;
              }
            } catch {}
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('[STORAGE ERROR] Failed to load state from disk:', err);
  }

  return null;
}
