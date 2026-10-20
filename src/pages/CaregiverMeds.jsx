import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useTranslation } from '../i18n.js';
import { readMedicineLabel, extractMedicineDetails } from '../medicineOcr.js';

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
      setMeds(medResult.meds || []);
      setPatientCanAdd(setting.allowed);
    } catch (e) {
      setErr(e.message);
    }
  }, [elderId]);

  useEffect(() => {
    load();
  }, [load]);

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
    if (!window.confirm(`Remove ${med.name} from schedule?`)) return;
    setBusy(true);
    setErr('');
    try {
      await api(`/meds/${med._id}?elderId=${encodeURIComponent(elderId)}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen">
      <h2 className="t">{t('manageMedicine') || 'Manage medicine'}</h2>
      <p className="sub">Add or remove medicines from their schedule remotely.</p>

      {user.elders.length > 1 && (
        <div className="field">
          <label htmlFor="medicine-elder">{t('person') || 'Person'}</label>
          <select id="medicine-elder" value={elderId} onChange={(e) => setElderId(e.target.value)}>
            {user.elders.map((elder) => (
              <option key={elder.id} value={elder.id}>{elder.name}</option>
            ))}
          </select>
        </div>
      )}
      {err && <div className="err" role="alert">{err}</div>}

      <div className="card">
        <h3 className="s">{t('currentMedicines') || 'Current medicines'}</h3>
        {!meds.length && <p className="sub">{t('noMedicinesScheduled') || 'No medicines scheduled yet.'}</p>}
        {meds.map((med) => (
          <div className="dose" key={med._id}>
            <div className="grow">
              <b>{med.name}</b>
              {med.dose && <div className="sub">{med.dose}</div>}
              <div className="sub">{med.times?.join(', ')}</div>
            </div>
            <button className="btn bad sm" disabled={busy} onClick={() => deleteMed(med)}>
              {t('remove') || 'Remove'}
            </button>
          </div>
        ))}
      </div>

      <details className="card add-med" open>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>{t('addMedicine') || 'Add a medicine'}</summary>
        <form onSubmit={addMed}>
          
          {/* Photo OCR Scan */}
          <div className="field">
            <label htmlFor="medicine-photo">Medicine package photo</label>
            <input
              id="medicine-photo"
              type="file"
              accept="image/*"
              onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
            />
            <button
              className="btn"
              type="button"
              disabled={!ocrFile || ocrBusy || busy}
              onClick={scanMedicineLabel}
              style={{ marginTop: '0.5rem' }}
            >
              {ocrBusy ? `Reading label... ${ocrProgress}%` : 'Read medicine label (OCR)'}
            </button>
          </div>

          {/* OCR Review Warning Banner */}
          {ocrLines.length > 0 && (
            <div 
              style={{ 
                backgroundColor: 'rgba(234, 179, 8, 0.15)', 
                border: '1px solid #eab308', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                marginBottom: '1rem' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fef08a', fontWeight: 'bold' }}>
                Note: Please review extracted details
              </div>
              <p style={{ fontSize: '0.85rem', color: '#fef9c3', marginTop: '0.25rem' }}>
                OCR text extraction isn't always 100% accurate. Please review and correct the medicine name, dosage, and times below before saving.
              </p>
            </div>
          )}

          {/* OCR Lines Detected */}
          {ocrLines.length > 0 && (
            <div className="field">
              <label>Text detected — please verify it</label>
              <ul style={{ maxHeight: 110, overflowY: 'auto', fontSize: '0.85em', opacity: 0.85 }}>
                {ocrLines.map((line, idx) => (
                  <li key={`${idx}-${line}`}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Form Fields */}
          <div className="field">
            <label htmlFor="care-med-name">{t('nameLabel') || 'Name'}</label>
            <input
              id="care-med-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Isosorbide Dinitrate"
              required
            />
          </div>

          <div className="row sp" style={{ gap: '0.5rem' }}>
            <div className="field grow">
              <label htmlFor="care-med-how">{t('howToTakeIt') || 'How to take it'}</label>
              <input
                id="care-med-how"
                type="text"
                value={form.howToTake}
                onChange={(e) => setForm({ ...form, howToTake: e.target.value })}
                placeholder="e.g. Kunyah / Selepas makan"
              />
            </div>

            <div className="field" style={{ width: '110px' }}>
              <label htmlFor="care-med-count">Biji / Units</label>
              <input
                id="care-med-count"
                type="number"
                min="1"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="row sp" style={{ gap: '0.5rem' }}>
            <div className="field grow">
              <label htmlFor="care-med-dose">Dose / Strength</label>
              <input
                id="care-med-dose"
                type="text"
                value={form.doseStrength}
                onChange={(e) => setForm({ ...form, doseStrength: e.target.value })}
                placeholder="e.g. 10mg"
              />
            </div>

            <div className="field" style={{ width: '130px' }}>
              <label htmlFor="care-med-freq">Times per day</label>
              <input
                id="care-med-freq"
                type="number"
                min="1"
                max="6"
                value={form.timesPerDay}
                onChange={(e) => updateFrequency(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Alarm Boxes */}
          <div className="field">
            <label>
              Reminder Alarms ({form.timesPerDay} {form.timesPerDay > 1 ? 'times' : 'time'} / day)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.5rem', marginTop: '0.25rem' }}>
              {form.times.map((timeVal, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8ea8a6', marginBottom: '2px' }}>
                    Alarm #{idx + 1}
                  </span>
                  <input
                    type="time"
                    value={timeVal}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <button className="btn" disabled={busy} style={{ marginTop: '1rem' }}>
            {busy ? (t('saving') || 'Saving…') : (t('saveMedicine') || 'Save medicine')}
          </button>
        </form>
      </details>
    </main>
  );
}