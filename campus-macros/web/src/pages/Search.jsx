import { useEffect, useRef, useState } from 'react';
import { api, q } from '../api';
import { useAuth } from '../auth';
import FoodRow from '../components/FoodRow';
import LogSheet from '../components/LogSheet';

const LABEL = { dining_hall: 'Dining hall', restaurant: 'Restaurant', usda: 'USDA', openfoodfacts: 'Open Food Facts' };
export default function Search() {
  const { campus } = useAuth();
  const [mode, setMode] = useState('foods'); const [text, setText] = useState('');
  const [results, setResults] = useState([]); const [places, setPlaces] = useState([]); const [rest, setRest] = useState(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(null); const [sel, setSel] = useState(null);
  const timer = useRef();

  useEffect(() => {
    clearTimeout(timer.current);
    if (mode !== 'foods' || text.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => { setBusy(true); try { setResults((await api(`/foods/search?${q({ q: text })}`)).results); setError(null); } catch (e) { setError(e.message); } finally { setBusy(false); } }, 350);
    return () => clearTimeout(timer.current);
  }, [text, mode]);

  const findPlaces = async (e) => { e?.preventDefault(); setBusy(true); setRest(null); try { setPlaces(await api(`/restaurants/nearby?${q({ q: text })}`)); setError(null); } catch (er) { setError(er.message); } finally { setBusy(false); } };
  const open = async (p) => { setBusy(true); try { setRest(await api(`/restaurants/${p.place_id}/menu?${q({ name: p.name })}`)); setError(null); } catch (er) { setError(er.message); } finally { setBusy(false); } };

  const list = rest ? rest.items.map((it) => ({ ...it, source: 'restaurant', source_ref: String(it.id), estimated: it.source === 'estimated', detail: rest.restaurant.name })) : results;
  return (
    <div className="page page-flush">
      <form style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }} onSubmit={mode === 'places' ? findPlaces : (e) => e.preventDefault()}>
        <div className="chips">
          {[['foods', 'Foods'], ['places', `Restaurants near ${campus?.name || 'campus'}`]].map(([m, l]) => <button type="button" key={m} className={`chip ${mode === m ? 'on' : ''}`} onClick={() => { setMode(m); setRest(null); }}>{l}</button>)}
        </div>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={mode === 'foods' ? 'Chicken breast, protein bar, pizza…' : 'Search or leave blank for everything nearby'} autoComplete="off" />
        {mode === 'places' && !rest ? <button className="btn ghost">Find restaurants</button> : null}
        {error ? <div className="err">{error}</div> : null}
        {busy ? <div className="small">Looking that up…</div> : null}
        {rest ? (<div>
          <button type="button" className="link" onClick={() => setRest(null)}>‹ Back to results</button>
          <h2 style={{ marginTop: 6 }}>{rest.restaurant.name}</h2>
          <div className="small">{rest.source === 'official' ? 'Published nutrition data.' : 'No published nutrition data — these are AI estimates from the menu, cached for next time.'}</div>
        </div>) : null}
      </form>

      {mode === 'places' && !rest ? (<>
        {places.map((p) => (
          <div className="place" key={p.place_id} onClick={() => open(p)}>
            <div style={{ flex: 1 }}><div>{p.name}</div><div className="small">{p.address}{p.open_now === false ? ' · closed now' : ''}</div></div>
            <span className={`tag ${p.chain ? 'official' : p.cached ? 'cached' : ''}`}>{p.chain ? 'official data' : p.cached ? 'cached' : 'estimate on open'}</span>
          </div>))}
        {!busy && !places.length ? <div className="small center" style={{ padding: 24 }}>Search covers a 3-mile radius around {campus?.name} by default.</div> : null}
      </>) : (<>
        {list.map((it, i) => <FoodRow key={`${it.source}-${it.source_ref}-${i}`} item={{ ...it, detail: it.detail || LABEL[it.source] }} onClick={() => setSel(it)} />)}
        {!busy && text.length >= 2 && mode === 'foods' && !list.length ? <div className="small center" style={{ padding: 24 }}>Nothing matched. Try a simpler name, or log it manually below.</div> : null}
        {mode === 'foods' && text.length >= 2 ? <button className="link" style={{ padding: 16, width: '100%' }} onClick={() => setSel({ name: text, source: 'manual', calories: 0, protein: 0, carbs: 0, fat: 0 })}>Log "{text}" manually with your own numbers</button> : null}
      </>)}
      <LogSheet item={sel} onClose={() => setSel(null)} />
    </div>
  );
}
