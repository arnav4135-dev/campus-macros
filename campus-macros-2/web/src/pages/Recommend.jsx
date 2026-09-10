import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, q } from '../api';
import LogSheet from '../components/LogSheet';

const delta = (d) => ['protein', 'carbs', 'fat'].map((k) => `${d[k] >= 0 ? '+' : ''}${d[k]}${k[0]}`).join('  ');
export default function Recommend() {
  const [params] = useSearchParams(); const period = params.get('period');
  const [data, setData] = useState(null); const [error, setError] = useState(null); const [busy, setBusy] = useState(false);
  const [proteinFirst, setProteinFirst] = useState(true); const [sel, setSel] = useState(null); const [queue, setQueue] = useState([]);
  const load = useCallback(async () => { setBusy(true); try { setData(await api(`/recommend?${q({ period, protein_w: proteinFirst ? 3 : 1 })}`)); setError(null); } catch (e) { setError(e.message); } finally { setBusy(false); } }, [period, proteinFirst]);
  useEffect(() => { load(); }, [load]);
  const logCombo = (items) => { const [f, ...rest] = items.map((it) => ({ ...it, source: 'dining_hall', source_ref: String(it.id) })); setQueue(rest); setSel(f); };
  const next = () => { if (queue.length) { const [n, ...rest] = queue; setQueue(rest); setSel(n); } else setSel(null); };
  const r = data?.remaining;
  return (
    <div className="page">
      <h1>{data?.period || period || 'Now'}</h1>
      {r ? <div className="small">You still need <b className="p">{Math.round(r.protein)}p</b> · <b className="c">{Math.round(r.carbs)}c</b> · <b className="f">{Math.round(r.fat)}f</b> today.</div> : null}
      <button className="chip" style={{ alignSelf: 'flex-start' }} onClick={() => setProteinFirst(!proteinFirst)}>{proteinFirst ? 'Prioritizing protein' : 'Weighting all macros evenly'} · tap to switch</button>
      {error ? <div className="err">{error}</div> : null}
      {busy ? <div className="small">Working through the menu…</div> : null}
      {data?.mode === 'none' ? <div>{data.reason}</div> : null}
      {data?.mode === 'best_fit' ? <div className="small">Nothing on the menu lands inside the tolerance band, so these are the closest fits.</div> : null}
      {(data?.suggestions || []).map((s, i) => (
        <div className={`card ${s.fits ? 'fit' : ''}`} key={i}>
          {s.items.map((it, j) => (
            <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}><div>{it.name}</div><div className="small">{[it.location, it.station, it.portion].filter(Boolean).join(' · ')}</div></div>
              <div className="small">{Math.round(it.protein)}p {Math.round(it.carbs)}c {Math.round(it.fat)}f</div>
            </div>))}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}><b>{s.total.calories} kcal · {s.total.protein}p {s.total.carbs}c {s.total.fat}f</b><span className="small">{delta(s.delta)}</span></div>
          <button className="btn ghost" onClick={() => logCombo(s.items)}>{s.items.length > 1 ? `Log these ${s.items.length}` : 'Log this'}</button>
        </div>))}
      <LogSheet item={sel} onClose={next} />
    </div>
  );
}
