import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useTranslation } from '../i18n.js';

export default function CaregiverMeds() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [elderId, setElderId] = useState(user.elders[0]?.id || '');
  const [meds, setMeds] = useState([]);
  const [patientCanAdd, setPatientCanAdd] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    howToTake: '',
    count: '1',
    doseStrength: '',
    timesPerDay: 1,
    times: ['08:00'],
  });

  const [busy, setBusy] = useState(false);
  const [savingSetting, setSavingSetting] = useState(false);
  const [err, setErr] = useState('');
  const [ocrFile, setOcrFile] = useState(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLines, setOcrLines] = useState([]);

  const load = useCallback(async () => {
    if (!elderId) return;
    try {
      setErr('');
      setPatientCanAdd(null);
      const query = `elderId=${encodeURIComponent(elderId)}`;
      const [medResult, setting] = await Promise.all([
        api(`/meds?${query}`),
        api(`/meds/patient-add-setting?${query}`),
      ]);
      setMeds(medResult.meds);
      setPatientCanAdd(setting.allowed);
    } catch (e) {
      setErr(e.message);
    }
  }, [elderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Adjust time boxes when "Times per day" changes
  function updateFrequency(newFreq) {
    const freq = Math.max(1, parseInt(newFreq, 10) || 1);
    const defaultSlots = ['08:00', '13:00', '19:00', '22:00'];
    
    let updatedTimes = [...form.times];
    if (updatedTimes.length < freq) {
      while (updatedTimes.length < freq) {
        updatedTimes.push(defaultSlots[updatedTimes.length] || '12:00');
      }
    } else if (updatedTimes.length > freq) {
      updatedTimes = updatedTimes.slice(0, freq);
    }

    setForm({ ...form, timesPerDay: freq, times: updatedTimes });
  }

  function handleTimeChange(index, value) {
    const updated = [...form.times];
    updated[index] = value;
    setForm({ ...form, times: updated });
  }

  async function scanMedicineLabel() {
    if (!ocrFile) {
      setErr('Please choose a medicine photo first.');
      return;
    }

    setOcrBusy(true);
    setOcrProgress(0);
    setOcrLines([]);
    setErr('');

    try {
      const lines = await readMedicineLabel(ocrFile, setOcrProgress);
      const details = extractMedicineDetails(lines);

      setOcrLines(lines);

      setForm({
        name: details.name || form.name,
        howToTake: details.howToTake || form.howToTake || 'Selepas makan',
        count: details.count || form.count,
        doseStrength: details.doseStrength || form.doseStrength,
        timesPerDay: details.frequency || 1,
        times: details.times.length ? details.times : ['08:00'],
      });

      if (!details.name && !details.doseStrength) {
        setErr('Text detected, but details were unclear. Please fill in any missing fields.');
      }
    } catch (error) {
      setErr(`Could not read photo: ${error.message}`);
    } finally {
      setOcrBusy(false);
    }
  }

  async function addMed(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');

    const fullDoseString = `${form.count} biji / tablet (${form.doseStrength || 'Standard'}) — ${form.howToTake}`;

    try {
      await api('/meds', {
        method: 'POST',
        body: {
          elderId,
          name: form.name,
          dose: fullDoseString,
          times: form.times,
        },
      });
      setForm({
        name: '',
        howToTake: '',
        count: '1',
        doseStrength: '',
        timesPerDay: 1,
        times: ['08:00'],
      });
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteMed(med) {
    if (!window.confirm(t('medicineRemovalConfirm', { name: med.name }))) return;
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
        <h2 className="t">{t('manageMedicine')}</h2>
        <div className="card"><p className="sub">{t('linkCareRecipientFirst')}</p></div>
      </main>
    );
  }

  return (
    <main className="screen">
      <h2 className="t">{t('manageMedicine')}</h2>
      <p className="sub">{t('manageMedicineDescription')}</p>
      {user.elders.length > 1 && (
        <div className="field">
          <label htmlFor="medicine-elder">{t('person')}</label>
          <select id="medicine-elder" value={elderId} onChange={(e) => setElderId(e.target.value)}>
            {user.elders.map((elder) => (
              <option key={elder.id} value={elder.id}>{elder.name}</option>
            ))}
          </select>
        </div>
      )}
      {err && <div className="err" role="alert">{err}</div>}

      <div className="card">
        <div className="row sp">
          <div className="grow">
            <h3 className="s">{t('patientCanAddMedicines')}</h3>
            <p className="sub">{t('patientCanAddDescription')}</p>
          </div>
          <input
            className="setting-toggle"
            type="checkbox"
            aria-label={t('allowPatientToAdd')}
            checked={patientCanAdd === true}
            disabled={patientCanAdd === null || savingSetting}
            onChange={updatePatientAddSetting}
          />
        </div>
        {patientCanAdd === null && <span className="note">{t('loadingSetting')}</span>}
        {savingSetting && <span className="note">{t('savingSetting')}</span>}
      </div>

      <div className="card">
        <h3 className="s">{t('currentMedicines')}</h3>
        {!meds.length && <p className="sub">{t('noMedicinesScheduled')}</p>}
        {meds.map((med) => (
          <div className="dose" key={med._id}>
            <div className="grow">
              <b>{med.name}</b>
              {med.dose && <div className="sub">{med.dose}</div>}
              <div className="sub">{med.times?.join(', ')}</div>
            </div>
            <button className="btn bad sm" disabled={busy} onClick={() => deleteMed(med)}>{t('remove')}</button>
          </div>
        ))}
      </div>

      <details className="card add-med" open>
        <summary>{t('addMedicine')}</summary>
        <form onSubmit={addMed}>
          <div className="field"><label htmlFor="care-med-name">{t('nameLabel')}</label><input id="care-med-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="field"><label htmlFor="care-med-dose">{t('howToTakeIt')}</label><input id="care-med-dose" type="text" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder={t('medicineDosePlaceholder')} /></div>
          <div className="field"><label htmlFor="care-med-time">{t('time')}</label><input id="care-med-time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></div>
          <button className="btn" disabled={busy}>{busy ? t('saving') : t('saveMedicine')}</button>
        </form>
      </details>
    </main>
  );
}