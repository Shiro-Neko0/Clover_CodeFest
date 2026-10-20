import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { useTranslation } from '../i18n.js';

export default function Login() {
  const { login, register } = useAuth();
  const { t } = useTranslation();
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
        <div className="logo" style={{ alignSelf: 'center' }}><img src="/logo-cakna.svg" alt ="Cakna" width="180" height="180" /></div>
        <div style={{ textAlign: 'center' }}>
        </div>
        <form className="card" onSubmit={submit}>
          {mode === 'register' && (
            <>
              <div className="field"><label htmlFor="name">{t('name')}</label><input id="name" type="text" value={form.name} onChange={set('name')} required /></div>
              <div className="field">
                <span className="lbl">{t('iam')}</span>
                <div className="seg">
                  {[['elder', t('usingForMyself')], ['caregiver', t('caregiver')]].map(([v, l]) => (
                    <button type="button" key={v} aria-pressed={form.role === v} onClick={() => setForm({ ...form, role: v })}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="field"><label htmlFor="email">{t('email')}</label><input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></div>
          <div className="field"><label htmlFor="password">{t('password')}</label><input id="password" type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required /></div>
          {err && <div className="err">{err}</div>}
          <button className="btn full" disabled={busy}>{busy ? t('loading') : mode === 'login' ? t('login') : t('register')}</button>
        </form>
        <button className="btn ghost" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? t('createNewAccount') : t('alreadyHaveAccount')}
        </button>
      </main>
    </div>
  );
}
