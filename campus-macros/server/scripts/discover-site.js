import 'dotenv/config';
import { migrate } from '../src/db.js';
import { getSiteId, syncLocations } from '../src/services/dineoncampus.js';
import { CAMPUSES } from '../src/campuses.js';
await migrate();
for (const c of Object.values(CAMPUSES)) {
  try {
    console.log(`\n${c.name} (dineoncampus.com/${c.slug}) site_id: ${await getSiteId(c.key)}`);
    const locs = await syncLocations(c.key, { force: true });
    console.log(`${locs.length} menu locations:`); for (const l of locs) console.log(` - ${l.name} (${l.building}) ${l.id}`);
  } catch (err) { console.error(`${c.name}: ${err.message}`); }
}
