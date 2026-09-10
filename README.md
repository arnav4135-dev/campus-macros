# Campus Macros

Cal AI / MyFitnessPal-style macro tracker built around campus dining. Covers **Texas A&M** and **UT Dallas** (both run DineOnCampus, so one scraper handles both — adding a campus is one line in `server/src/campuses.js`).

Runs **entirely free** on Netlify (website + API + scheduled scraper) with Turso (free hosted SQLite). No servers, no card.

```
web/                 Website (Vite + React, installable as a PWA)
server/src/          API + scraper (Express) — runs as a Netlify Function, or as a normal server if you ever want that
netlify/functions/   api.mjs (wraps the Express app)  ·  scrape.mjs (runs every 10 min)
app/                 Optional native app (Expo) against the same API
```

What it does:

- Pulls every DineOnCampus location's menu for **breakfast / lunch / dinner** with per-item macros, re-checking every few hours so meal-period edits show up. Both campuses.
- Sets daily calorie + macro targets from height, weight, age, activity and steps (Mifflin-St Jeor). Edit any time, or override a single day.
- Recommends what to get from the **current meal's** menu based on what you still need — exact matches inside a tolerance band, else best-fit combos of up to 3 items, protein-weighted by default.
- One search bar across the dining hall menu, cached restaurant menus, USDA FoodData Central and Open Food Facts.
- Restaurants within 3 miles of your campus (Google Places). Chains with published nutrition (Chick-fil-A, Chipotle, Cane's, Panda, Subway, Panera, Whataburger, In-N-Out, Wingstop, Jersey Mike's, CAVA, Jimmy John's) load real numbers; anything else gets an AI estimate from its menu, labeled and cached.
- Photo logging: snap a plate → per-item estimate → confirm/edit → logged.
- Accounts (email + password), campus saved per user.

No MyFitnessPal / Cal AI sync — neither has a public API.

---

## Deploy for free (≈15 minutes)

### 1. Database — Turso (free)

1. Sign up at https://turso.tech, create a database (any name, region **Dallas / iad**).
2. Copy the **database URL** (`libsql://….turso.io`) and create an **auth token** (Database → Tokens).

### 2. Site + API — Netlify (free)

1. Push this repo to GitHub.
2. Netlify → **Add new site → Import from Git** → pick the repo. Leave build settings alone — `netlify.toml` at the root already configures the website, the API function, the scheduled scraper and the `/api/*` rewrite.
3. **Site configuration → Environment variables**, add:

   | Variable | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | from step 1 |
   | `TURSO_AUTH_TOKEN` | from step 1 |
   | `JWT_SECRET` | any long random string |
   | `ANTHROPIC_API_KEY` | console.anthropic.com — photo + restaurant estimates |
   | `USDA_API_KEY` | free at fdc.nal.usda.gov/api-key-signup |
   | `GOOGLE_PLACES_API_KEY` | Google Cloud → enable Places API (free tier covers this usage) |

4. **Deploy**. Open `https://<your-site>.netlify.app/api/health` — you should see `{"ok":true,"campuses":["tamu","utd"],"db":"turso",…}`.
5. On your phone: open the site → **Add to Home Screen**. It installs as an app.

### 3. First run

The scheduled function scrapes a few locations every 10 minutes and converges on the full day's menu within about an hour; it keeps rotating through the day so menus stay fresh. If you open the Menu tab before it has run, the page pulls automatically and shows "N locations still to pull — tap again."

**If a campus says it can't find the site_id:** open `https://dineoncampus.com/tamu` (or `/utdallasdining`) in Chrome → DevTools → Network → filter `all_locations` → copy the `site_id` query param → add it in Netlify as `DOC_SITE_ID_TAMU` / `DOC_SITE_ID_UTD` → redeploy. Stable across semesters.

### What the free tiers give you

Netlify free: 125k function invocations and 100 function-hours a month. The scraper uses ~4.3k invocations and ~7 hours. Turso free: far more than this needs. Anthropic and Google Places are pay-as-you-go but pennies at one user's volume — each restaurant is estimated once and cached.

### Costs of the 10-second function limit (design notes)

- Scraping is budgeted: each run does whatever fits in ~6 s and remembers where it left off.
- Restaurant estimation for an unknown place (Claude + menu fetch) usually fits; if it ever times out, tap again — the result is cached the moment it lands.
- Photos are downscaled in the browser before upload to stay under Netlify's 6 MB body limit.

DineOnCampus is scraped through the JSON endpoints its own web app uses. Unofficial, may break without notice; the app shows "menu unavailable" rather than crashing. Personal use only.

---

## Local development

```bash
npm install                                   # installs all workspaces
cp server/.env.example server/.env            # fill in keys; leave TURSO_* blank to use a local file DB
npm run server                                # API on :4000 with the in-process scheduler
npm run web                                   # site on :5173, proxies /api to :4000
npm run scrape                                # pull today's menus for both campuses right now
```

To test the exact Netlify setup locally: `npx netlify dev` from the repo root.

## API

All routes are under `/api`. Everything except `/api/auth/*`, `/api/health`, `/api/campuses` needs `Authorization: Bearer <token>`.

| Route | Purpose |
|---|---|
| `POST /auth/register`, `POST /auth/login` | accounts |
| `GET /campuses` | supported campuses |
| `GET/PUT /profile` · `PUT /profile/campus` · `PUT /profile/targets` | body stats, campus, targets (`date` in body → single-day override) |
| `GET /menus?period=Lunch&location=<id>` · `POST /menus/refresh` | today's menu for your campus; refresh scrapes what's stale within the time budget |
| `GET /recommend?period=&maxItems=&protein_w=` | top-3 suggestions vs. remaining macros |
| `GET /foods/search?q=` | unified search |
| `GET /restaurants/nearby?q=&radius=` · `GET /restaurants/:placeId/menu` | Google Places near your campus; official → estimated (cached) |
| `POST /photo/estimate` | `{ image: base64, mediaType, hint? }` |
| `GET/POST /log`, `DELETE /log/:id` | food log + daily totals/remaining |

## If you ever want an always-on server instead

`server/` still runs standalone (`npm run server`) and ships with a `Dockerfile`, `fly.toml` and `railway.json`. Point it at Turso with the same two env vars, or leave them blank to use a local SQLite file on a mounted volume.

## Where to expand first

1. `server/src/services/chains.js` — chain nutrition tables were transcribed from published guides; verify against the chain PDFs and add Northgate / Campbell Rd favorites.
2. `server/src/campuses.js` — add a campus (slug + coordinates).
3. `server/src/services/recommend.js` — `tolerance`, `weights`, `overshootPenalty`.
