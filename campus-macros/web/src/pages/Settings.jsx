import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import ProfileSetup from './ProfileSetup';

const CAMPUSES = [['tamu', 'Texas A&M'], ['utd', 'UT Dallas']];
export default function Settings() {
  const { logout, campus, setCampus } = useAuth();
  const [existing, setExisting] = useState(null); const [editing, setEditing] = useState(false); const [saved, setSaved] = useState(false);
  const load = useCallback(async () => { try { setExisting(await api('/profile')); } catch { /* ignore */ } }, []);
  useEffect(() => { load(); }, [load]);
  const switchCampus = async (key) => { const { campus } = await api('/profile/campus', { method: 'PUT', body: { campus: key } }); setCampus(campus); load(); };
  if (editing) return <ProfileSetup existing={existing} onDone={() => { setEditing(false); setSaved(true); load(); }} />;
  const t = existing?.targets;
  return (
    <div className="page">
      <h1>You</h1>
      <div className="card">
        <h2>Campus</h2>
        <div className="chips">{CAMPUSES.map(([k, l]) => <button key={k} className={`chip ${campus?.key === k ? 'on' : ''}`} onClick={() => switchCampus(k)}>{l}</button>)}</div>
        <div className="small">Menus, recommendations and nearby restaurants all follow this.</div>
      </div>
      <div className="card">
        <h2>Daily targets</h2>
        {t ? <div>{t.calories} kcal · {t.protein}p · {t.carbs}c · {t.fat}f{t.is_override ? ' (today only)' : ''}</div> : <div className="small">Not set yet.</div>}
        {saved ? <div style={{ color: 'var(--fat)' }}>Targets saved.</div> : null}
        <button className="btn ghost" onClick={() => { setSaved(false); setEditing(true); }}>{t ? 'Change stats or targets' : 'Set up targets'}</button>
      </div>
      <div className="card">
        <h2>About the data</h2>
        <div className="small">Dining hall menus come from DineOnCampus (unofficial — the site can change without warning). Chains use their published nutrition guides. Anything marked "est." is an AI estimate from a menu or photo; edit it if you know better.</div>
      </div>
      <button className="btn ghost" onClick={logout}>Sign out</button>
    </div>
  );
}
