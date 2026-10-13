import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'elder' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try { mode === 'login' ? await login(form.email, form.password) : await register(form); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  }

  return (
    <div className="phone">
      <main className="screen" style={{ justifyContent: 'center' }}>
        <div className="logo" style={{ alignSelf: 'center' }}><Icon name="heart" size={40} /></div>
        <div style={{ textAlign: 'center' }}>
          <h1 className="t" style={{ fontSize: '2em' }}>Cakna</h1>
          <p className="sub" style={{ fontSize: '1.05em' }}>Your health buddy, every day.</p>
        </div>
        <form className="card" onSubmit={submit}>
          {mode === 'register' && (
            <>
              <div className="field"><label htmlFor="name">Your name</label><input id="name" type="text" value={form.name} onChange={set('name')} required /></div>
              <div className="field">
                <span className="lbl">I am</span>
                <div className="seg">
                  {[['elder', 'Using it for myself'], ['caregiver', 'A caregiver']].map(([v, l]) => (
                    <button type="button" key={v} aria-pressed={form.role === v} onClick={() => setForm({ ...form, role: v })}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="field"><label htmlFor="email">Email</label><input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></div>
          {err && <div className="err">{err}</div>}
          <button className="btn full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <button className="btn ghost" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'Create a new account' : 'I already have an account'}
        </button>
      </main>
    </div>
  );
}
