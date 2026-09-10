import { useEffect, useState } from 'react';
import { api, mealNow, cap } from '../api';

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
export default function LogSheet({ item, onClose, onLogged }) {
  const [meal, setMeal] = useState(mealNow());
  const [servings, setServings] = useState('1');
  const [m, setM] = useState({ calories: '', protein: '', carbs: '', fat: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item) { setServings('1'); setError(null); setM({ calories: item.calories ?? '', protein: item.protein ?? '', carbs: item.carbs ?? '', fat: item.fat ?? '' }); }
  }, [item]);
  if (!item) return null;

  const save = async () => {
    setBusy(true); setError(null);
    try {
      const s = await api('/log', { method: 'POST', body: { name: item.name, meal, source: item.source || 'manual', source_ref: item.source_ref, servings: Number(servings) || 1,
        calories: Number(m.calories) || 0, protein: Number(m.protein) || 0, carbs: Number(m.carbs) || 0, fat: Number(m.fat) || 0, estimated: !!item.estimated } });
      onLogged?.(s); onClose();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const F = ({ label, k }) => (
    <div className="field"><label>{label}</label>
      <input className="input" inputMode="decimal" value={k === 'servings' ? servings : m[k]} onChange={(e) => k === 'servings' ? setServings(e.target.value) : setM({ ...m, [k]: e.target.value })} onFocus={(e) => e.target.select()} />
    </div>
  );
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Log ${item.name}`}>
        <h2>{item.name}</h2>
        {item.estimated ? <div className="small" style={{ color: 'var(--est)' }}>These numbers are an estimate — adjust if you know better.</div> : null}
        <div className="chips">{MEALS.map((x) => <button key={x} className={`chip ${meal === x ? 'on' : ''}`} onClick={() => setMeal(x)}>{cap(x)}</button>)}</div>
        <div className="grid">
          <F label="Servings" k="servings" /><F label="kcal" k="calories" /><F label="Protein g" k="protein" /><F label="Carbs g" k="carbs" /><F label="Fat g" k="fat" />
        </div>
        {error ? <div className="err">{error}</div> : null}
        <button className="btn" onClick={save} disabled={busy}>{busy ? 'Adding…' : 'Add to log'}</button>
      </div>
    </div>
  );
}
