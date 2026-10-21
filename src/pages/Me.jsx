import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useTranslation } from '../i18n.js';

export default function Me() {
  const { user, setUser, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [scale, setScale] = useState(() => { 
    try { return Number(localStorage.getItem('scale') || 1); } catch { return 1; } 
  });

  // Settings State
  const [notifications, setNotifications] = useState(true);
  const [sosAlerts, setSosAlerts] = useState(true);
  const elder = user.role === 'elder';

  async function link(e) {
    e.preventDefault(); 
    setErr('');
    if (!code.trim()) return;
    try { 
      setUser((await api('/auth/link', { method: 'POST', body: { code } })).user); 
      setCode(''); 
    } catch (e2) { 
      setErr(e2.message); 
    }
  }

  function changeScale(v) {
    setScale(v);
    try { localStorage.setItem('scale', v); } catch { /* ignore */ }
    document.querySelector('.phone')?.style.setProperty('--scale', v);
  }

  return (
    <main className="screen">
      <div className="row sp">
        <div className="row">
          <div className="av2">{user.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <h2 className="t">{user.name}</h2>
            <p className="sub">{user.email}</p>
          </div>
        </div>
        <span className="pill ok">{elder ? t('elder') : t('caregiverRole')}</span>
      </div>

      {elder ? (
        <div className="card">
          <h3 className="s">{t('myCaregiver')}</h3>
          {user.caregivers?.length ? (
            user.caregivers.map((c) => (
              <div className="row sp" key={c.id || c._id}>
                <b>{c.name}</b>
                <span className="pill ok">{t('linked')}</span>
              </div>
            ))
          ) : (
            <p className="sub">{t('giveCodeToCaregiver')}</p>
          )}
          <div className="linkcode" aria-label={t('yourLinkCode')}>{user.linkCode}</div>
        </div>
      ) : (
        <div className="card">
          <h3 className="s">{t('peopleICareFor')}</h3>
          {user.elders?.map((p) => (
            <div className="row sp" key={p.id || p._id}>
              <b>{p.name}</b>
              <span className="pill ok">{t('linked')}</span>
            </div>
          ))}
          <form onSubmit={link} className="composer">
            <input 
              id="linkcode" 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              placeholder={t('enterTheirCode')}
              aria-label={t('enterTheirCode')}
              autoCapitalize="characters" 
            />
            <button className="btn sm">{t('link')}</button>
          </form>
          {err && <div className="err">{err}</div>}
        </div>
      )}

      <div className="card">
        <h3 className="s">{t('textSize')}</h3>
        <div className="seg">
          {[[t('normal'), 1], [t('large'), 1.15], [t('extraLarge'), 1.3]].map(([label, v]) => (
            <button key={v} aria-pressed={scale === v} onClick={() => changeScale(v)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="s">{t('alertsNotifications')}</h3>
        <div className="row sp">
          <span>{t('emergencySosAlerts')}</span>
          <input 
            type="checkbox" 
            checked={sosAlerts} 
            onChange={(e) => setSosAlerts(e.target.checked)} 
          />
        </div>
        <div className="row sp">
          <span>{t('remindersMedication')}</span>
          <input 
            type="checkbox" 
            checked={notifications} 
            onChange={(e) => setNotifications(e.target.checked)} 
          />
        </div>
      </div>

      {/* Theme / Appearance Selection Card */}
      <div className="card">
        <ThemeToggle />
      </div>

      {/* App Language Card */}
      <div className="card">
        <h3 className="s">{t('appLanguage')}</h3>
        <select 
          className="input-select" 
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          aria-label={t('appLanguage')}
        >
          <option value="ms">{t('malay')}</option>
          <option value="en">English</option>
        </select>
      </div>

      <button className="btn ghost full danger" onClick={logout}>{t('signOut')}</button>
    </main>
  );
}

export function ThemeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      root.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  return (
    <div className="field">
      <h3 className="s" style={{ marginBottom: 8 }}>{t('appearance')}</h3>
      <select
        id="theme-select"
        className="input-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        aria-label={t('appearance')}
      >
        <option value="system">{t('systemDefault')}</option>
        <option value="light">{t('lightMode')}</option>
        <option value="dark">{t('darkMode')}</option>
      </select>
    </div>
  );
}