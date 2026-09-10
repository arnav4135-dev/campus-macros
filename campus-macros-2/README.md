# Campus Macros

Cal AI / MyFitnessPal-style macro tracker built around campus dining. Covers **Texas A&M** and **UT Dallas** (both run DineOnCampus, so one scraper handles both — adding a campus is one line in `server/src/campuses.js`).

Runs **entirely free** on Vercel (website + API + daily scraper) with Turso (free hosted SQLite). No servers, no card.

```
web/          Website (Vite + React, installable as a PWA)
server/src/   API + scraper (Express) — runs as a Vercel Function, or as a normal server if you ever want that
api/          index.js (the Express app as a Vercel Function)  ·  scrape.js (daily menu pull, 5 AM Central)
app/          Optional native app (Expo) against the same API
```

What it does:

- Pulls every DineOnCampus location's menu for **breakfast / lunch / dinner** with per-item macros. Both campuses. A daily 5 AM pass loads the whole day; the Menu tab re-pulls anything older than 4 hours when you open it.
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

1. Sign up at https://turso.tech, create a database (any name, a US region).
2. Copy the **database URL** (`libsql://….turso.io`) and create an **auth token**.

### 2. Site + API — Vercel (free Hobby plan)

1. Push this repo to GitHub (upload the files through the GitHub website — no git needed).
2. https://vercel.com → sign up with GitHub → **Add New → Project** → import the repo. Leave the build settings alone; `vercel.json` configures everything. (If your files sit inside a subfolder on GitHub, set **Root Directory** to that folder.)
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | from step 1 (starts with `libsql://`) |
   | `TURSO_AUTH_TOKEN` | from step 1 |
   | `JWT_SECRET` | any long random string |
   | `USDA_API_KEY` | free at fdc.nal.usda.gov/api-key-signup |
   | `ANTHROPIC_API_KEY` | optional — photo + restaurant estimates |
   | `GOOGLE_PLACES_API_KEY` | optional — restaurants near campus |
   | `CRON_SECRET` | optional — any random string; locks the scraper endpoint |

4. **Deploy**. Open `https://<your-project>.vercel.app/api/health` — you should see `{"ok":true,"campuses":["tamu","utd"],"db":"turso",…}`.
5. On your phone: open the site → **Add to Home Screen**.

### 3. First run

Open the Menu tab. If nothing is loaded yet it pulls automatically (a full pass takes ~30 s). After that, a scheduled run at 5 AM Central loads each new day, and the Menu tab refreshes anything stale when you open it. If you want background updates more often than daily, point a free scheduler like cron-job.org at `https://<your-project>.vercel.app/api/scrape` every 30 minutes with header `Authorization: Bearer <your CRON_SECRET>`.

**If a campus says it can't find the site_id:** open `https://dineoncampus.com/tamu` (or `/utdallasdining`) in Chrome → DevTools → Network → filter `all_locations` → copy the `site_id` query param → add it in Vercel as `DOC_SITE_ID_TAMU` / `DOC_SITE_ID_UTD` → redeploy. Stable across semesters.

### What the free tier gives you

Vercel Hobby: 100 deploys/day, 1M function invocations/month, 100 GB bandwidth — this app uses a rounding error of that. Cron jobs are limited to once a day on Hobby, which is why the design does one big morning pass plus on-demand refresh. Turso free: far more than this needs. Anthropic and Google Places are pay-as-you-go but pennies at one user's volume.

DineOnCampus is scraped through the JSON endpoints its own web app uses. Unofficial, may break without notice; the app shows "menu unavailable" rather than crashing. Personal use only.

*Netlify note:* `netlify.toml.optional` still works if renamed to `netlify.toml`, but Netlify's credit-based free plan allows only ~20 deploys a month, which is too tight for a project you're still setting up.

---

## Local development

```bash
npm install                                   # installs server + web (app installs separately: cd app && npm install)
cp server/.env.example server/.env            # fill in keys; leave TURSO_* blank to use a local file DB
npm run server                                # API on :4000 with the in-process scheduler
npm run web                                   # site on :5173, proxies /api to :4000
npm run scrape                                # pull today's menus for both campuses right now
```

To test the exact Vercel setup locally: `npx vercel dev` from the repo root.

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
