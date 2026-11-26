import { neon } from '@neondatabase/serverless';

export function getPgConnectionString(): string | null {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    null;
  return url && url.trim().length > 0 ? url.trim() : null;
}

export function isPgConfigured(): boolean {
  return Boolean(getPgConnectionString());
}

function getSqlClient() {
  const url = getPgConnectionString();
  if (!url) return null;
  const g = globalThis as any;
  if (!g.__neonSqlClient || g.__neonSqlUrl !== url) {
    g.__neonSqlClient = neon(url, { fullResults: true });
    g.__neonSqlUrl = url;
  }
  return g.__neonSqlClient;
}

/**
 * Translates SQLite-style SQL queries (used throughout the portal) to PostgreSQL syntax:
 * - Converts `?` placeholders (outside single-quoted literals) to `$1, $2, ...`
 * - Converts `datetime('now')` to `NOW()`
 * - Converts `INSERT OR IGNORE INTO` to `INSERT INTO ... ON CONFLICT DO NOTHING`
 * - Converts `INSERT OR REPLACE INTO push_subscriptions` to `ON CONFLICT (endpoint) DO UPDATE`
 * - Appends `RETURNING id` on integer-ID table inserts so `lastInsertRowid` is populated
 */
export function translateSqliteToPg(rawSql: string, params: any[] = []): { sql: string; params: any[]; hasReturningId: boolean } {
  let sql = rawSql.trim().replace(/;+\s*$/, '');

  // Normalize datetime('now') and datetime('now', '...')
  sql = sql.replace(/datetime\(\s*'now'\s*\)/gi, 'NOW()');
  sql = sql.replace(/datetime\(\s*'now'\s*,\s*'([^']+)'\s*\)/gi, "NOW() + INTERVAL '$1'");

  // Convert SQLite double-quoted string literals inside IN (...) e.g. ("dean", "admin") -> ('dean', 'admin')
  sql = sql.replace(/IN\s*\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/gi, "IN ('$1', '$2')");

  const isInsertOrIgnore = /^INSERT\s+OR\s+IGNORE\s+INTO\s+/i.test(sql);
  if (isInsertOrIgnore) {
    sql = sql.replace(/^INSERT\s+OR\s+IGNORE\s+INTO\s+/i, 'INSERT INTO ');
  }

  const isInsertOrReplacePush = /^INSERT\s+OR\s+REPLACE\s+INTO\s+push_subscriptions\b/i.test(sql);
  if (isInsertOrReplacePush) {
    sql = sql.replace(/^INSERT\s+OR\s+REPLACE\s+INTO\s+/i, 'INSERT INTO ');
  }

  // Replace ? placeholders outside single-quoted string literals
  let paramIndex = 0;
  let inSingleQuote = false;
  let out = '';
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") {
      out += ch;
      if (inSingleQuote && sql[i + 1] === "'") {
        out += "'";
        i++;
      } else {
        inSingleQuote = !inSingleQuote;
      }
    } else if (ch === '?' && !inSingleQuote) {
      paramIndex++;
      out += `$${paramIndex}`;
    } else {
      out += ch;
    }
  }
  sql = out;

  if (isInsertOrIgnore && !/\bON\s+CONFLICT\b/i.test(sql)) {
    sql += ' ON CONFLICT DO NOTHING';
  }

  if (isInsertOrReplacePush && !/\bON\s+CONFLICT\b/i.test(sql)) {
    sql += ' ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, keys = EXCLUDED.keys, updated_at = NOW()';
  }

  // Append RETURNING id for INSERT into auto-increment integer tables
  let hasReturningId = false;
  if (/^INSERT\s+INTO\s+(users|tasks|activity_logs|hats|hat_members|meetings|committees|push_subscriptions)\b/i.test(sql) && !/\bRETURNING\b/i.test(sql)) {
    sql += ' RETURNING id';
    hasReturningId = true;
  }

  return { sql, params, hasReturningId };
}

export async function ensurePgSchemaAndSeed(seeds: {
  staff: any[];
  hats: any[];
  hatMembers: Array<{ hat_id: number; user_id: number }>;
  committees: any[];
  tasks: any[];
  logs: any[];
}): Promise<void> {
  const client = getSqlClient();
  if (!client) return;

  const g = globalThis as any;
  if (g.__pgSchemaReady) return;
  if (g.__pgSchemaPromise) {
    await g.__pgSchemaPromise;
    return;
  }

  g.__pgSchemaPromise = (async () => {
    const ddlStatements = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        title TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        phone TEXT,
        avatar TEXT,
        status TEXT DEFAULT 'active',
        custom_password_set INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_password_set INTEGER DEFAULT 0`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        assigned_by_id INTEGER NOT NULL,
        assigned_to_id INTEGER NOT NULL,
        department TEXT NOT NULL,
        hat_id INTEGER,
        hat_name TEXT,
        committee_id INTEGER,
        committee_name TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        deadline TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        completion_notes TEXT,
        completion_url TEXT,
        completed_at TEXT,
        dean_feedback TEXT,
        dean_acknowledged INTEGER DEFAULT 0,
        attachment_name TEXT,
        attachment_type TEXT,
        attachment_size INTEGER,
        attachment_url TEXT,
        tr INTEGER,
        start_date TEXT,
        due_time TEXT,
        comment_type TEXT,
        received_by TEXT,
        form_link TEXT,
        submission_type TEXT,
        is_confidential INTEGER DEFAULT 0,
        request_prompt TEXT,
        group_id TEXT,
        task_owner_id INTEGER,
        task_owner_name TEXT,
        requires_dean_approval INTEGER DEFAULT 0,
        responsibility_model TEXT DEFAULT 'standard',
        parent_task_id INTEGER,
        drive_link TEXT,
        action_plan TEXT,
        assigned_members TEXT,
        supervisor TEXT,
        pillar TEXT,
        source TEXT DEFAULT 'portal',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        action_type TEXT NOT NULL,
        task_id INTEGER,
        title TEXT NOT NULL,
        details TEXT,
        metadata TEXT,
        ip_address TEXT DEFAULT '127.0.0.1',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS hats (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT DEFAULT '🎩',
        color TEXT DEFAULT '#3b82f6',
        created_by_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS hat_members (
        id SERIAL PRIMARY KEY,
        hat_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        assigned_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(hat_id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS meetings (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'departmental',
        hat_id INTEGER,
        hat_name TEXT,
        committee_id INTEGER,
        committee_name TEXT,
        date TEXT NOT NULL,
        location TEXT NOT NULL,
        chair TEXT NOT NULL,
        rapporteur TEXT,
        objective TEXT,
        attendees TEXT,
        agenda TEXT,
        minutes_body TEXT,
        decisions TEXT,
        action_items TEXT,
        dean_briefing TEXT,
        recurrence TEXT,
        is_dean_request INTEGER DEFAULT 0,
        time_options TEXT,
        dean_notes TEXT,
        status TEXT NOT NULL DEFAULT 'approved',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by_id INTEGER NOT NULL,
        created_by_name TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS committees (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        name_ar TEXT,
        category TEXT NOT NULL DEFAULT 'standing',
        decree_ref TEXT,
        chair_id INTEGER NOT NULL,
        chair_name TEXT NOT NULL,
        chair_title TEXT,
        rapporteur_id INTEGER NOT NULL,
        rapporteur_name TEXT NOT NULL,
        rapporteur_title TEXT,
        description TEXT,
        mandates TEXT,
        pillar_code TEXT,
        pillar_name TEXT,
        icon TEXT DEFAULT '🏛️',
        color TEXT DEFAULT '#3b82f6',
        members TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT,
        auth TEXT,
        keys TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS dean_availability_slots (
        id TEXT PRIMARY KEY,
        day_of_week TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        location TEXT DEFAULT 'Dean''s Office (Building A, Room 301)',
        note TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_by_id INTEGER NOT NULL,
        purpose TEXT DEFAULT 'recovery',
        used_at TIMESTAMPTZ,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_email TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        related_task_id INTEGER,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        read_at TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
    ];

    for (const stmt of ddlStatements) {
      await client.query(stmt, []);
    }

    // Seed official staff safely without ever overwriting user-changed passwords or crashing on email conflicts
    for (const u of seeds.staff) {
      const normalizedEmail = String(u.email).toLowerCase().trim();
      try {
        await client.query(
          `INSERT INTO users (id, email, password_hash, full_name, title, role, department, phone, avatar, status, custom_password_set)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', 0)
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             full_name = EXCLUDED.full_name,
             title = EXCLUDED.title,
             role = EXCLUDED.role,
             department = EXCLUDED.department,
             avatar = EXCLUDED.avatar`,
          [
            u.id,
            normalizedEmail,
            u.password_hash,
            u.full_name,
            u.title,
            u.role,
            u.department,
            u.phone || null,
            u.avatar || null,
          ]
        );
      } catch {
        // If email already exists under a legacy ID, update profile fields by email without touching password_hash
        try {
          await client.query(
            `UPDATE users SET full_name = $1, title = $2, role = $3, department = $4, avatar = $5 WHERE LOWER(email) = $6`,
            [u.full_name, u.title, u.role, u.department, u.avatar || null, normalizedEmail]
          );
        } catch {}
      }
    }

    // Seed Hats if empty
    const hatCountRes = await client.query('SELECT COUNT(*)::int AS c FROM hats', []);
    if ((hatCountRes.rows[0]?.c || 0) === 0 && seeds.hats.length > 0) {
      for (const h of seeds.hats) {
        await client.query(
          `INSERT INTO hats (id, name, description, icon, color, created_by_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [h.id, h.name, h.description || '', h.icon || '🎩', h.color || '#3b82f6', h.created_by_id || 6496]
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('hats', 'id'), COALESCE((SELECT MAX(id) FROM hats), 1))`, []);

      for (const hm of seeds.hatMembers) {
        await client.query(
          `INSERT INTO hat_members (hat_id, user_id) VALUES ($1, $2) ON CONFLICT (hat_id, user_id) DO NOTHING`,
          [hm.hat_id, hm.user_id]
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('hat_members', 'id'), COALESCE((SELECT MAX(id) FROM hat_members), 1))`, []);
    }

    // Seed Committees if empty
    const commCountRes = await client.query('SELECT COUNT(*)::int AS c FROM committees', []);
    if ((commCountRes.rows[0]?.c || 0) === 0 && seeds.committees.length > 0) {
      for (const c of seeds.committees) {
        await client.query(
          `INSERT INTO committees (
            id, code, name, name_ar, category, decree_ref, chair_id, chair_name, chair_title,
            rapporteur_id, rapporteur_name, rapporteur_title, description, mandates,
            pillar_code, pillar_name, icon, color, members
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
          ON CONFLICT (code) DO NOTHING`,
          [
            c.id,
            c.code,
            c.name,
            c.name_ar || null,
            c.category || 'standing',
            c.decree_ref || null,
            c.chair_id,
            c.chair_name,
            c.chair_title || null,
            c.rapporteur_id,
            c.rapporteur_name,
            c.rapporteur_title || null,
            c.description || null,
            typeof c.mandates === 'string' ? c.mandates : JSON.stringify(c.mandates || []),
            c.pillar_code || null,
            c.pillar_name || null,
            c.icon || '🏛️',
            c.color || '#3b82f6',
            typeof c.members === 'string' ? c.members : JSON.stringify(c.members || []),
          ]
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('committees', 'id'), COALESCE((SELECT MAX(id) FROM committees), 1))`, []);
    }

    // Seed Fall 2026 Tasks if empty
    const taskCountRes = await client.query('SELECT COUNT(*)::int AS c FROM tasks', []);
    if ((taskCountRes.rows[0]?.c || 0) === 0 && seeds.tasks.length > 0) {
      for (const t of seeds.tasks) {
        await client.query(
          `INSERT INTO tasks (
            id, title, description, assigned_by_id, assigned_to_id, department, hat_id, hat_name,
            priority, deadline, status, completion_notes, completion_url, completed_at, dean_acknowledged,
            tr, start_date, due_time, comment_type, received_by, form_link,
            assigned_members, supervisor, pillar, source
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
          ON CONFLICT (id) DO NOTHING`,
          [
            t.id,
            t.title,
            t.description || t.title,
            t.assigned_by_id || 6496,
            t.assigned_to_id || 6496,
            t.department || 'Academic Staff',
            t.hat_id || null,
            t.hat_name || null,
            t.priority || 'medium',
            t.deadline || new Date().toISOString(),
            t.status || 'pending',
            t.completion_notes || null,
            t.completion_url || null,
            t.completed_at || null,
            t.dean_acknowledged ? 1 : 0,
            t.tr || null,
            t.start_date || null,
            t.due_time || null,
            t.comment_type || null,
            t.received_by || null,
            t.form_link || null,
            t.assigned_members ? (typeof t.assigned_members === 'string' ? t.assigned_members : JSON.stringify(t.assigned_members)) : null,
            t.supervisor || null,
            t.pillar || null,
            t.source || 'seed',
          ]
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('tasks', 'id'), COALESCE((SELECT MAX(id) FROM tasks), 1))`, []);
    }

    // Seed initial activity logs if empty
    const logCountRes = await client.query('SELECT COUNT(*)::int AS c FROM activity_logs', []);
    if ((logCountRes.rows[0]?.c || 0) === 0 && seeds.logs.length > 0) {
      for (const l of seeds.logs) {
        await client.query(
          `INSERT INTO activity_logs (id, user_id, user_name, user_role, action_type, task_id, title, details, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [l.id, l.user_id, l.user_name, l.user_role, l.action_type, l.task_id || null, l.title, l.details || null, l.ip_address || '127.0.0.1']
        );
      }
      await client.query(`SELECT setval(pg_get_serial_sequence('activity_logs', 'id'), COALESCE((SELECT MAX(id) FROM activity_logs), 1))`, []);
    }

    g.__pgSchemaReady = true;
  })().catch((err) => {
    g.__pgSchemaPromise = null;
    console.error('[NEON PG INIT ERROR]', err);
  });

  await g.__pgSchemaPromise;
}

export async function pgQueryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const client = getSqlClient();
  if (!client) return [];
  const translated = translateSqliteToPg(sql, params);
  const res = await client.query(translated.sql, translated.params);
  return (res?.rows || []) as T[];
}

export async function pgQueryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await pgQueryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function pgExecute(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  const client = getSqlClient();
  if (!client) return { lastInsertRowid: 0, changes: 0 };
  const translated = translateSqliteToPg(sql, params);
  const res = await client.query(translated.sql, translated.params);
  const lastInsertRowid = translated.hasReturningId && res?.rows?.[0]?.id ? Number(res.rows[0].id) : 0;
  const changes = Number(res?.rowCount ?? 0);
  return { lastInsertRowid, changes };
}
