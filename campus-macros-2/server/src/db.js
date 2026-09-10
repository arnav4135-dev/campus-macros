// Database layer. One driver (libSQL) for both:
//   - local dev:  TURSO_DATABASE_URL unset  → file:./data/tracker.db
//   - hosted:     TURSO_DATABASE_URL=libsql://…  + TURSO_AUTH_TOKEN  (Turso free tier; pure-HTTP client, runs inside Netlify Functions)
// All calls are async. SQL is SQLite dialect everywhere.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const remoteUrl = process.env.TURSO_DATABASE_URL;
let client;
if (remoteUrl) {
  const { createClient } = await import('@libsql/client/web');
  client = createClient({ url: remoteUrl, authToken: process.env.TURSO_AUTH_TOKEN });
} else {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const { createClient } = await import('@libsql/client');
  client = createClient({ url: `file:${path.join(dataDir, 'tracker.db')}` });
}

export const db = {
  async get(sql, args = []) { return (await client.execute({ sql, args })).rows[0] ?? null; },
  async all(sql, args = []) { return (await client.execute({ sql, args })).rows; },
  async run(sql, args = []) { const r = await client.execute({ sql, args }); return { changes: r.rowsAffected, lastInsertRowid: r.lastInsertRowid == null ? null : Number(r.lastInsertRowid) }; },
  /** Atomic write batch: [[sql, args], ...] */
  async batch(stmts) { return client.batch(stmts.map(([sql, args = []]) => ({ sql, args })), 'write'); },
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sex TEXT, age INTEGER, height_cm REAL, weight_kg REAL,
  activity_level TEXT, daily_steps INTEGER, goal TEXT, weekly_rate_kg REAL,
  campus TEXT DEFAULT 'tamu',
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  effective_date TEXT NOT NULL,
  is_override INTEGER DEFAULT 0,
  calories INTEGER NOT NULL, protein INTEGER NOT NULL, carbs INTEGER NOT NULL, fat INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_targets_user_date ON targets(user_id, effective_date);
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS doc_locations (
  id TEXT PRIMARY KEY, campus TEXT NOT NULL DEFAULT 'tamu', name TEXT NOT NULL, building TEXT,
  active INTEGER DEFAULT 1, updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS menu_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campus TEXT NOT NULL DEFAULT 'tamu', date TEXT NOT NULL,
  location_id TEXT NOT NULL, location_name TEXT NOT NULL,
  period_id TEXT, period_name TEXT NOT NULL,
  status TEXT NOT NULL, error TEXT,
  fetched_at TEXT DEFAULT (datetime('now')),
  UNIQUE(date, location_id, period_name)
);
CREATE INDEX IF NOT EXISTS idx_snapshots_campus_date ON menu_snapshots(campus, date);
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id INTEGER NOT NULL REFERENCES menu_snapshots(id) ON DELETE CASCADE,
  doc_item_id TEXT, name TEXT NOT NULL, station TEXT, portion TEXT, description TEXT,
  calories REAL, protein REAL, carbs REAL, fat REAL
);
CREATE INDEX IF NOT EXISTS idx_menu_items_snapshot ON menu_items(snapshot_id);
CREATE TABLE IF NOT EXISTS restaurants (
  place_id TEXT PRIMARY KEY, campus TEXT, name TEXT NOT NULL, address TEXT, lat REAL, lng REAL,
  chain_key TEXT, menu_source TEXT, fetched_at TEXT
);
CREATE TABLE IF NOT EXISTS restaurant_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id TEXT NOT NULL REFERENCES restaurants(place_id) ON DELETE CASCADE,
  name TEXT NOT NULL, portion TEXT, calories REAL, protein REAL, carbs REAL, fat REAL, source TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rest_items_place ON restaurant_items(place_id);
CREATE TABLE IF NOT EXISTS food_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL, meal TEXT NOT NULL, name TEXT NOT NULL, source TEXT NOT NULL, source_ref TEXT,
  servings REAL DEFAULT 1, calories REAL, protein REAL, carbs REAL, fat REAL,
  estimated INTEGER DEFAULT 0, logged_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_log_user_date ON food_log(user_id, date);
`;

let migrated;
/** Idempotent; runs once per process (cheap on Turso, all IF NOT EXISTS). */
export function migrate() { return (migrated ||= client.executeMultiple(SCHEMA)); }

export const kv = {
  get: async (k) => (await db.get('SELECT value FROM kv WHERE key=?', [k]))?.value ?? null,
  set: (k, v) => db.run('INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [k, v]),
};

/** YYYY-MM-DD in Central time regardless of where the function runs. */
export function todayLocal(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: process.env.TZ || 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export function hourLocal(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: process.env.TZ || 'America/Chicago', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour').value) % 24, m = Number(parts.find((p) => p.type === 'minute').value);
  return h + m / 60;
}
export function currentMealPeriod(d = new Date()) {
  const h = hourLocal(d);
  if (h < 10.5) return 'Breakfast';
  if (h < 16) return 'Lunch';
  return 'Dinner';
}
