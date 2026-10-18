import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Tiles from '../components/Tiles.jsx';

const pillFor = { taken: ['ok', 'Taken'], due: ['warn', 'Due'], missed: ['bad', 'Missed'], later: ['mute', 'Later'] };
const ago = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' });

export default function CaregiverHome() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!user.elders.length) return;
    try { setData(await api('/overview')); } catch (e) { setErr(e.message); }
  }, [user.elders.length]);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  if (!user.elders.length) {
    return (
      <main className="screen">
        <h2 className="t">Welcome, {user.name}</h2>
        <div className="card"><p style={{ margin: 0 }}>Link the person you care for to see their health here.</p><Link className="btn" to="/me">Enter their code</Link></div>
      </main>
    );
  }
  if (!data) return <main className="screen">{err ? <div className="err">{err}</div> : <p className="sub">Loading…</p>}</main>;

  const taken = data.slots.filter((s) => s.status === 'taken').length;
  return (
    <main className="screen">
      <div className="row sp"><div><h2 className="t">{data.elder.name}</h2><p className="sub">Updates every 30 seconds</p></div>
        <span className={`pill ${data.alerts.length ? 'bad' : 'ok'}`}>{data.alerts.length ? 'Has alerts' : 'All fine'}</span></div>

      {data.alerts.map((a) => (
        <div className="card" key={a._id} style={{ background: 'var(--bad-soft)', borderColor: 'transparent' }}>
          <div className="row sp"><b style={{ color: 'var(--bad)' }}>{a.kind === 'sos' ? 'SOS pressed' : a.text}</b><span className="sub">{ago(a.createdAt)}</span></div>
        </div>
      ))}

      <Tiles today={data.today} kcal={data.kcal} alertCount={0} />

      <div className="card">
        <div className="row sp"><h3 className="s">Medicine today</h3><span className={`pill ${data.slots.length && taken === data.slots.length ? 'ok' : 'mute'}`}>{taken} of {data.slots.length}</span></div>
        {data.slots.length === 0 && <p className="sub">No medicine added yet.</p>}
        {data.slots.map((s) => (
          <div className="dose" key={s.medId + s.time}>
            <span className="tm">{s.time}</span><div className="grow"><b>{s.name}</b></div>
            <span className={`pill ${pillFor[s.status][0]}`}>{pillFor[s.status][1]}</span>
          </div>
        ))}
      </div>

      {data.nextAppt && (
        <div className="card"><h3 className="s">Next appointment</h3><b>{data.nextAppt.title}</b><div className="sub">{data.nextAppt.place} · {data.nextAppt.date} {data.nextAppt.time}</div></div>
      )}
      <Link className="btn" to="/doses">Watch dose videos</Link>
    </main>
  );
}
