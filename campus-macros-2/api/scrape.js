// Daily scheduled scrape (vercel.json "crons") — also callable any time by an external scheduler.
// Vercel sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set; we require it if set.
import { migrate, todayLocal } from '../server/src/db.js';
import { scrapeTick } from '../server/src/services/dineoncampus.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await migrate();
    const out = await scrapeTick({ date: todayLocal(), budgetMs: 50000 });
    console.log(JSON.stringify(out));
    res.status(200).json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
