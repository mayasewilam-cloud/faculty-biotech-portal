import fs from 'node:fs';
import path from 'node:path';

export interface FacultyPersistedState {
  tasks: any[];
  hats: any[];
  hat_members: any[];
  logs: any[];
  users?: any[];
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

const LOCAL_DIR = path.join(process.cwd(), '.local');
const LOCAL_FILE = path.join(LOCAL_DIR, 'faculty_storage.json');
const BACKUP_DIR = path.join(LOCAL_DIR, 'backups');
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

function rotateBackups(): void {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('faculty_storage_backup_') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs
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
      if (!fs.existsSync(LOCAL_DIR)) {
        fs.mkdirSync(LOCAL_DIR, { recursive: true });
      }
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }

      const content = JSON.stringify(data, null, 2);

      // 1. Atomic write using temporary file + rename
      const tmpFile = path.join(
        LOCAL_DIR,
        `faculty_storage.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
      );
      fs.writeFileSync(tmpFile, content, 'utf8');
      fs.renameSync(tmpFile, LOCAL_FILE);

      // 2. Create timestamped backup snapshot (throttled to at most once every 5 seconds)
      const now = Date.now();
      if (now - lastBackupTime > 5000) {
        lastBackupTime = now;
        const backupFile = path.join(BACKUP_DIR, `faculty_storage_backup_${now}.json`);
        fs.copyFileSync(LOCAL_FILE, backupFile);
        rotateBackups();
      }
    } catch (err) {
      console.error('[STORAGE ERROR] Failed atomic write to disk:', err);
    }
  });

  return writeQueue;
}

export async function loadStateFromDisk(): Promise<FacultyPersistedState | null> {
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      try {
        const content = fs.readFileSync(LOCAL_FILE, 'utf8');
        const data = JSON.parse(content);
        if (validateStateIntegrity(data)) {
          return data;
        }
      } catch (parseErr) {
        console.error('[STORAGE CORRUPTION] Primary storage file is corrupted. Initiating backup recovery...', parseErr);
        // Quarantine corrupted file
        try {
          const corruptedFile = path.join(LOCAL_DIR, `corrupted_${Date.now()}.json`);
          fs.renameSync(LOCAL_FILE, corruptedFile);
        } catch {}
      }
    }

    // Attempt recovery from backups
    if (fs.existsSync(BACKUP_DIR)) {
      const backupFiles = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('faculty_storage_backup_') && f.endsWith('.json'))
        .map(f => ({
          path: path.join(BACKUP_DIR, f),
          time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs
        }))
        .sort((a, b) => b.time - a.time);

      for (const backup of backupFiles) {
        try {
          const bContent = fs.readFileSync(backup.path, 'utf8');
          const bData = JSON.parse(bContent);
          if (validateStateIntegrity(bData)) {
            console.log(`[STORAGE RECOVERY] Successfully recovered database state from backup: ${backup.path}`);
            // Restore recovered state to primary file
            fs.copyFileSync(backup.path, LOCAL_FILE);
            return bData;
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('[STORAGE ERROR] Failed to load state from disk:', err);
  }

  return null;
}
