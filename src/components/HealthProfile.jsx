import { useEffect, useState } from 'react';
import { api } from '../api.js';

// elderId is only given on the caregiver side. name is the elder's name (caregiver side).
export default function HealthProfile({ elderId, name }) {
  const qs = elderId ? `?elder=${elderId}` : '';
  const [age, setAge] = useState('');
  const [conditions, setConditions] = useState('');
  const [medicines, setMedicines] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api(`/profile${qs}`)
      .then((p) => {
        setAge(p.age ?? ''); setConditions(p.conditions.join(', ')); setMedicines(p.medicines.join(', ')); setCanEdit(p.canEdit);
      })
      .catch((e) => setErr(e.message));
  }, [qs]);

  async function save(e) {
    e.preventDefault(); setMsg(''); setErr('');
    try {
      await api('/profile', { method: 'PUT', body: { age, conditions, medicines, elder: elderId } });
      setMsg('Saved. Aide will use this to fit its advice.');
    } catch (e2) { setErr(e2.message); }
  }

  const box = { width: '100%', margin: '6px 0 12px' };
  const idp = elderId || 'me';
  return (
    <form className="card" onSubmit={save}>
      <h3 className="s">{elderId ? `${name}'s health profile` : 'My health profile'}</h3>
      <p className="sub">
        {canEdit ? 'Aide uses this to give advice that fits. Separate items with commas.' : 'Set by your caregiver. Ask them if something needs to change.'}
      </p>
      <label htmlFor={`age-${idp}`}>Age</label>
      <input id={`age-${idp}`} type="number" value={age} onChange={(e) => setAge(e.target.value)} disabled={!canEdit} style={box} />
      <label htmlFor={`cond-${idp}`}>Health conditions</label>
      <input id={`cond-${idp}`} type="text" value={conditions} onChange={(e) => setConditions(e.target.value)} disabled={!canEdit} placeholder="Diabetes, High blood pressure" style={box} />
      <label htmlFor={`med-${idp}`}>Medicines</label>
      <input id={`med-${idp}`} type="text" value={medicines} onChange={(e) => setMedicines(e.target.value)} disabled={!canEdit} placeholder="Metformin, Amlodipine" style={box} />
      {err && <div className="err">{err}</div>}
      {msg && <div className="banner">{msg}</div>}
      {canEdit && <button className="btn full">Save profile</button>}
    </form>
  );
}