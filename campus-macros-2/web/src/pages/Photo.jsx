import { useState } from 'react';
import { api } from '../api';
import FoodRow from '../components/FoodRow';
import LogSheet from '../components/LogSheet';

// Downscale in the browser so the upload stays small and under the API's body limit.
async function toBase64(file, max = 1280) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale); canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  return { base64: dataUrl.split(',')[1], preview: dataUrl };
}

export default function Photo() {
  const [img, setImg] = useState(null); const [hint, setHint] = useState('');
  const [result, setResult] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState(null);
  const [sel, setSel] = useState(null); const [queue, setQueue] = useState([]);

  const pick = async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setImg(await toBase64(f)); setResult(null); setError(null); } catch { setError('Could not read that image.'); } };
  const estimate = async () => { setBusy(true); setError(null); try { setResult(await api('/photo/estimate', { method: 'POST', body: { image: img.base64, mediaType: 'image/jpeg', hint } })); } catch (er) { setError(er.message); } finally { setBusy(false); } };
  const logAll = () => { const [f, ...rest] = result.items.map((it) => ({ ...it, source: 'photo', estimated: true })); setQueue(rest); setSel(f); };
  const next = () => { if (queue.length) { const [n, ...rest] = queue; setQueue(rest); setSel(n); } else setSel(null); };

  return (
    <div className="page">
      <h1>Snap a plate</h1>
      <div className="small">You'll get a per-item estimate to confirm or fix before anything hits your log. Estimates are labeled everywhere they show up.</div>
      <div className="row">
        <label className="btn" style={{ cursor: 'pointer' }}>Camera<input type="file" accept="image/*" capture="environment" hidden onChange={pick} /></label>
        <label className="btn ghost" style={{ cursor: 'pointer' }}>Photo library<input type="file" accept="image/*" hidden onChange={pick} /></label>
      </div>
      {img ? <img className="photo" src={img.preview} alt="Your meal" /> : null}
      {img ? (<>
        <input className="input" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Optional context: 'dining hall lunch, 2 scoops rice'…" />
        <button className="btn" onClick={estimate} disabled={busy}>{busy ? 'Estimating…' : 'Estimate macros'}</button>
      </>) : null}
      {error ? <div className="err">{error}</div> : null}
      {result ? (
        <div className="card">
          <h2>{result.total.calories} kcal · {result.total.protein}p {result.total.carbs}c {result.total.fat}f</h2>
          <div className="small">Confidence: {result.confidence}.{result.notes ? ` ${result.notes}` : ''}</div>
          {result.items.map((it, i) => <FoodRow key={i} item={{ ...it, estimated: true }} onClick={() => setSel({ ...it, source: 'photo', estimated: true })} />)}
          <button className="btn" onClick={logAll}>Log all {result.items.length} item{result.items.length > 1 ? 's' : ''}</button>
          <div className="small">Or tap one item to log just that.</div>
        </div>) : null}
      <LogSheet item={sel} onClose={next} />
    </div>
  );
}
