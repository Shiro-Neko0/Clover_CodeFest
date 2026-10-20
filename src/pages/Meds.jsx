import { useCallback, useEffect, useState } from 'react';
import { api, uploadMedia } from '../api.js';
import Icon from '../components/Icon.jsx';
import DoseLog from '../components/DoseLog.jsx';
import { useTranslation } from '../i18n.js';

const nice = (hhmm) => new Date(`2000-01-01T${hhmm}`).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });

export default function Meds() {
  const { t } = useTranslation();
  const [slots, setSlots] = useState([]);
  const [doses, setDoses] = useState([]);
  const [patientCanAdd, setPatientCanAdd] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ name: '', dose: '', time: '08:00' });

  const load = useCallback(async () => {
    try {
      const [s, d, setting] = await Promise.all([
        api('/meds/today'),
        api('/meds/doses'),
        api('/meds/patient-add-setting')
      ]);
      setSlots(s.slots); setDoses(d.doses); setPatientCanAdd(setting.allowed);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const next = slots.find((s) => s.status !== 'taken');
  const taken = slots.filter((s) => s.status === 'taken').length;
  const pillFor = {
    taken: ['ok', t('taken')],
    due: ['warn', t('due')],
    missed: ['bad', t('missed')],
    later: ['mute', t('later')]
  };

  async function take(slot, file) {
    setBusy(true); setErr('');
    try {
      const videoUrl = file ? await uploadMedia(file, 'video') : null;
      await api(`/meds/${slot.medId}/take`, { method: 'POST', body: { time: slot.time, videoUrl } });
      await load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  async function addMed(e) {
    e.preventDefault();
    setErr('');
    try {
      await api('/meds', { method: 'POST', body: { name: form.name, dose: form.dose, times: [form.time] } });
      setForm({ name: '', dose: '', time: '08:00' }); await load();
    } catch (e2) { setErr(e2.message); }
  }

  return (
    <main className="screen">
      <h2 className="t">{t('medicine')}</h2>
      {err && <div className="err">{err}</div>}

      {next ? (
        <div className="card next">
          <div className="row sp"><b>{t('nextDose')}</b><span>{nice(next.time)}</span></div>
          <div><div style={{ font: '800 1.5em var(--font-d)' }}>{next.name}</div><div>{next.dose}</div></div>
          <label className="btn full" style={{ background: 'var(--accent-ink)', color: 'var(--accent)' }}>
            <Icon name="cam" size={22} /> {busy ? t('uploading') : t('recordVideoMarkTaken')}
            <input className="vh" type="file" accept="video/*" capture="environment" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) take(next, f); }} />
          </label>
          <div className="row">
            <button className="btn sm" style={{ background: 'rgba(255,255,255,.2)', color: 'inherit' }} disabled={busy} onClick={() => take(next, null)}>{t('markTakenWithoutVideo')}</button>
          </div>
          <span className="note">{t('caregiverCanWatch')}</span>
        </div>
      ) : (
        <div className="card"><b>{slots.length ? t('allMedicineTaken') : patientCanAdd === false ? t('askCaregiverToAdd') : patientCanAdd === null ? t('loadingMedicineSettings') : t('addOneBelow')}</b></div>
      )}

      {slots.length > 0 && (
        <div className="card">
          <div className="row sp"><h3 className="s">{t('today')}</h3><span className={`pill ${taken === slots.length ? 'ok' : 'mute'}`}>{t('ofTaken', { taken, total: slots.length })}</span></div>
          {slots.map((s) => (
            <div className="dose" key={s.medId + s.time}>
              <span className="tm">{nice(s.time)}</span>
              <div className="grow"><b>{s.name}</b><div className="sub">{s.dose}</div></div>
              <span className={`pill ${pillFor[s.status][0]}`}>{pillFor[s.status][1]}</span>
            </div>
          ))}
        </div>
      )}

      {patientCanAdd && (
        <details className="card add-med">
          <summary>{t('addMedicine')}</summary>
          <form onSubmit={addMed}>
            <div className="field"><label htmlFor="mname">{t('nameLabel')}</label><input id="mname" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="field"><label htmlFor="mdose">{t('howToTakeIt')}</label><input id="mdose" type="text" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder={t('medicineDosePlaceholder')} /></div>
            <div className="field"><label htmlFor="mtime">{t('time')}</label><input id="mtime" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></div>
            <button className="btn">{t('saveMedicine')}</button>
          </form>
        </details>
      )}
      {patientCanAdd === false && (
        <div className="card"><b>{t('caregiverManagesAdditions')}</b><p className="sub">{t('askCaregiverUpdateMedicine')}</p></div>
      )}

      <h3 className="s">{t('videoLog')}</h3>
      {doses.length === 0 && <p className="sub">{t('recordedDosesHere')}</p>}
      {doses.map((d) => <DoseLog key={d._id} dose={d} />)}
    </main>
  );
}
