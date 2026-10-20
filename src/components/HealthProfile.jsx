import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useTranslation } from '../i18n.js';

// elderId is only given on the caregiver side. name is the elder's name (caregiver side).
export default function HealthProfile({ elderId, name }) {
  const { t } = useTranslation();
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
      <h3 className="s">{elderId ? t('namedHealthProfile', { name }) : t('myHealthProfile')}</h3>
      <p className="sub">
        {canEdit ? t('profileAdviceEditable') : t('profileAdviceReadOnly')}
      </p>
      <label htmlFor={`age-${idp}`}>{t('age')}</label>
      <input id={`age-${idp}`} type="number" value={age} onChange={(e) => setAge(e.target.value)} disabled={!canEdit} style={box} />
      <label htmlFor={`cond-${idp}`}>{t('healthConditions')}</label>
      <input id={`cond-${idp}`} type="text" value={conditions} onChange={(e) => setConditions(e.target.value)} disabled={!canEdit} placeholder={t('conditionsPlaceholder')} style={box} />
      <label htmlFor={`med-${idp}`}>{t('medicines')}</label>
      <input id={`med-${idp}`} type="text" value={medicines} onChange={(e) => setMedicines(e.target.value)} disabled={!canEdit} placeholder={t('medicinesPlaceholder')} style={box} />
      {err && <div className="err">{err}</div>}
      {msg && <div className="banner">{t('profileSaved')}</div>}
      {canEdit && <button className="btn full">{t('saveProfile')}</button>}
    </form>
  );
}