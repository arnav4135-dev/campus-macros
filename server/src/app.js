// The Express app, without listening. Used by index.js (local / always-on) and netlify/functions/api.mjs (serverless).
import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { profileRouter } from './routes/profile.js';
import { menusRouter } from './routes/menus.js';
import { foodsRouter } from './routes/foods.js';
import { restaurantsRouter } from './routes/restaurants.js';
import { logRouter } from './routes/log.js';
import { recommendRouter } from './routes/recommend.js';
import { photoRouter } from './routes/photo.js';
import { kv, migrate } from './db.js';
import { CAMPUSES } from './campuses.js';

export const app = express();
const origins = (process.env.CORS_ORIGINS || '').split(',').map((x) => x.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : undefined));
app.use(express.json({ limit: '6mb' }));
app.use(async (_req, _res, next) => { try { await migrate(); next(); } catch (err) { next(err); } });

const api = express.Router();
api.get('/health', async (_req, res) => res.json({ ok: true, campuses: Object.keys(CAMPUSES), db: process.env.TURSO_DATABASE_URL ? 'turso' : 'local',
  last_scrape: Object.fromEntries(await Promise.all(Object.keys(CAMPUSES).map(async (k) => [k, JSON.parse((await kv.get(`last_scrape:${k}`)) || 'null')]))) }));
api.get('/campuses', (_req, res) => res.json(Object.values(CAMPUSES).map(({ match, ...c }) => c)));
api.use('/auth', authRouter);
api.use('/menus', requireAuth, menusRouter);
api.use('/profile', requireAuth, profileRouter);
api.use('/foods', requireAuth, foodsRouter);
api.use('/restaurants', requireAuth, restaurantsRouter);
api.use('/log', requireAuth, logRouter);
api.use('/recommend', requireAuth, recommendRouter);
api.use('/photo', requireAuth, photoRouter);
app.use('/api', api);

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: err.message || 'Something went wrong on the server' }); });
