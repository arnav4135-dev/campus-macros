import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, cap } from '../api';
import MacroBars from '../components/MacroBars';

const ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];
export default function Today() {
  const nav = useNavigate();
  const [data, setData] = useState(null); const [error, setError] = useState(null);
  const load = useCallback(async () => { try { setData(await api('/log')); setError(null); } catch (e) { setError(e.message); } }, []);
  useEffect(() => { load(); }, [load]);
  const remove = async (e) => { if (confirm(`Remove "${e.name}"?`)) setData(await api(`/log/${e.id}`, { method: 'DELETE' })); };
  const r = data?.remaining, t = data?.targets;
  return (
    <div className="page">
      <div className="small">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      {error ? <div className="err">{error}</div> : null}
      {t ? (<>
        <div className="hero">
          <div className="num">{Math.max(r.protein, 0)}<small> g</small></div>
          <h2>protein left today</h2>
          <div className="small">{r.calories} kcal remaining of {t.calories}</div>
        </div>
        <div className="card"><MacroBars totals={data.totals} targets={t} /></div>
        <button className="btn" onClick={() => nav('/recommend')}>What should I get right now?</button>
      </>) : data ? <div className="card"><h2>No targets yet</h2><div className="small">Set them in the You tab to unlock recommendations.</div></div> : null}
      {ORDER.filter((m) => data?.byMeal?.[m]).map((m) => { const meal = data.byMeal[m]; return (
        <div className="card" key={m}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><h2>{cap(m)}</h2><span className="small">{meal.calories} kcal · {meal.protein}p {meal.carbs}c {meal.fat}f</span></div>
          {meal.entries.map((e) => (
            <div className="entry" key={e.id}>
              <span style={{ flex: 1 }}>{e.name}{e.servings !== 1 ? ` ×${e.servings}` : ''}{e.estimated ? <span className="est">est.</span> : null}</span>
              <span className="small">{Math.round(e.calories * e.servings)} · {Math.round(e.protein * e.servings)}p</span>
              <button className="x" aria-label="Remove" onClick={() => remove(e)}>×</button>
            </div>))}
        </div>); })}
      {data && !Object.keys(data.byMeal || {}).length ? <div className="small center">Nothing logged yet. Browse the menu, search, or snap a photo.</div> : null}
    </div>
  );
}
