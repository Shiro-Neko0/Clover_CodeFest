import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import { useTranslation } from '../i18n.js';

// TODO (team): swap this list for the month-grid calendar from the prototype (see "apptsView" in care-clover.html).
const fmt = (d, language) => new Date(d + 'T00:00').toLocaleDateString(language === 'ms' ? 'ms-MY' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });

export default function Appointments() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => ({ title: t('checkup'), place: '', date: today(), time: '10:30' }));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await api('/appointments');
      setItems(result.appointments || []);
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    for (const appointment of items) {
      if (!grouped[appointment.date]) grouped[appointment.date] = [];
      grouped[appointment.date].push(appointment);
    }
    return grouped;
  }, [items]);

  const monthDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < mondayOffset; i++) {
      cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(`${year}-${pad(month + 1)}-${pad(day)}`);
    }

    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewMonth]);

  const selectedAppointments = appointmentsByDate[selectedDate] || [];
  const upcoming = items
    .filter((a) => a.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  async function add(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);

    try {
      await api('/appointments', { method: 'POST', body: form });
      setSelectedDate(form.date);
      const [year, month] = form.date.split('-').map(Number);
      setViewMonth(new Date(year, month - 1, 1));
      setOpen(false);
      await load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(appointment) {
    setErr('');
    try {
      await api(`/appointments/${appointment._id}`, {
        method: 'PATCH',
        body: { remind: !appointment.remind },
      });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function remove(appointment) {
    if (!window.confirm(`Remove "${appointment.title}"?`)) return;

    setErr('');
    try {
      await api(`/appointments/${appointment._id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  function changeMonth(offset) {
    setViewMonth((current) => new Date(
      current.getFullYear(),
      current.getMonth() + offset,
      1,
    ));
  }

  return (
    <main className="screen">
      <h2 className="t">{t('appointmentCalendar')}</h2>
      {err && <div className="err">{err}</div>}
      <button className="btn full" onClick={() => setOpen(!open)}><Icon name="plus" size={22} /> {t('bookAppointment')}</button>

      {open && (
        <form className="card" onSubmit={add}>
          <div className="field"><label htmlFor="atitle">{t('whatFor')}</label><input id="atitle" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="field"><label htmlFor="aplace">{t('where')}</label><input id="aplace" type="text" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder={t('healthClinic')} /></div>
          <div className="field"><label htmlFor="adate">{t('date')}</label><input id="adate" type="date" value={form.date} min={today()} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
          <div className="field"><label htmlFor="atime">{t('time')}</label><input id="atime" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
          <button className="btn">{t('saveAppointment')}</button>
          <span className="note">{t('appointmentDisclaimer')}</span>
        </form>
      )}

      <h3 className="s">{t('comingUp')}</h3>
      {upcoming.length === 0 && <div className="card"><p className="sub">{t('nothingBooked')}</p></div>}
      {upcoming.map((a) => (
        <div className="card" key={a._id}>
          <div className="appt">
            <div className="when"><b>{a.time || '–'}</b><span>{fmt(a.date, i18n.language).split(' ').slice(1).join(' ')}</span></div>
            <div className="grow"><h3 className="s">{a.title}</h3><p className="sub">{a.place} · {fmt(a.date, i18n.language)}</p></div>
          </div>
          <div className="row sp">
            <span className="sub">{t('remindMe')}</span>
            <button className="sw" role="switch" aria-checked={a.remind} aria-label={`Reminder for ${a.title}`} onClick={() => toggle(a)} />
          </div>
          <button className="btn ghost sm" onClick={() => remove(a)}>{t('remove')}</button>
        </div>
      ))}
      {past.length > 0 && <p className="note">{t(past.length === 1 ? 'pastAppointmentHidden' : 'pastAppointmentsHidden', { count: past.length })}</p>}
    </main>
  );
}