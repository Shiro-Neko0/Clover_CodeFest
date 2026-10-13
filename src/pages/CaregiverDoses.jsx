import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import DoseLog from '../components/DoseLog.jsx';

export default function CaregiverDoses() {
  const [doses, setDoses] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { setDoses((await api('/meds/doses')).doses); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <main className="screen">
      <h2 className="t">Dose videos</h2>
      <p className="sub">Videos sent when medicine was taken. Leave a note and they will see it.</p>
      {err && <div className="err">{err}</div>}
      {doses?.length === 0 && <div className="card"><p className="sub">No doses recorded yet.</p></div>}
      {doses?.map((d) => <DoseLog key={d._id} dose={d} canNote onChange={load} />)}
    </main>
  );
}
