import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const SIZES = [['Normal', 1], ['Large', 1.15], ['Extra large', 1.3]];

export default function Me() {
  const { user, setUser, logout } = useAuth();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [scale, setScale] = useState(() => { 
    try { return Number(localStorage.getItem('scale') || 1); } catch { return 1; } 
  });

  // Settings State
  const [notifications, setNotifications] = useState(true);
  const [sosAlerts, setSosAlerts] = useState(true);
  const [lang, setLang] = useState('ms');

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
      {/* Header Profile Section */}
      <div className="row sp">
        <div className="row">
          <div className="av2">{user.name.slice(0, 2).toUpperCase()}</div>
          <div>
            <h2 className="t">{user.name}</h2>
            <p className="sub">{user.email}</p>
          </div>
        </div>
        <span className="pill ok">{elder ? 'Elder' : 'Caregiver'}</span>
      </div>

      {/* Account Linking Section */}
      {elder ? (
        <div className="card">
          <h3 className="s">My Caregiver</h3>
          {user.caregivers?.length ? (
            user.caregivers.map((c) => (
              <div className="row sp" key={c.id || c._id}>
                <b>{c.name}</b>
                <span className="pill ok">Linked</span>
              </div>
            ))
          ) : (
            <p className="sub">Give this code to your caregiver so they can link to your account.</p>
          )}
          <div className="linkcode" aria-label="Your link code">{user.linkCode}</div>
        </div>
      ) : (
        <div className="card">
          <h3 className="s">People I Care For</h3>
          {user.elders?.map((p) => (
            <div className="row sp" key={p.id || p._id}>
              <b>{p.name}</b>
              <span className="pill ok">Linked</span>
            </div>
          ))}
          <form onSubmit={link} className="composer">
            <input 
              id="linkcode" 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              placeholder="Enter their code" 
              aria-label="Link code" 
              autoCapitalize="characters" 
            />
            <button className="btn sm">Link</button>
          </form>
          {err && <div className="err">{err}</div>}
        </div>
      )}

      {/* Display Settings */}
      <div className="card">
        <h3 className="s">Text Size</h3>
        <div className="seg">
          {SIZES.map(([l, v]) => (
            <button key={l} aria-pressed={scale === v} onClick={() => changeScale(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Alert & Sound Preferences */}
      <div className="card space-y-3">
        <h3 className="s">Alerts & Notifications</h3>
        <div className="row sp">
          <span>Emergency SOS Alerts</span>
          <input 
            type="checkbox" 
            checked={sosAlerts} 
            onChange={(e) => setSosAlerts(e.target.checked)} 
          />
        </div>
        <div className="row sp">
          <span>Reminders & Medication</span>
          <input 
            type="checkbox" 
            checked={notifications} 
            onChange={(e) => setNotifications(e.target.checked)} 
          />
        </div>
      </div>

      {/* Language Preferences */}
      <div className="card">
        <h3 className="s">App Language</h3>
        <select 
          className="input-select" 
          value={lang} 
          onChange={(e) => setLang(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #083735', backgroundColor: '#2a5f5c', fontSize: '1rem' }}
        >
          <option value="ms">Bahasa Melayu</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Sign Out Action */}
      <button className="btn ghost full danger" onClick={logout}>Sign Out</button>
    </main>
  );
}