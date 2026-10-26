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
}

const LOCAL_DIR = path.join(process.cwd(), '.local');
const LOCAL_FILE = path.join(LOCAL_DIR, 'faculty_storage.json');

export async function saveStateToDisk(data: FacultyPersistedState): Promise<void> {
  try {
    if (!fs.existsSync(LOCAL_DIR)) {
      fs.mkdirSync(LOCAL_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Graceful fallback
  }
}

export async function loadStateFromDisk(): Promise<FacultyPersistedState | null> {
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const content = fs.readFileSync(LOCAL_FILE, 'utf8');
      const data = JSON.parse(content);
      if (data && Array.isArray(data.tasks) && Array.isArray(data.hats)) {
        return data;
      }
    }
  } catch {
    // Graceful fallback
  }
  return null;
}
