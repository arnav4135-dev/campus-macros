// Express app wrapped as a single Netlify Function. Netlify rewrites /api/* → /.netlify/functions/api/*.
import serverless from 'serverless-http';
import { app } from '../../server/src/app.js';

export const handler = serverless(app, { basePath: '/.netlify/functions' });
