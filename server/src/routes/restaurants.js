import { Router } from 'express';
import { db } from '../db.js';
import { nearbyRestaurants, placeDetails } from '../services/places.js';
import { matchChain } from '../services/chains.js';
import { estimateMenuMacros } from '../services/claude.js';
import { userCampus } from './profile.js';
import { campus as getCampus } from '../campuses.js';

export const restaurantsRouter = Router();

restaurantsRouter.get('/nearby', async (req, res) => {
  try {
    const c = getCampus(await userCampus(req));
    const lat = Number(req.query.lat || c.lat), lng = Number(req.query.lng || c.lng), radius = Number(req.query.radius || process.env.RESTAURANT_RADIUS_M || 4828);
    const results = await nearbyRestaurants({ lat, lng, radius, keyword: req.query.q });
    const ids = results.map((r) => r.place_id);
    const cached = ids.length ? await db.all(`SELECT place_id, menu_source FROM restaurants WHERE place_id IN (${ids.map(() => '?').join(',')})`, ids) : [];
    const cachedMap = Object.fromEntries(cached.map((r) => [r.place_id, r.menu_source]));
    res.json(results.map((r) => ({ ...r, chain: matchChain(r.name)?.name || null, cached: cachedMap[r.place_id] || null })));
  } catch (err) { res.status(502).json({ error: err.message }); }
});

restaurantsRouter.get('/:placeId/menu', async (req, res) => {
  const { placeId } = req.params;
  try {
    const cached = await db.get('SELECT * FROM restaurants WHERE place_id=?', [placeId]);
    if (cached && cached.menu_source !== 'none' && !req.query.refresh) {
      return res.json({ restaurant: cached, items: await db.all('SELECT * FROM restaurant_items WHERE place_id=? ORDER BY name', [placeId]), source: cached.menu_source });
    }
    const details = await placeDetails(placeId);
    const name = details.name || req.query.name || 'Unknown';
    const chain = matchChain(name);
    let items, source;
    if (chain) { items = chain.items.map((i) => ({ ...i, source: 'official' })); source = 'official'; }
    else {
      let menuText = '';
      if (details.website) {
        try {
          const html = await (await fetch(details.website, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(2500) })).text();
          menuText = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        } catch { /* fine */ }
      }
      items = await estimateMenuMacros({ restaurantName: name, menuText, cuisineHint: details.editorial_summary?.overview });
      source = 'estimated';
    }
    await db.batch([
      [`INSERT INTO restaurants(place_id,campus,name,address,lat,lng,chain_key,menu_source,fetched_at) VALUES(?,?,?,?,?,?,?,?,datetime('now'))
        ON CONFLICT(place_id) DO UPDATE SET campus=excluded.campus,name=excluded.name,address=excluded.address,lat=excluded.lat,lng=excluded.lng,chain_key=excluded.chain_key,menu_source=excluded.menu_source,fetched_at=excluded.fetched_at`,
        [placeId, await userCampus(req), name, details.formatted_address || null, details.geometry?.location?.lat ?? null, details.geometry?.location?.lng ?? null, chain?.key || null, source]],
      ['DELETE FROM restaurant_items WHERE place_id=?', [placeId]],
      ...items.map((it) => ['INSERT INTO restaurant_items(place_id,name,portion,calories,protein,carbs,fat,source) VALUES(?,?,?,?,?,?,?,?)', [placeId, it.name, it.portion || null, it.calories, it.protein, it.carbs, it.fat, it.source]]),
    ]);
    res.json({ restaurant: await db.get('SELECT * FROM restaurants WHERE place_id=?', [placeId]), items: await db.all('SELECT * FROM restaurant_items WHERE place_id=? ORDER BY name', [placeId]), source });
  } catch (err) { res.status(502).json({ error: err.message }); }
});
