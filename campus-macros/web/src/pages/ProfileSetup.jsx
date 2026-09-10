import { useEffect, useState } from 'react';
import { api } from '../api';

const CAMPUSES = [['tamu', 'Texas A&M'], ['utd', 'UT Dallas']];
const ACTIVITY = [['sedentary', 'Sedentary'], ['light', 'Light'], ['moderate', 'Moderate'], ['active', 'Active'], ['very_active', 'Very active']];
const GOALS = [['lose', 'Lose'], ['maintain', 'Maintain'], ['gain', 'Gain']];
const RATES = [['0.25', '½ lb/wk'], ['0.45', '1 lb/wk'], ['0.9', '2 lb/wk']];

export default function ProfileSetup({ onDone, existing }) {
  const [p, setP] = useState({ campus: 'tamu', sex: 'male', age: '18', height_ft: '5', height_in: '10', weight_lb: '160', activity_level: 'light', daily_steps: '', goal: 'maintain', weekly_rate_kg: '0.45' });
  const [rec, setRec] = useState(null);
  const [t, setT] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(null);

  useEffect(() => {
    if (existing?.profile) {
      const e = existing.profile, inches = e.height_cm / 2.54;
      setP({ campus: e.campus || 'tamu', sex: e.sex, age: String(e.age), height_ft: String(Math.floor(inches / 12)), height_in: String(Math.round(inches % 12)),
        weight_lb: String(Math.round(e.weight_kg * 2.2046)), activity_level: e.activity_level, daily_steps: e.daily_steps ? String(e.daily_steps) : '', goal: e.goal, weekly_rate_kg: String(e.weekly_rate_kg || 0.45) });
    }
    if (existing?.targets) setT(Object.fromEntries(['calories', 'protein', 'carbs', 'fat'].map((k) => [k, String(existing.targets[k])])));
  }, [existing]);

  const body = () => ({ campus: p.campus, sex: p.sex, age: Number(p.age), height_cm: (Number(p.height_ft) * 12 + Number(p.height_in)) * 2.54, weight_kg: Number(p.weight_lb) / 2.2046,
    activity_level: p.activity_level, daily_steps: p.daily_steps ? Number(p.daily_steps) : null, goal: p.goal, weekly_rate_kg: p.goal === 'maintain' ? 0 : Number(p.weekly_rate_kg) });

  const recommend = async () => {
    setBusy(true); setError(null);
    try { const { recommended } = await api('/profile', { method: 'PUT', body: body() }); setRec(recommended);
      setT({ calories: String(recommended.calories), protein: String(recommended.protein), carbs: String(recommended.carbs), fat: String(recommended.fat) }); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true); setError(null);
    try { await api('/profile', { method: 'PUT', body: body() });
      await api('/profile/targets', { method: 'PUT', body: { calories: Number(t.calories), protein: Number(t.protein), carbs: Number(t.carbs), fat: Number(t.fat) } });
      onDone?.(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const kcal = Number(t.protein) * 4 + Number(t.carbs) * 4 + Number(t.fat) * 9;

  const Num = ({ label, k, obj, set }) => (
    <div className="field"><label>{label}</label><input className="input" inputMode="decimal" value={obj[k]} onChange={(e) => set({ ...obj, [k]: e.target.value })} onFocus={(e) => e.target.select()} /></div>
  );
  const Seg = ({ label, k, options }) => (
    <div className="field"><label>{label}</label><div className="chips">{options.map(([v, l]) => <button key={v} type="button" className={`chip ${p[k] === v ? 'on' : ''}`} onClick={() => setP({ ...p, [k]: v })}>{l}</button>)}</div></div>
  );

  return (
    <div className="page">
      <h1>Your targets</h1>
      <div className="small">Answer these and you'll get a starting point. Change any number whenever you want — targets can also be overridden for a single day.</div>
      <Seg label="Campus" k="campus" options={CAMPUSES} />
      <Seg label="Sex" k="sex" options={[['male', 'Male'], ['female', 'Female']]} />
      <div className="row"><Num label="Age" k="age" obj={p} set={setP} /><Num label="Height ft" k="height_ft" obj={p} set={setP} /><Num label="in" k="height_in" obj={p} set={setP} /><Num label="Weight lb" k="weight_lb" obj={p} set={setP} /></div>
      <Seg label="Activity" k="activity_level" options={ACTIVITY} />
      <Num label="Average daily steps (optional — overrides activity if set)" k="daily_steps" obj={p} set={setP} />
      <Seg label="Goal" k="goal" options={GOALS} />
      {p.goal !== 'maintain' ? <Seg label="Rate" k="weekly_rate_kg" options={RATES} /> : null}
      <button className="btn ghost" onClick={recommend} disabled={busy}>Recommend targets</button>
      {rec ? <div className="small">Maintenance ≈ {rec.tdee} kcal (BMR {rec.bmr}, {rec.activity_level_used.replace('_', ' ')}). Protein at 1.8 g/kg, fat at 25% of calories.</div> : null}
      <h2>Daily targets</h2>
      <div className="row"><Num label="kcal" k="calories" obj={t} set={setT} /><Num label="Protein g" k="protein" obj={t} set={setT} /><Num label="Carbs g" k="carbs" obj={t} set={setT} /><Num label="Fat g" k="fat" obj={t} set={setT} /></div>
      {t.protein && Math.abs(kcal - Number(t.calories)) > 100 ? <div className="small" style={{ color: 'var(--est)' }}>Your macros add up to {kcal} kcal, {Math.abs(kcal - Number(t.calories))} off your calorie target.</div> : null}
      {error ? <div className="err">{error}</div> : null}
      <button className="btn" onClick={save} disabled={busy || !t.calories}>Save targets</button>
    </div>
  );
}
