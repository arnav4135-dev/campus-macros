// MyFitnessPal-style onboarding: body stats → recommended targets → edit → save.
// Also reused from Settings to retune at any time.
import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { api } from '../api';
import Button from '../components/Button';
import { colors, type, radius } from '../theme';

const ACTIVITY = [['sedentary', 'Sedentary'], ['light', 'Light'], ['moderate', 'Moderate'], ['active', 'Active'], ['very_active', 'Very active']];
const GOALS = [['lose', 'Lose'], ['maintain', 'Maintain'], ['gain', 'Gain']];
const CAMPUSES = [['tamu', 'Texas A&M'], ['utd', 'UT Dallas']];
const RATES = [['0.25', '½ lb/wk'], ['0.45', '1 lb/wk'], ['0.9', '2 lb/wk']];

export default function ProfileSetupScreen({ onDone, existing }) {
  const [p, setP] = useState({ sex: 'male', age: '18', height_ft: '5', height_in: '10', weight_lb: '160', activity_level: 'light', daily_steps: '', goal: 'maintain', weekly_rate_kg: '0.45', campus: 'tamu' });
  const [rec, setRec] = useState(null);
  const [t, setT] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (existing?.profile) {
      const e = existing.profile;
      const totalIn = e.height_cm / 2.54;
      setP({ sex: e.sex, age: String(e.age), height_ft: String(Math.floor(totalIn / 12)), height_in: String(Math.round(totalIn % 12)),
        weight_lb: String(Math.round(e.weight_kg * 2.2046)), activity_level: e.activity_level, daily_steps: e.daily_steps ? String(e.daily_steps) : '',
        goal: e.goal, weekly_rate_kg: String(e.weekly_rate_kg || 0.45), campus: e.campus || 'tamu' });
    }
    if (existing?.targets) setT(Object.fromEntries(['calories', 'protein', 'carbs', 'fat'].map((k) => [k, String(existing.targets[k])])));
  }, [existing]);

  const body = () => ({
    sex: p.sex, age: Number(p.age), height_cm: (Number(p.height_ft) * 12 + Number(p.height_in)) * 2.54, weight_kg: Number(p.weight_lb) / 2.2046,
    activity_level: p.activity_level, daily_steps: p.daily_steps ? Number(p.daily_steps) : null, goal: p.goal,
    weekly_rate_kg: p.goal === 'maintain' ? 0 : Number(p.weekly_rate_kg), campus: p.campus,
  });

  const recommend = async () => {
    setBusy(true); setError(null);
    try {
      const { recommended } = await api('/profile', { method: 'PUT', body: body() });
      setRec(recommended);
      setT({ calories: String(recommended.calories), protein: String(recommended.protein), carbs: String(recommended.carbs), fat: String(recommended.fat) });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true); setError(null);
    try {
      if (!rec && !existing?.profile) await api('/profile', { method: 'PUT', body: body() });
      await api('/profile/targets', { method: 'PUT', body: { calories: Number(t.calories), protein: Number(t.protein), carbs: Number(t.carbs), fat: Number(t.fat) } });
      onDone?.();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const kcalFromMacros = Number(t.protein) * 4 + Number(t.carbs) * 4 + Number(t.fat) * 9;

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Text style={type.h1}>Your targets</Text>
      <Text style={type.small}>Answer these and you'll get a starting point. Change any number whenever you want — targets can also be overridden for a single day from the Today screen.</Text>

      <Seg label="Campus" value={p.campus} options={CAMPUSES} onChange={(v) => setP({ ...p, campus: v })} />
      <Seg label="Sex" value={p.sex} options={[['male', 'Male'], ['female', 'Female']]} onChange={(v) => setP({ ...p, sex: v })} />
      <Row>
        <Num label="Age" value={p.age} onChange={(v) => setP({ ...p, age: v })} />
        <Num label="Height ft" value={p.height_ft} onChange={(v) => setP({ ...p, height_ft: v })} />
        <Num label="in" value={p.height_in} onChange={(v) => setP({ ...p, height_in: v })} />
        <Num label="Weight lb" value={p.weight_lb} onChange={(v) => setP({ ...p, weight_lb: v })} />
      </Row>
      <Seg label="Activity" value={p.activity_level} options={ACTIVITY} onChange={(v) => setP({ ...p, activity_level: v })} />
      <Num label="Average daily steps (optional — overrides activity if set)" value={p.daily_steps} onChange={(v) => setP({ ...p, daily_steps: v })} wide />
      <Seg label="Goal" value={p.goal} options={GOALS} onChange={(v) => setP({ ...p, goal: v })} />
      {p.goal !== 'maintain' ? <Seg label="Rate" value={p.weekly_rate_kg} options={RATES} onChange={(v) => setP({ ...p, weekly_rate_kg: v })} /> : null}

      <Button title="Recommend targets" variant="ghost" onPress={recommend} loading={busy} />
      {rec ? <Text style={type.small}>Maintenance ≈ {rec.tdee} kcal (BMR {rec.bmr}, {rec.activity_level_used.replace('_', ' ')}). Protein set at 1.8 g/kg, fat at 25% of calories.</Text> : null}

      <Text style={[type.h2, { marginTop: 8 }]}>Daily targets</Text>
      <Row>
        <Num label="kcal" value={t.calories} onChange={(v) => setT({ ...t, calories: v })} />
        <Num label="Protein g" value={t.protein} onChange={(v) => setT({ ...t, protein: v })} />
        <Num label="Carbs g" value={t.carbs} onChange={(v) => setT({ ...t, carbs: v })} />
        <Num label="Fat g" value={t.fat} onChange={(v) => setT({ ...t, fat: v })} />
      </Row>
      {t.protein && Math.abs(kcalFromMacros - Number(t.calories)) > 100 ? <Text style={{ color: colors.estimate, fontSize: 13 }}>Your macros add up to {kcalFromMacros} kcal, which is {Math.abs(kcalFromMacros - Number(t.calories))} off your calorie target.</Text> : null}
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      <Button title="Save targets" onPress={save} loading={busy} disabled={!t.calories} />
    </ScrollView>
  );
}

const Row = ({ children }) => <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
function Num({ label, value, onChange, wide }) {
  return (
    <View style={{ flex: wide ? undefined : 1 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" style={s.input} selectTextOnFocus />
    </View>
  );
}
function Seg({ label, value, options, onChange }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(([v, l]) => (
          <Pressable key={v} onPress={() => onChange(v)} style={[s.chip, value === v && s.chipOn]}>
            <Text style={[s.chipText, value === v && { color: '#fff' }]}>{l}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { padding: 20, gap: 14, paddingBottom: 60, backgroundColor: colors.bg },
  label: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, padding: 10, fontSize: 16, backgroundColor: colors.surface, color: colors.ink },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.maroonSoft },
  chipOn: { backgroundColor: colors.maroon },
  chipText: { color: colors.maroon, fontWeight: '600' },
});
