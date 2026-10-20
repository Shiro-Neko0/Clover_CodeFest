import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import DoseLog from '../components/DoseLog.jsx';
import { useTranslation } from '../i18n.js';

export default function CaregiverDoses() {
  const { t } = useTranslation();
  const [doses, setDoses] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try { setDoses((await api('/meds/doses')).doses); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <main className="screen">
      <h2 className="t">{t('doseVideos')}</h2>
      <p className="sub">{t('doseVideosDescription')}</p>
      {err && <div className="err">{err}</div>}
      {doses?.length === 0 && <div className="card"><p className="sub">{t('noDosesRecorded')}</p></div>}
      {doses?.map((d) => <DoseLog key={d._id} dose={d} canNote onChange={load} />)}
    </main>
  );
}
