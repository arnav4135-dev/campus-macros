import 'dotenv/config';
import { migrate, todayLocal } from '../src/db.js';
import { scrapeTick, scrapeStale } from '../src/services/dineoncampus.js';
// usage: npm run scrape [-- YYYY-MM-DD] [campus]
await migrate();
const date = process.argv[2] || todayLocal(), campus = process.argv[3];
console.log(JSON.stringify(campus ? await scrapeStale({ campus, date, budgetMs: 120000 }) : await scrapeTick({ date, budgetMs: 240000 }), null, 2));
