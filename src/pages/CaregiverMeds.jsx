import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function CaregiverMeds() {
  const { user } = useAuth();
  const [elderId, setElderId] = useState(user.elders[0]?.id || '');
  const [meds, setMeds] = useState([]);
  const [patientCanAdd, setPatientCanAdd] = useState(null);
  const [form, setForm] = useState({ name: '', dose: '', time: '08:00' });
  const [busy, setBusy] = useState(false);
  const [savingSetting, setSavingSetting] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!elderId) return;
    try {
      setErr('');
      setPatientCanAdd(null);
      const query = `elderId=${encodeURIComponent(elderId)}`;
      const [medResult, setting] = await Promise.all([
        api(`/meds?${query}`),
        api(`/meds/patient-add-setting?${query}`)
      ]);
      setMeds(medResult.meds);
      setPatientCanAdd(setting.allowed);
    } catch (e) { setErr(e.message); }
  }, [elderId]);

  useEffect(() => { load(); }, [load]);

  async function updatePatientAddSetting(e) {
    const allowed = e.target.checked;
    setSavingSetting(true);
    setErr('');
    try {
      const result = await api('/meds/patient-add-setting', {
        method: 'PUT',
        body: { elderId, allowed }
      });
      setPatientCanAdd(result.allowed);
    } catch (e2) { setErr(e2.message); } finally { setSavingSetting(false); }
  }

  async function addMed(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api('/meds', {
        method: 'POST',
        body: { elderId, name: form.name, dose: form.dose, times: [form.time] }
      });
      setForm({ name: '', dose: '', time: '08:00' });
      await load();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  }

  async function deleteMed(med) {
    if (!window.confirm(`Remove ${med.name} from the medicine schedule?`)) return;
    setBusy(true);
    setErr('');
    try {
      await api(`/meds/${med._id}?elderId=${encodeURIComponent(elderId)}`, { method: 'DELETE' });
      await load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  if (!user.elders.length) {
    return (
      <main className="screen">
        <h2 className="t">Manage medicine</h2>
        <div className="card"><p className="sub">Link the person you care for on your Profile before managing their medicine.</p></div>
      </main>
    );
  }

  return (
    <main className="screen">
      <h2 className="t">Manage medicine</h2>
      <p className="sub">Add or remove medicines from their schedule remotely.</p>
      {user.elders.length > 1 && (
        <div className="field">
          <label htmlFor="medicine-elder">Person</label>
          <select id="medicine-elder" value={elderId} onChange={(e) => setElderId(e.target.value)}>
            {user.elders.map((elder) => <option key={elder.id} value={elder.id}>{elder.name}</option>)}
          </select>
        </div>
      )}
      {err && <div className="err" role="alert">{err}</div>}

      <div className="card">
        <div className="row sp">
          <div className="grow">
            <h3 className="s">Patient can add medicines</h3>
            <p className="sub">Choose whether they can add medicines from their own Medicine tab.</p>
          </div>
          <input
            className="setting-toggle"
            type="checkbox"
            aria-label="Allow patient to add medicines"
            checked={patientCanAdd === true}
            disabled={patientCanAdd === null || savingSetting}
            onChange={updatePatientAddSetting}
          />
        </div>
        {patientCanAdd === null && <span className="note">Loading setting…</span>}
        {savingSetting && <span className="note">Saving setting…</span>}
      </div>

      <div className="card">
        <h3 className="s">Current medicines</h3>
        {!meds.length && <p className="sub">No medicines are scheduled yet.</p>}
        {meds.map((med) => (
          <div className="dose" key={med._id}>
            <div className="grow">
              <b>{med.name}</b>
              {med.dose && <div className="sub">{med.dose}</div>}
              <div className="sub">{med.times.join(', ')}</div>
            </div>
            <button className="btn bad sm" disabled={busy} onClick={() => deleteMed(med)}>Remove</button>
          </div>
        ))}
      </div>

      <details className="card add-med" open>
        <summary>Add a medicine</summary>
        <form onSubmit={addMed}>
          <div className="field"><label htmlFor="care-med-name">Name</label><input id="care-med-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="field"><label htmlFor="care-med-dose">How to take it</label><input id="care-med-dose" type="text" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder="500 mg, 1 tablet after breakfast" /></div>
          <div className="field"><label htmlFor="care-med-time">Time</label><input id="care-med-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></div>
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save medicine'}</button>
        </form>
      </details>
    </main>
  );
}
