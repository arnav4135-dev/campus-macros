import { useState } from 'react';
import { useAuth } from '../auth';

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(null);
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setError(null);
    try { await (mode === 'login' ? login : register)(email.trim(), password); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <form className="page" style={{ justifyContent: 'center' }} onSubmit={go}>
      <div className="brand">Campus Macros</div>
      <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <div className="small">Dining hall menus, restaurant lookups and photo logging — all against your daily targets. Texas A&M and UT Dallas.</div>
      <input className="input" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="input" type="password" placeholder="Password (8+ characters)" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      {error ? <div className="err">{error}</div> : null}
      <button className="btn" disabled={busy}>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <button type="button" className="link center" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}</button>
    </form>
  );
}
