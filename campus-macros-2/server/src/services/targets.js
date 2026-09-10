// MyFitnessPal-style target recommendation from body stats.
// BMR: Mifflin-St Jeor. TDEE = BMR × activity factor (steps override the self-reported level if given).

const ACTIVITY = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };

export function activityFromSteps(steps) {
  if (steps == null) return null;
  if (steps < 5000) return 'sedentary';
  if (steps < 7500) return 'light';
  if (steps < 10000) return 'moderate';
  if (steps < 12500) return 'active';
  return 'very_active';
}

export function recommendTargets(p) {
  const { sex, age, height_cm, weight_kg } = p;
  if (!sex || !age || !height_cm || !weight_kg) throw new Error('Need sex, age, height and weight');

  const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + (sex === 'male' ? 5 : -161);
  const level = activityFromSteps(p.daily_steps) || p.activity_level || 'light';
  const tdee = bmr * (ACTIVITY[level] || 1.375);

  // ~7700 kcal per kg of body weight
  const rate = Number(p.weekly_rate_kg || 0);
  const delta = (rate * 7700) / 7;
  let calories = tdee;
  if (p.goal === 'lose') calories -= delta;
  if (p.goal === 'gain') calories += delta;
  // Safety floors (same idea MFP uses)
  calories = Math.max(calories, sex === 'male' ? 1500 : 1200);
  calories = Math.round(calories / 10) * 10;

  // Macro split: protein 1.8 g/kg (upper bound for engineering-student lifter),
  // fat 25% of calories, carbs fill the rest. Editable in the app.
  const protein = Math.round(Math.min(1.8 * weight_kg, calories * 0.35 / 4));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat, bmr: Math.round(bmr), tdee: Math.round(tdee), activity_level_used: level };
}
