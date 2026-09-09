/**
 * Recommendation engine.
 * Input: remaining macros for the day + candidate items (current meal period).
 * 1) Look for a single item or combo inside a tolerance band.
 * 2) Otherwise rank by weighted total deviation (protein weighted highest by default).
 * Returns top N combos with macro breakdowns.
 */

const DEFAULTS = {
  tolerance: { protein: 10, carbs: 20, fat: 10 },   // grams
  weights: { protein: 3, carbs: 1, fat: 1.5 },      // penalty per gram off
  overshootPenalty: 1.5,                            // going over is worse than under
  maxItems: 3,
  topN: 3,
  poolSize: 40,                                     // prune candidates before combos
};

function usable(it) {
  return it.protein != null && it.carbs != null && it.fat != null && (it.calories ?? 0) > 0;
}

function sumMacros(items) {
  return items.reduce((a, it) => ({
    calories: a.calories + (it.calories || 0),
    protein: a.protein + it.protein,
    carbs: a.carbs + it.carbs,
    fat: a.fat + it.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function score(total, remaining, cfg) {
  let s = 0;
  for (const k of ['protein', 'carbs', 'fat']) {
    const diff = total[k] - remaining[k];
    s += cfg.weights[k] * Math.abs(diff) * (diff > 0 ? cfg.overshootPenalty : 1);
  }
  return s;
}

function withinTolerance(total, remaining, cfg) {
  return ['protein', 'carbs', 'fat'].every((k) => Math.abs(total[k] - remaining[k]) <= cfg.tolerance[k]);
}

export function recommend(remaining, candidates, options = {}) {
  const cfg = { ...DEFAULTS, ...options, tolerance: { ...DEFAULTS.tolerance, ...(options.tolerance || {}) }, weights: { ...DEFAULTS.weights, ...(options.weights || {}) } };
  let pool = candidates.filter(usable);
  if (pool.length === 0) return { mode: 'none', suggestions: [], reason: 'No items with macro data available for this meal.' };

  // Prune: keep the items individually closest to the target, plus the highest-protein ones.
  pool = pool
    .map((it) => ({ it, s: score(it, remaining, cfg) }))
    .sort((a, b) => a.s - b.s)
    .slice(0, cfg.poolSize)
    .map((x) => x.it);

  const combos = [];
  const n = pool.length;
  for (let i = 0; i < n; i++) {
    combos.push([pool[i]]);
    if (cfg.maxItems < 2) continue;
    for (let j = i + 1; j < n; j++) {
      combos.push([pool[i], pool[j]]);
      if (cfg.maxItems < 3) continue;
      for (let k = j + 1; k < n; k++) combos.push([pool[i], pool[j], pool[k]]);
    }
  }

  const scored = combos.map((items) => {
    const total = sumMacros(items);
    return { items, total, score: score(total, remaining, cfg), fits: withinTolerance(total, remaining, cfg) };
  }).sort((a, b) => a.score - b.score);

  const fits = scored.filter((c) => c.fits);
  const chosen = (fits.length ? fits : scored).slice(0, cfg.topN);
  return {
    mode: fits.length ? 'match' : 'best_fit',
    remaining,
    suggestions: chosen.map((c) => ({
      items: c.items.map((it) => ({ id: it.id, name: it.name, station: it.station, location: it.location_name, portion: it.portion,
        calories: it.calories, protein: it.protein, carbs: it.carbs, fat: it.fat, estimated: !!it.estimated })),
      total: Object.fromEntries(Object.entries(c.total).map(([k, v]) => [k, Math.round(v)])),
      delta: { protein: Math.round(c.total.protein - remaining.protein), carbs: Math.round(c.total.carbs - remaining.carbs), fat: Math.round(c.total.fat - remaining.fat) },
      fits: c.fits,
    })),
  };
}
