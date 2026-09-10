import { Router } from 'express';
import { estimateFromPhoto } from '../services/claude.js';

export const photoRouter = Router();

// POST /photo/estimate { image: base64, mediaType: 'image/jpeg', hint?: string }
// Returns an estimate; the client confirms/edits, then POSTs to /log.
photoRouter.post('/estimate', async (req, res) => {
  const { image, mediaType = 'image/jpeg', hint } = req.body || {};
  if (!image) return res.status(400).json({ error: 'image (base64) is required' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Photo logging needs ANTHROPIC_API_KEY on the server' });
  try { res.json({ ...(await estimateFromPhoto({ base64: image, mediaType, hint })), estimated: true }); }
  catch (err) { res.status(502).json({ error: `Could not estimate from photo: ${err.message}` }); }
});
