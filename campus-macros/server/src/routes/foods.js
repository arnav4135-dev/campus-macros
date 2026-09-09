import { Router } from 'express';
import { db, todayLocal, currentMealPeriod } from '../db.js';
import { searchUsda } from '../services/usda.js';
import { searchOpenFoodFacts } from '../services/openfoodfacts.js';
import { userCampus } from './profile.js';

export const foodsRouter = Router();

// Open Food Facts allows ~10 searches/min and USDA's DEMO_KEY is tight too; remember recent results for 15 min.
const cache = new Map();
const cached = (key, fn) => {
  const hit = cache.get(key);
  if (hit && hit.at > Date.now() - 15 * 60_000) return hit.p;
  const p = fn().catch(() => []);
  cache.set(key, { at: Date.now(), p });
  if (cache.size > 500) cache.delete(cache.keys().next().value);
  return p;
};

foodsRouter.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json({ results: [] });
    const like = `%${q}%`, date = todayLocal(), period = req.query.period || currentMealPeriod();
    const [diningRows, restRows, usda, off] = await Promise.all([
      db.all(`SELECT mi.id, mi.name, mi.station, mi.portion, mi.calories, mi.protein, mi.carbs, mi.fat, s.location_name FROM menu_items mi JOIN menu_snapshots s ON s.id=mi.snapshot_id
        WHERE s.campus=? AND s.date=? AND s.status='ok' AND (s.period_name=? OR s.period_name='Everyday') AND mi.name LIKE ? LIMIT 15`, [await userCampus(req), date, period, like]),
      db.all(`SELECT ri.*, r.name restaurant_name FROM restaurant_items ri JOIN restaurants r ON r.place_id=ri.place_id WHERE ri.name LIKE ? OR r.name LIKE ? LIMIT 15`, [like, like]),
      cached(`usda:${q.toLowerCase()}`, () => searchUsda(q, 8)),
      cached(`off:${q.toLowerCase()}`, () => searchOpenFoodFacts(q, 8)),
    ]);
    const dining = diningRows.map((r) => ({ source: 'dining_hall', source_ref: String(r.id), name: r.name, portion: r.portion, detail: `${r.location_name} · ${r.station}`, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, estimated: false }));
    const restaurant = restRows.map((r) => ({ source: 'restaurant', source_ref: String(r.id), name: r.name, portion: r.portion, detail: r.restaurant_name, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, estimated: r.source === 'estimated' }));
    res.json({ query: q, period, results: [...dining, ...restaurant, ...usda, ...off] });
  } catch (err) { next(err); }
});
