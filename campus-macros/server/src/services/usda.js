// USDA FoodData Central — generic/whole foods. Free key: https://fdc.nal.usda.gov/api-key-signup
const BASE = 'https://api.nal.usda.gov/fdc/v1';
const N = { calories: 1008, protein: 1003, carbs: 1005, fat: 1004 };

export async function searchUsda(query, limit = 10) {
  const key = process.env.USDA_API_KEY || 'DEMO_KEY';
  const url = `${BASE}/foods/search?api_key=${key}&query=${encodeURIComponent(query)}&pageSize=${limit}&dataType=Foundation,SR%20Legacy,Branded`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`USDA ${res.status}`);
  const data = await res.json();
  return (data.foods || []).map((f) => {
    const get = (id) => f.foodNutrients?.find((n) => n.nutrientId === id)?.value ?? null;
    // Foundation/SR Legacy are per 100 g. Branded includes servingSize.
    const per100 = { calories: get(N.calories), protein: get(N.protein), carbs: get(N.carbs), fat: get(N.fat) };
    const serving = f.servingSize ? { size: f.servingSize, unit: f.servingSizeUnit } : { size: 100, unit: 'g' };
    const scale = serving.unit?.toLowerCase() === 'g' || serving.unit?.toLowerCase() === 'ml' ? serving.size / 100 : 1;
    const round = (v) => (v == null ? null : Math.round(v * scale * 10) / 10);
    return {
      source: 'usda',
      source_ref: String(f.fdcId),
      name: f.brandName ? `${f.description} (${f.brandName})` : f.description,
      portion: `${serving.size} ${serving.unit}`,
      calories: round(per100.calories), protein: round(per100.protein), carbs: round(per100.carbs), fat: round(per100.fat),
      estimated: false,
    };
  }).filter((x) => x.calories != null);
}
