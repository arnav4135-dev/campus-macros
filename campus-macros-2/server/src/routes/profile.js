import { Router } from 'express';
import { db, todayLocal } from '../db.js';
import { recommendTargets } from '../services/targets.js';
import { CAMPUSES, DEFAULT_CAMPUS, publicCampus } from '../campuses.js';

export const profileRouter = Router();

export function currentTargets(userId, date) {
  return db.get(`SELECT calories,protein,carbs,fat,effective_date,is_override FROM targets
    WHERE user_id=? AND ((is_override=1 AND effective_date=?) OR (is_override=0 AND effective_date<=?))
    ORDER BY is_override DESC, effective_date DESC, id DESC LIMIT 1`, [userId, date, date]);
}

export async function userCampus(req) {
  const q = req.query?.campus;
  if (q && CAMPUSES[q]) return q;
  const row = await db.get('SELECT campus FROM profiles WHERE user_id=?', [req.userId]);
  return row?.campus && CAMPUSES[row.campus] ? row.campus : DEFAULT_CAMPUS;
}

profileRouter.get('/', async (req, res, next) => {
  try {
    const profile = await db.get('SELECT * FROM profiles WHERE user_id=?', [req.userId]);
    res.json({ profile, targets: await currentTargets(req.userId, todayLocal()), campus: publicCampus(profile?.campus) });
  } catch (err) { next(err); }
});

profileRouter.put('/campus', async (req, res, next) => {
  try {
    const { campus } = req.body || {};
    if (!CAMPUSES[campus]) return res.status(400).json({ error: 'Unknown campus' });
    await db.run(`INSERT INTO profiles(user_id,campus) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET campus=excluded.campus, updated_at=datetime('now')`, [req.userId, campus]);
    res.json({ campus: publicCampus(campus) });
  } catch (err) { next(err); }
});

profileRouter.put('/', async (req, res, next) => {
  try {
    const p = req.body || {};
    const campus = CAMPUSES[p.campus] ? p.campus : ((await db.get('SELECT campus FROM profiles WHERE user_id=?', [req.userId]))?.campus || DEFAULT_CAMPUS);
    await db.run(`INSERT INTO profiles(user_id,sex,age,height_cm,weight_kg,activity_level,daily_steps,goal,weekly_rate_kg,campus,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET sex=excluded.sex, age=excluded.age, height_cm=excluded.height_cm, weight_kg=excluded.weight_kg,
        activity_level=excluded.activity_level, daily_steps=excluded.daily_steps, goal=excluded.goal, weekly_rate_kg=excluded.weekly_rate_kg, campus=excluded.campus, updated_at=excluded.updated_at`,
      [req.userId, p.sex, p.age, p.height_cm, p.weight_kg, p.activity_level || 'light', p.daily_steps ?? null, p.goal || 'maintain', p.weekly_rate_kg ?? 0, campus]);
    try { res.json({ ok: true, recommended: recommendTargets(p) }); } catch (e) { res.status(400).json({ error: e.message }); }
  } catch (err) { next(err); }
});

profileRouter.post('/recommend', (req, res) => {
  try { res.json(recommendTargets(req.body || {})); } catch (err) { res.status(400).json({ error: err.message }); }
});

profileRouter.put('/targets', async (req, res, next) => {
  try {
    const { calories, protein, carbs, fat, date } = req.body || {};
    if (![calories, protein, carbs, fat].every((v) => Number.isFinite(Number(v)))) return res.status(400).json({ error: 'calories, protein, carbs and fat are required' });
    await db.run('INSERT INTO targets(user_id,effective_date,is_override,calories,protein,carbs,fat) VALUES(?,?,?,?,?,?,?)',
      [req.userId, date || todayLocal(), date ? 1 : 0, Math.round(calories), Math.round(protein), Math.round(carbs), Math.round(fat)]);
    res.json({ targets: await currentTargets(req.userId, date || todayLocal()) });
  } catch (err) { next(err); }
});
