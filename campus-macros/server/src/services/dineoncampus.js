/**
 * DineOnCampus scraper — UNOFFICIAL / PERSONAL USE.
 * Hits the JSON endpoints the dineoncampus.com web app calls. No published API; may change without notice.
 *
 *   GET /v1/locations/all_locations?platform=0&site_id=<SITE>&for_menus=true&with_address=false&with_buildings=true
 *   GET /v1/location/<LOC>/periods/?platform=0&date=YYYY-MM-DD              -> periods[] + default period's menu
 *   GET /v1/location/<LOC>/periods/<PERIOD>?platform=0&date=YYYY-MM-DD      -> menu.periods.categories[].items[] (nutrients[])
 *
 * Designed for serverless: `scrapeStale()` works through locations that have no fresh snapshot today and stops
 * when its time budget runs out, so repeated short runs (a scheduled function every 10 min, or the Refresh button)
 * converge on a complete menu without any single run exceeding ~8 s.
 */
import { db, kv } from '../db.js';
import { campus as getCampus, CAMPUSES } from '../campuses.js';

const API = 'https://api.dineoncampus.com/v1';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const STALE_HOURS = 4;   // re-pull a location this often so meal-period edits show up

async function getJson(url, { retries = 1, timeoutMs = 4000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs),
        headers: { 'User-Agent': UA, Accept: 'application/json, text/plain, */*', Origin: 'https://dineoncampus.com', Referer: 'https://dineoncampus.com/' } });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}: ${text.slice(0, 120)}`);
      return JSON.parse(text);
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

export async function getSiteId(campusKey = 'tamu') {
  const c = getCampus(campusKey);
  const envOverride = process.env[`DOC_SITE_ID_${c.key.toUpperCase()}`];
  if (envOverride) return envOverride;
  const cached = await kv.get(`doc_site_id:${c.key}`);
  if (cached) return cached;
  const slug = c.slug.toLowerCase();
  try {
    const data = await getJson(`${API}/sites/${slug}?platform=0`);
    const id = data?.site?.id || data?.site?._id || data?.id;
    if (id) { await kv.set(`doc_site_id:${c.key}`, id); return id; }
  } catch { /* fall through */ }
  try {
    const data = await getJson(`${API}/sites/public_sites?platform=0`);
    const list = data?.sites || data?.data || [];
    const hit = list.find((s) => (s.slug || s.site_slug || '').toLowerCase() === slug || c.match.test(s.name || ''));
    if (hit?.id) { await kv.set(`doc_site_id:${c.key}`, hit.id); return hit.id; }
  } catch { /* fall through */ }
  throw new Error(`Could not auto-discover DineOnCampus site_id for ${c.name}. Open https://dineoncampus.com/${c.slug} in Chrome, DevTools > Network, filter "all_locations", copy the site_id query param into the env as DOC_SITE_ID_${c.key.toUpperCase()}.`);
}

/** Refresh the location list for a campus (at most once a day) and return it. */
export async function syncLocations(campusKey = 'tamu', { force = false } = {}) {
  const stamp = await kv.get(`locations_synced:${campusKey}`);
  const today = new Date().toISOString().slice(0, 10);
  if (!force && stamp === today) {
    const rows = await db.all('SELECT id,campus,name,building FROM doc_locations WHERE campus=? AND active=1 ORDER BY building,name', [campusKey]);
    if (rows.length) return rows;
  }
  const siteId = await getSiteId(campusKey);
  const data = await getJson(`${API}/locations/all_locations?platform=0&site_id=${siteId}&for_menus=true&with_address=false&with_buildings=true`);
  const rows = [];
  for (const b of data?.buildings || []) for (const loc of b.locations || []) {
    if (!loc.show_menus) continue;
    rows.push({ id: loc.id, campus: campusKey, name: loc.name, building: b.name, active: loc.active !== false ? 1 : 0 });
  }
  if (rows.length) {
    await db.batch(rows.map((r) => [`INSERT INTO doc_locations(id,campus,name,building,active,updated_at) VALUES(?,?,?,?,?,datetime('now'))
      ON CONFLICT(id) DO UPDATE SET campus=excluded.campus,name=excluded.name,building=excluded.building,active=excluded.active,updated_at=excluded.updated_at`,
      [r.id, r.campus, r.name, r.building, r.active]]));
    await kv.set(`locations_synced:${campusKey}`, today);
  }
  return rows.filter((r) => r.active);
}

const nutrient = (item, ...names) => {
  for (const n of item.nutrients || []) {
    const nm = (n.name || '').toLowerCase();
    if (names.some((x) => nm.startsWith(x))) { const v = parseFloat(n.value_numeric ?? n.value); if (!Number.isNaN(v)) return v; }
  }
  return null;
};
function parseItems(menuPeriod) {
  const out = [];
  for (const cat of menuPeriod?.categories || []) for (const it of cat.items || []) {
    out.push({ doc_item_id: it.id, name: it.name, station: cat.name, portion: it.portion || null, description: it.desc || null,
      calories: nutrient(it, 'calories') ?? (it.calories ? parseFloat(it.calories) : null),
      protein: nutrient(it, 'protein'), carbs: nutrient(it, 'total carbohydrate', 'carbohydrate', 'carbs'), fat: nutrient(it, 'total fat', 'fat') });
  }
  return out;
}

async function recordSnapshot({ date, location, period, status, error = null, items }) {
  const existing = await db.get('SELECT id FROM menu_snapshots WHERE date=? AND location_id=? AND period_name=?', [date, location.id, period.name]);
  const stmts = [];
  let snapId = existing?.id;
  if (existing) {
    if (status === 'error') return;   // never clobber a good snapshot with an error
    stmts.push(['DELETE FROM menu_items WHERE snapshot_id=?', [snapId]]);
    stmts.push([`UPDATE menu_snapshots SET period_id=?, status=?, error=?, fetched_at=datetime('now') WHERE id=?`, [period.id || null, status, error, snapId]]);
  } else {
    const r = await db.run(`INSERT INTO menu_snapshots(campus,date,location_id,location_name,period_id,period_name,status,error) VALUES(?,?,?,?,?,?,?,?)`,
      [location.campus || 'tamu', date, location.id, location.name, period.id || null, period.name, status, error]);
    snapId = r.lastInsertRowid;
  }
  for (const it of items) stmts.push([`INSERT INTO menu_items(snapshot_id,doc_item_id,name,station,portion,description,calories,protein,carbs,fat) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    [snapId, it.doc_item_id, it.name, it.station, it.portion, it.description, it.calories, it.protein, it.carbs, it.fat]]);
  if (stmts.length) await db.batch(stmts);
}

/** Scrape one location for one date: every period it publishes. */
export async function scrapeLocation(location, date) {
  const base = `${API}/location/${location.id}/periods`;
  let first;
  try { first = await getJson(`${base}/?platform=0&date=${date}`); }
  catch (err) { await recordSnapshot({ date, location, period: { name: 'All' }, status: 'error', error: err.message, items: [] }); return { location: location.name, status: 'error', error: err.message }; }
  if (first?.closed) { await recordSnapshot({ date, location, period: { name: 'All' }, status: 'closed', items: [] }); return { location: location.name, status: 'closed' }; }
  const results = [];
  for (const p of first?.periods || []) {
    try {
      const data = first?.menu?.periods?.id === p.id ? first : await getJson(`${base}/${p.id}?platform=0&date=${date}`);
      const items = data?.closed ? [] : parseItems(data?.menu?.periods);
      await recordSnapshot({ date, location, period: p, status: data?.closed ? 'closed' : 'ok', items });
      results.push({ period: p.name, items: items.length });
    } catch (err) {
      await recordSnapshot({ date, location, period: p, status: 'error', error: err.message, items: [] });
      results.push({ period: p.name, error: err.message });
    }
  }
  return { location: location.name, status: 'ok', periods: results };
}

/** Locations whose newest snapshot for `date` is missing or older than STALE_HOURS. */
export async function staleLocations(campusKey, date) {
  const locations = await syncLocations(campusKey);
  const fresh = await db.all(`SELECT location_id, MAX(fetched_at) f FROM menu_snapshots WHERE campus=? AND date=? AND status<>'error'
    GROUP BY location_id HAVING f > datetime('now', ?)`, [campusKey, date, `-${STALE_HOURS} hours`]);
  const freshIds = new Set(fresh.map((r) => r.location_id));
  return locations.filter((l) => !freshIds.has(l.id));
}

/** Scrape stale locations for a campus until the time budget is spent. Safe to call repeatedly. */
export async function scrapeStale({ campus = 'tamu', date, budgetMs = 8000 } = {}) {
  const started = Date.now();
  const stale = await staleLocations(campus, date);
  const done = [];
  for (const loc of stale) {
    if (Date.now() - started > budgetMs) break;
    done.push(await scrapeLocation(loc, date));
  }
  await kv.set(`last_scrape:${campus}`, JSON.stringify({ date, at: new Date().toISOString(), scraped: done.length, remaining: stale.length - done.length }));
  return { campus, date, scraped: done, remaining: stale.length - done.length, ms: Date.now() - started };
}

/** One scheduler tick: give each campus a slice of the budget. */
export async function scrapeTick({ date, budgetMs = 8000 }) {
  const keys = Object.keys(CAMPUSES);
  const out = {};
  for (const key of keys) {
    try { out[key] = await scrapeStale({ campus: key, date, budgetMs: budgetMs / keys.length }); }
    catch (err) { out[key] = { error: err.message }; }
  }
  return out;
}

/** Read menus for a campus + date (+ optional period / location). */
export async function getMenu({ campus = 'tamu', date, period, locationId }) {
  let sql = `SELECT s.id snapshot_id, s.location_id, s.location_name, s.period_name, s.status, s.fetched_at FROM menu_snapshots s WHERE s.campus=? AND s.date=?`;
  const args = [campus, date];
  if (period) { sql += ' AND s.period_name IN (?, ?)'; args.push(period, 'Everyday'); }
  if (locationId) { sql += ' AND s.location_id=?'; args.push(locationId); }
  sql += ' ORDER BY s.location_name, s.period_name';
  const snaps = await db.all(sql, args);
  const ids = snaps.filter((s) => s.status === 'ok').map((s) => s.snapshot_id);
  const items = ids.length ? await db.all(`SELECT id,snapshot_id,doc_item_id,name,station,portion,description,calories,protein,carbs,fat FROM menu_items WHERE snapshot_id IN (${ids.map(() => '?').join(',')}) ORDER BY station,name`, ids) : [];
  return snaps.map((s) => ({ ...s, items: items.filter((i) => i.snapshot_id === s.snapshot_id) }));
}
