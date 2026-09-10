// Local / always-on hosting only. On Netlify the scheduled function (netlify/functions/scrape.mjs) does this instead.
import cron from 'node-cron';
import { scrapeTick } from './dineoncampus.js';
import { todayLocal } from '../db.js';

async function tick(label) {
  try {
    const out = await scrapeTick({ date: todayLocal(), budgetMs: 60000 });
    for (const [c, r] of Object.entries(out)) console.log(`[scrape:${label}] ${c}: ${r.error || `${r.scraped.length} scraped, ${r.remaining} remaining`}`);
  } catch (err) { console.error(`[scrape:${label}]`, err.message); }
}
export function startScheduler() {
  cron.schedule('*/10 * * * *', () => tick('cron'), { timezone: process.env.TZ || 'America/Chicago' });
  tick('boot');
}
