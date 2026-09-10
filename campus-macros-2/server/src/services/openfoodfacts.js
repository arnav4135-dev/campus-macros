// Open Food Facts — branded/packaged foods (crowd-sourced, free).
export async function searchOpenFoodFacts(query, limit = 10) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,brands,serving_size,serving_quantity,nutriments`;
  const res = await fetch(url, { headers: { 'User-Agent': 'TAMUMacroTracker/0.1 (personal project)' } });
  if (!res.ok) throw new Error(`OpenFoodFacts ${res.status}`);
  const data = await res.json();
  return (data.products || []).map((p) => {
    const n = p.nutriments || {};
    const perServing = n['energy-kcal_serving'] != null;
    const pick = (k) => (perServing ? n[`${k}_serving`] : n[`${k}_100g`]);
    const r = (v) => (v == null ? null : Math.round(Number(v) * 10) / 10);
    return {
      source: 'openfoodfacts',
      source_ref: p.code,
      name: p.brands ? `${p.product_name} (${p.brands})` : p.product_name,
      portion: perServing ? (p.serving_size || '1 serving') : '100 g',
      calories: r(perServing ? n['energy-kcal_serving'] : n['energy-kcal_100g']),
      protein: r(pick('proteins')), carbs: r(pick('carbohydrates')), fat: r(pick('fat')),
      estimated: false,
    };
  }).filter((x) => x.name && x.calories != null);
}
