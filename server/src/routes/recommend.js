import { Router } from 'express';
import { db, todayLocal, currentMealPeriod } from '../db.js';
import { recommend } from '../services/recommend.js';
import { currentTargets, userCampus } from './profile.js';

export const recommendRouter = Router();

recommendRouter.get('/', async (req, res, next) => {
  try {
    const date = todayLocal(), period = req.query.period || currentMealPeriod();
    const targets = await currentTargets(req.userId, date);
    if (!targets) return res.status(400).json({ error: 'Set your daily targets first' });
    const eaten = await db.get(`SELECT COALESCE(SUM(protein*servings),0) p, COALESCE(SUM(carbs*servings),0) c, COALESCE(SUM(fat*servings),0) f, COALESCE(SUM(calories*servings),0) k FROM food_log WHERE user_id=? AND date=?`, [req.userId, date]);
    const remaining = { protein: targets.protein - eaten.p, carbs: targets.carbs - eaten.c, fat: targets.fat - eaten.f, calories: targets.calories - eaten.k };
    let sql = `SELECT mi.*, s.location_name FROM menu_items mi JOIN menu_snapshots s ON s.id=mi.snapshot_id WHERE s.campus=? AND s.date=? AND s.status='ok' AND (s.period_name=? OR s.period_name='Everyday')`;
    const args = [await userCampus(req), date, period];
    if (req.query.location) { sql += ' AND s.location_id=?'; args.push(req.query.location); }
    const candidates = await db.all(sql, args);
    if (!candidates.length) return res.json({ mode: 'none', period, remaining, suggestions: [], reason: 'No dining hall menu loaded for this meal yet — open the Menu tab and refresh.' });
    const opts = { maxItems: Number(req.query.maxItems || 3), weights: {} };
    for (const k of ['protein', 'carbs', 'fat']) if (req.query[`${k}_w`]) opts.weights[k] = Number(req.query[`${k}_w`]);
    res.json({ period, ...recommend(remaining, candidates, opts) });
  } catch (err) { next(err); }
});
