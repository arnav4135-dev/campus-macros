// Vercel serverless function: the whole Express API. vercel.json rewrites /api/* here.
// Vercel accepts an Express app directly as the default export.
process.env.SCRAPE_BUDGET_MS ||= '45000';   // the Refresh button can do a full pass in one go on Vercel's longer timeout
import { app } from '../server/src/app.js';
export default app;
export const config = { maxDuration: 60 };
