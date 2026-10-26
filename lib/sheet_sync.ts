import { persistCurrentState } from './db';
import { ALL_FACULTY_STAFF } from './public_staff';

const SPREADSHEET_ID = '18ptos5jsQWknMQUy9AEjhhyAlCvmlU_LreOlHALGUcA';

const KNOWN_ALIASES: Record<string, number> = {
  'nada hassan elgazzar': 13072, // LA. Nada El-Gazzar
  'habiba khaled abdelrazek abdelaziz moussa': 15169, // TA. Habiba Moussa
  'mustafa mahmoud mohamed elbakry': 14509, // TA. Mohamed Fahim
  'youssef ali salah-eldeen aboulkheir': 14353, // LA. Youssef Kheir
  'rawan salah bahaaeldein sayed': 15241, // LA. Rawan Aly
  'maram ahmed adel': 11633, // LA. Maram El-Demerdash
  'yara ahmed muhammed muhammed': 11103, // Dr. Yara Aly
  'nouran yehia hamed hemida': 12600, // LA. Nouran Hamida
  'abdel aziz mohamed nasr': 13820, // LA. Abdel Saleh
  'sara badwai fathy badawi': 13347, // TA. Sara El-Gharably
  'amr mohamed ageez': 6591, // Prof. Dr. Amr Ageez
  'salma ahmed effat mohamed': 12426, // LA. Salma Raouf
  'hala moataz abdelhameed hassan': 15655, // TA. Hala Khorshid
  'ahmed tamer mohamed abd elwa': 15728, // TA. Ahmed Mohamed
  'mennat allah gamal mohamed hussein': 14686, // Ms. Menna Hussein
  'abdelrahman saad kamel mohamed': 10213, // Dr. Abdel Mahmoud
  'maya hany mohamed abd elfattah': 13988, // TA. Maya Sweilam
  'chahd wael hassan fahmy': 15654, // TA. Shahd Fahmy
  'asmaa abdel-hamed abdel-hamed saleh': 9783, // Ms. Asmaa Saleh
  'ahmed mohamed refaat elsayed': 12230, // Dr. Ahmed Mohamed
  'nashwa mahmoud rizk mahmoud': 13886, // Ms. Nashwa Mahmoud
  'hebatallah kamal abdel fattah': 12698, // Ms. Heba Mohamed
  'yasmin abdel latif mahmoud': 11093, // Dr. Zahra Hussein
};

function resolveAssignee(rawOwner: string) {
  if (!rawOwner) {
    return {
      id: 6496,
      name: 'Prof. Dr. Gehan Safwat',
      email: 'gehan.safwat@msa.edu.eg',
      title: 'Prof. Dr.',
      role: 'admin',
      department: 'Faculty Leadership',
    };
  }

  const clean = rawOwner.toLowerCase().trim();
  if (KNOWN_ALIASES[clean]) {
    const targetId = KNOWN_ALIASES[clean];
    const found = ALL_FACULTY_STAFF.find(u => u.id === targetId);
    if (found) {
      return {
        id: found.id,
        name: found.full_name,
        email: found.email,
        title: found.rank || found.title,
        role: found.role,
        department: found.department,
      };
    }
  }

  // Token matching
  for (const u of ALL_FACULTY_STAFF) {
    const uClean = u.full_name.toLowerCase().replace(/^(prof\.|dr\.|ms\.|mr\.|eng\.|la\.|ta\.|ra\.)\s*/, '').trim();
    if (clean.includes(uClean) || uClean.includes(clean)) {
      return {
        id: u.id,
        name: u.full_name,
        email: u.email,
        title: u.rank || u.title,
        role: u.role,
        department: u.department,
      };
    }
  }

  return {
    id: 14686,
    name: rawOwner,
    email: 'biotech.faculty@msa.edu.eg',
    title: 'Faculty Member',
    role: 'staff',
    department: 'Academic Staff',
  };
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let inQuotes = false;
    let field = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

export interface SheetSyncResult {
  success: boolean;
  sheets: string[];
  totalTasks: number;
  added: number;
  updated: number;
  removed: number;
  timestamp: string;
  error?: string;
}

export async function syncTasksFromGoogleSheet(): Promise<SheetSyncResult> {
  try {
    // 1. Discover all sheets and their gids
    const htmlUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/htmlview`;
    const res = await fetch(htmlUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to load Google Sheet htmlview (status ${res.status})`);
    }

    const html = await res.text();
    const regex = /name:\s*"([^"]+)"[^}]*?gid:\s*"(\d+)"/g;
    const sheets: { name: string; gid: string }[] = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      sheets.push({ name: match[1].trim(), gid: match[2] });
    }

    if (sheets.length === 0) {
      sheets.push({ name: 'September', gid: '1987431836' });
      sheets.push({ name: 'October ', gid: '1549628634' });
    }

    // 2. Fetch and parse each sheet
    const sheetTasks: any[] = [];
    let globalTr = 1;

    for (const sheet of sheets) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${sheet.gid}`;
        const csvRes = await fetch(csvUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
        if (!csvRes.ok) continue;

        const csvText = await csvRes.text();
        const rows = parseCSV(csvText);

        let headerIdx = -1;
        for (let r = 0; r < Math.min(rows.length, 6); r++) {
          const joined = rows[r].join(' ').toLowerCase();
          if (joined.includes('task') && (joined.includes('owner') || joined.includes('priority') || joined.includes('status'))) {
            headerIdx = r;
            break;
          }
        }

        if (headerIdx === -1) continue;

        const header = rows[headerIdx].map(h => h.toLowerCase());
        const taskCol = header.findIndex(h => h.includes('task') && !h.includes('owner'));
        const priorityCol = header.findIndex(h => h.includes('priority'));
        const ownerCol = header.findIndex(h => h.includes('owner'));
        const statusCol = header.findIndex(h => h.includes('status'));
        const commentCol = header.findIndex(h => h.includes('comment'));
        const startCol = header.findIndex(h => h.includes('start'));
        const dueCol = header.findIndex(h => h.includes('due') && !h.includes('time'));
        const timeCol = header.findIndex(h => h.includes('time'));
        const receivedCol = header.findIndex(h => h.includes('received'));

        for (let r = headerIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          const rawTitle = (taskCol !== -1 ? row[taskCol] : row[0] || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
          if (!rawTitle) continue;

          const rawOwner = (ownerCol !== -1 ? row[ownerCol] : row[2] || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
          const rawPriority = (priorityCol !== -1 ? row[priorityCol] : row[1] || '').trim();
          const rawStatus = (statusCol !== -1 ? row[statusCol] : row[3] || '').trim();
          const rawComment = (commentCol !== -1 ? row[commentCol] : row[4] || '').trim();
          const rawStartDate = (startCol !== -1 ? row[startCol] : row[5] || '').trim();
          const rawDueDate = (dueCol !== -1 ? row[dueCol] : row[6] || '').trim();
          const rawDueTime = (timeCol !== -1 ? row[timeCol] : row[7] || '').trim();
          const rawReceived = (receivedCol !== -1 ? row[receivedCol] : row[8] || '').trim();

          const assignee = resolveAssignee(rawOwner);

          const priority = rawPriority.toLowerCase().includes('urgent')
            ? 'urgent'
            : (rawPriority.toLowerCase().includes('inter') || rawPriority.toLowerCase().includes('med'))
              ? 'medium'
              : 'low';

          const status = (rawStatus.toLowerCase().includes('complete') || rawStatus.toLowerCase().includes('done'))
            ? 'done'
            : rawStatus.toLowerCase().includes('progress')
              ? 'in_progress'
              : 'pending';

          const startDate = rawStartDate ? rawStartDate.slice(0, 10) : '';
          const deadline = rawDueDate ? rawDueDate.slice(0, 10) : (startDate || '2026-10-31');

          sheetTasks.push({
            tr: globalTr++,
            sheet: sheet.name,
            title: rawTitle,
            task_owner_name: rawOwner,
            priority,
            status,
            comment_type: rawComment,
            start_date: startDate,
            deadline,
            due_time: rawDueTime || 'Not Specified',
            received_by: rawReceived || (rawOwner ? '' : 'Prof. Dr. Gehan Safwat'),
            assignee_id: assignee.id,
            assignee_name: assignee.name,
            assignee_title: assignee.title,
            assignee_email: assignee.email,
            assignee_role: assignee.role,
            assignee_department: assignee.department,
            department: assignee.department,
          });
        }
      } catch (err) {
        console.warn(`Error parsing sheet ${sheet.name}:`, err);
      }
    }

    // 3. Integrate with current memory/database tasks
    const g = globalThis as any;
    if (!g.__memoryTasks) {
      g.__memoryTasks = [];
    }

    const currentTasks: any[] = g.__memoryTasks || [];
    let added = 0;
    let updated = 0;
    let removed = 0;

    // Create a key for sheet tasks: title.toLowerCase().trim()
    const sheetTaskMap = new Map<string, any>();
    for (const st of sheetTasks) {
      sheetTaskMap.set(st.title.toLowerCase().trim(), st);
    }

    // A) Process existing tasks:
    // Retain only tasks created via portal ("Insert New Task") OR valid sheet tasks.
    const newTasksList: any[] = [];
    for (const t of currentTasks) {
      const tKey = (t.title || '').toLowerCase().trim();
      if (t.source === 'portal' || t.source === 'manual') {
        // Portal-created task ("Insert New Task") -> ALWAYS KEEP
        newTasksList.push(t);
      } else if (sheetTaskMap.has(tKey)) {
        // Task still exists in sheet: update fields while preserving portal notes/edits
        const st = sheetTaskMap.get(tKey)!;
        t.source = 'sheet';
        t.tr = st.tr;
        t.priority = st.priority;
        t.month_sheet = st.sheet;
        t.task_owner_name = st.task_owner_name;
        t.start_date = st.start_date;
        t.deadline = st.deadline;
        t.due_time = st.due_time;
        t.received_by = st.received_by;
        if (st.comment_type && !t.comment_type) {
          t.comment_type = st.comment_type;
        }
        // If status was already edited to 'done' in portal by Dean or owner, preserve it
        if (t.status !== 'done') {
          t.status = st.status;
        }
        newTasksList.push(t);
        sheetTaskMap.delete(tKey); // mark as processed
        updated++;
      } else if (t.source === 'sheet') {
        // Was synced from sheet, but was REMOVED from the sheet -> REMOVE from portal!
        removed++;
      }
      // Any other old legacy prototype tasks not in the sheet and not from portal are pruned!
    }

    // B) Add new tasks that are in the sheet but not yet in the portal
    let maxId = currentTasks.reduce((max, t) => Math.max(max, Number(t.id) || 0), 100);

    for (const [_, st] of sheetTaskMap.entries()) {
      maxId++;
      newTasksList.push({
        id: maxId,
        tr: st.tr,
        title: st.title,
        description: `Official Fall 2026 task from faculty follow-up tracker (${st.sheet}).`,
        assigned_by_id: 6496, // Prof. Dr. Gehan Safwat
        assigned_to_id: st.assignee_id,
        department: st.department,
        priority: st.priority,
        deadline: st.deadline,
        start_date: st.start_date,
        due_time: st.due_time,
        status: st.status,
        comment_type: st.comment_type,
        received_by: st.received_by,
        task_owner_id: st.assignee_id,
        task_owner_name: st.task_owner_name,
        requires_dean_approval: 0,
        responsibility_model: 'standard',
        month_sheet: st.sheet,
        source: 'sheet',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        assignee_name: st.assignee_name,
        assignee_title: st.assignee_title,
        assignee_email: st.assignee_email,
        assignee_role: st.assignee_role,
        assignee_department: st.assignee_department,
        creator_name: 'Prof. Dr. Gehan Safwat',
        creator_title: 'Dean of Faculty',
      });
      added++;
    }

    // Sort by TR
    newTasksList.sort((a, b) => (Number(a.tr) || 0) - (Number(b.tr) || 0));

    g.__memoryTasks = newTasksList;
    await persistCurrentState();

    return {
      success: true,
      sheets: sheets.map(s => s.name),
      totalTasks: newTasksList.length,
      added,
      updated,
      removed,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error during Google Sheet sync:', error);
    return {
      success: false,
      sheets: [],
      totalTasks: 0,
      added: 0,
      updated: 0,
      removed: 0,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}
