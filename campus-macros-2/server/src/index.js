import 'dotenv/config';
import { app } from './app.js';
import { startScheduler } from './services/scheduler.js';
if (!process.env.JWT_SECRET) { console.error('JWT_SECRET missing — copy .env.example to .env'); process.exit(1); }
const port = process.env.PORT || 4000;
app.listen(port, '0.0.0.0', () => { console.log(`API on http://0.0.0.0:${port}`); startScheduler(); });
