import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

const SIZES = [['Normal', 1], ['Large', 1.15], ['Extra large', 1.3]];

  function HealthProfile() {
    const [age, setAge] = useState('');
    const [conditions, setConditions] = useState('');
    const [medicines, setMedicines] = useState('');
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    useEffect(() => {
      api('/profile')
        .then((p) => { setAge(p.age ?? ''); setConditions(p.conditions.join(', ')); setMedicines(p.medicines.join(', ')); })
        .catch((e) => setErr(e.message));
    }, []);

    async function save(e) {
      e.preventDefault(); setMsg(''); setErr('');
      try {
        await api('/profile', { method: 'PUT', body: { age, conditions, medicines } });
        setMsg('Saved. Aide will use this to fit its advice to you.');
      } catch (e2) { setErr(e2.message); }
    }

    const box = { width: '100%', margin: '6px 0 12px' };
    return (
      <form className="card" onSubmit={save}>
        <h3 className="s">My health profile</h3>
        <p className="sub">Aide uses this to give advice that fits you. Separate items with commas.</p>
        <label htmlFor="p-age">Age</label>
        <input id="p-age" type="number" value={age} onChange={(e) => setAge(e.target.value)} style={box} />
        <label htmlFor="p-cond">Health conditions</label>
        <input id="p-cond" type="text" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Diabetes, High blood pressure" style={box} />
        <label htmlFor="p-med">Medicines</label>
        <input id="p-med" type="text" value={medicines} onChange={(e) => setMedicines(e.target.value)} placeholder="Metformin, Amlodipine" style={box} />
        {err && <div className="err">{err}</div>}
        {msg && <div className="banner">{msg}</div>}
        <button className="btn full">Save profile</button>
      </form>
    );
  }

export default function Me() {
  const { user, setUser, logout } = useAuth();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [scale, setScale] = useState(() => { try { return Number(localStorage.getItem('scale') || 1); } catch { return 1; } });
  const elder = user.role === 'elder';

  async function link(e) {
    e.preventDefault(); setErr('');
    try { setUser((await api('/auth/link', { method: 'POST', body: { code } })).user); setCode(''); } catch (e2) { setErr(e2.message); }
  }
  function changeScale(v) {
    setScale(v);
    try { localStorage.setItem('scale', v); } catch { /* ignore */ }
    document.querySelector('.phone')?.style.setProperty('--scale', v);
  }

  return (
    <main className="screen">
      <div className="row"><div className="av2">{user.name.slice(0, 2).toUpperCase()}</div><div><h2 className="t">{user.name}</h2><p className="sub">{user.email}</p></div></div>

      {elder ? (
        <div className="card">
          <h3 className="s">My caregiver</h3>
          {user.caregivers.length ? user.caregivers.map((c) => <div className="row sp" key={c.id}><b>{c.name}</b><span className="pill ok">Linked</span></div>)
            : <p className="sub">Give this code to the person who looks after you. They type it in on their account.</p>}
          <div className="linkcode" aria-label="Your link code">{user.linkCode}</div>
        </div>
      ) : (
        <div className="card">
          <h3 className="s">People I care for</h3>
          {user.elders.map((p) => <div className="row sp" key={p.id}><b>{p.name}</b><span className="pill ok">Linked</span></div>)}
          <form onSubmit={link} className="composer">
            <input id="linkcode" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter their code" aria-label="Link code" autoCapitalize="characters" />
            <button className="btn sm">Link</button>
          </form>
          {err && <div className="err">{err}</div>}
        </div>
      )}

      {elder && <HealthProfile />}

      <div className="card">
        <h3 className="s">Text size</h3>
        <div className="seg">{SIZES.map(([l, v]) => <button key={l} aria-pressed={scale === v} onClick={() => changeScale(v)}>{l}</button>)}</div>
        <span className="note">TODO: sound, reminder and language settings.</span>
      </div>

      <button className="btn ghost full" onClick={logout}>Sign out</button>
    </main>
  );
}
