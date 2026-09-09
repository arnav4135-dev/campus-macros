import { Router } from 'express';
import { db, todayLocal } from '../db.js';
import { currentTargets } from './profile.js';

export const logRouter = Router();

async function summary(userId, date) {
  const rows = await db.all('SELECT * FROM food_log WHERE user_id=? AND date=? ORDER BY logged_at', [userId, date]);
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 }, byMeal = {};
  for (const r of rows) {
    const m = byMeal[r.meal] ||= { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] };
    for (const k of Object.keys(totals)) { const v = (r[k] || 0) * (r.servings || 1); totals[k] += v; m[k] += v; }
    m.entries.push(r);
  }
  const targets = await currentTargets(userId, date);
  const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v) : v]));
  const remaining = targets ? Object.fromEntries(Object.keys(totals).map((k) => [k, Math.round(targets[k] - totals[k])])) : null;
  return { date, targets, totals: round(totals), remaining, byMeal: Object.fromEntries(Object.entries(byMeal).map(([k, v]) => [k, { ...round(v), entries: v.entries }])) };
}

logRouter.get('/', async (req, res, next) => { try { res.json(await summary(req.userId, req.query.date || todayLocal())); } catch (err) { next(err); } });

logRouter.post('/', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name || !b.meal) return res.status(400).json({ error: 'name and meal are required' });
    const date = b.date || todayLocal();
    await db.run(`INSERT INTO food_log(user_id,date,meal,name,source,source_ref,servings,calories,protein,carbs,fat,estimated) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.userId, date, b.meal, b.name, b.source || 'manual', b.source_ref || null, b.servings || 1, b.calories ?? null, b.protein ?? null, b.carbs ?? null, b.fat ?? null, b.estimated ? 1 : 0]);
    res.json(await summary(req.userId, date));
  } catch (err) { next(err); }
});

logRouter.delete('/:id', async (req, res, next) => {
  try {
    const row = await db.get('SELECT date FROM food_log WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    if (!row) return res.status(404).json({ error: 'Entry not found' });
    await db.run('DELETE FROM food_log WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    res.json(await summary(req.userId, row.date));
  } catch (err) { next(err); }
});
