import { Router } from 'express';
import { db, kv, todayLocal, currentMealPeriod } from '../db.js';
import { getMenu, scrapeStale } from '../services/dineoncampus.js';
import { userCampus } from './profile.js';
import { publicCampus } from '../campuses.js';

export const menusRouter = Router();

menusRouter.get('/locations', async (req, res, next) => {
  try { res.json(await db.all('SELECT id,name,building,active FROM doc_locations WHERE campus=? AND active=1 ORDER BY building,name', [await userCampus(req)])); }
  catch (err) { next(err); }
});

menusRouter.get('/', async (req, res, next) => {
  try {
    const date = req.query.date || todayLocal();
    const period = req.query.period === 'all' ? null : (req.query.period || currentMealPeriod());
    const campus = await userCampus(req);
    const snapshots = await getMenu({ campus, date, period, locationId: req.query.location || null });
    const last = await kv.get(`last_scrape:${campus}`);
    res.json({ campus: publicCampus(campus), date, period, snapshots, available: snapshots.some((s) => s.status === 'ok'),
      last_scrape: last ? JSON.parse(last) : null,
      message: snapshots.length ? null : 'No menu loaded for this day yet — tap refresh to pull it from DineOnCampus.' });
  } catch (err) { next(err); }
});

// Scrapes whatever is stale, within a budget that fits a 10 s serverless limit. Tap again to continue.
menusRouter.post('/refresh', async (req, res) => {
  const campus = await userCampus(req), date = req.body?.date || todayLocal();
  try { res.json(await scrapeStale({ campus, date, budgetMs: Number(process.env.SCRAPE_BUDGET_MS || 6000) })); }
  catch (err) { res.status(502).json({ error: `Menu refresh failed: ${err.message}` }); }
});
