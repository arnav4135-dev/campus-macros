// Scheduled every 10 min (see netlify.toml). Each run scrapes whatever is stale, split across campuses,
// within ~8 s so it never hits the 10 s limit. Over an hour the whole day's menu converges.
import { migrate, todayLocal } from '../../server/src/db.js';
import { scrapeTick } from '../../server/src/services/dineoncampus.js';

export const handler = async () => {
  await migrate();
  const out = await scrapeTick({ date: todayLocal(), budgetMs: 6000 });
  console.log(JSON.stringify(out));
  return { statusCode: 200, body: JSON.stringify(out) };
};
