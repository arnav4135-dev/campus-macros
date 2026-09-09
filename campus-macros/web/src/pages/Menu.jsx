import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, q, periodNow } from '../api';
import { useAuth } from '../auth';
import FoodRow from '../components/FoodRow';
import LogSheet from '../components/LogSheet';

const PERIODS = ['Breakfast', 'Lunch', 'Dinner'];
export default function Menu() {
  const nav = useNavigate(); const { campus } = useAuth();
  const [period, setPeriod] = useState(periodNow());
  const [data, setData] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(null); const [sel, setSel] = useState(null);
  const [pull, setPull] = useState(null);   // result of the last refresh: { scraped, remaining }
  const autoPulled = useRef(false);
  const load = useCallback(async () => { setBusy(true); try { const d = await api(`/menus?${q({ period })}`); setData(d); setError(null); return d; } catch (e) { setError(e.message); } finally { setBusy(false); } }, [period]);
  const refresh = useCallback(async () => {
    setBusy(true);
    try { const r = await api('/menus/refresh', { method: 'POST' }); setPull(r); await load(); }
    catch (e) { setError(e.message); setBusy(false); }
  }, [load]);
  useEffect(() => { (async () => {
    const d = await load();
    // Nothing for today yet (e.g. first visit before the scheduled scraper has run) → pull once automatically.
    if (d && !d.snapshots.length && !autoPulled.current) { autoPulled.current = true; refresh(); }
  })(); }, [load, refresh]);
  const snaps = (data?.snapshots || []).filter((s) => s.status === 'ok' && s.items.length);
  const closed = (data?.snapshots || []).filter((s) => s.status === 'closed').length;
  return (
    <div className="page page-flush">
      <div className="tabs">{PERIODS.map((p) => <button key={p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>{p}</button>)}</div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1>{campus?.name || 'Campus'} · {period.toLowerCase()}</h1>
        {error ? <div className="err">{error}</div> : null}
        {data?.message ? <div className="small">{data.message}</div> : null}
        {closed ? <div className="small">{closed} location{closed > 1 ? 's' : ''} closed for {period.toLowerCase()}.</div> : null}
        <div className="small">
          {data?.last_scrape ? `Menus pulled ${new Date(data.last_scrape.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. ` : ''}
          {pull?.remaining > 0 ? `${pull.remaining} location${pull.remaining > 1 ? 's' : ''} still to pull — tap again. ` : ''}
          <button className="link" onClick={refresh} disabled={busy}>{busy ? 'Working…' : pull?.remaining > 0 ? 'Keep pulling' : 'Refresh from DineOnCampus'}</button>
        </div>
        <button className="btn ghost" onClick={() => nav(`/recommend?period=${period}`)}>Recommend for {period.toLowerCase()}</button>
      </div>
      {snaps.map((s) => (
        <div key={s.snapshot_id}>
          <div className="section-h">{s.location_name}{s.period_name === 'Everyday' ? ' · Everyday' : ''}</div>
          {s.items.map((it) => <FoodRow key={it.id} item={{ ...it, detail: it.station }} onClick={() => setSel({ ...it, source: 'dining_hall', source_ref: String(it.id) })} />)}
        </div>))}
      {!busy && !snaps.length ? <div className="small center" style={{ padding: 24 }}>No {period.toLowerCase()} menu loaded yet for {campus?.name}. Hit refresh to pull it from DineOnCampus.</div> : null}
      <LogSheet item={sel} onClose={() => setSel(null)} />
    </div>
  );
}
