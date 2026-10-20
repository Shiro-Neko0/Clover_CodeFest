import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';
import { useTranslation } from '../i18n.js';

const today = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};

const dateLabel = (date, lang) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const monthLabel = (date, lang) =>
  date.toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-GB', { month: 'long', year: 'numeric' });

const pad = (n) => String(n).padStart(2, '0');

export default function Appointments() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());
  const [viewMonth, setViewMonth] = useState(() => {
    const [year, month] = today().split('-').map(Number);
    return new Date(year, month - 1, 1);
  });
  const [form, setForm] = useState({
    title: t('checkup'),
    place: '',
    date: today(),
    time: '10:30',
  });
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

      <button className="btn full" onClick={() => {
        setForm((current) => ({ ...current, date: selectedDate }));
        setOpen((current) => !current);
      }}>
        <Icon name="plus" size={22} /> {t('bookAppointment')}
      </button>

      {open && (
        <form className="card" onSubmit={add}>
          <div className="field">
            <label htmlFor="atitle">{t('whatFor')}</label>
            <input id="atitle" type="text" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="aplace">{t('where')}</label>
            <input id="aplace" type="text" value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
              placeholder={t('healthClinic')} />
          </div>
          <div className="field">
            <label htmlFor="adate">{t('date')}</label>
            <input id="adate" type="date" value={form.date} min={today()}
              onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </div>
          <div className="field">
            <label htmlFor="atime">{t('time')}</label>
            <input id="atime" type="time" value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })} required />
          </div>
          <button className="btn" disabled={busy}>
            {busy ? t('saving') || 'Saving...' : t('saveAppointment')}
          </button>
          <span className="note">
            {t('appointmentDisclaimer')}
          </span>
        </form>
      )}

      {/* Interactive Month-Grid Calendar */}
      <section className="card">
        <div className="row sp" style={{ alignItems: 'center', marginBottom: 12 }}>
          <button className="btn sm ghost" type="button" aria-label="Previous month"
            onClick={() => changeMonth(-1)}>‹</button>
          <h3 className="s">{monthLabel(viewMonth, i18n.language)}</h3>
          <button className="btn sm ghost" type="button" aria-label="Next month"
            onClick={() => changeMonth(1)}>›</button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 4,
          textAlign: 'center',
        }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="sub" style={{ padding: '6px 0', fontSize: '.8em' }}>
              {day}
            </div>
          ))}

          {monthDays.map((date, index) => {
            if (!date) return <div key={`empty-${index}`} />;

            const hasAppointments = (appointmentsByDate[date] || []).length > 0;
            const isSelected = selectedDate === date;
            const isToday = today() === date;

            return (
              <button
                key={date}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${date}${hasAppointments ? ', has appointments' : ''}`}
                onClick={() => setSelectedDate(date)}
                style={{
                  minWidth: 0,
                  minHeight: 52,
                  padding: '6px 2px',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: hasAppointments
                    ? '#4CD5C5'
                    : isSelected
                    ? 'rgba(76, 213, 197, 0.2)'
                    : 'transparent',
                  color: hasAppointments ? '#0B2023' : '#FFFFFF',
                  border: isSelected
                    ? '2px solid #4CD5C5'
                    : isToday
                    ? '1px dashed #4CD5C5'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: hasAppointments || isToday || isSelected ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease-in-out',
                }}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>
                  {Number(date.slice(-2))}
                </span>
                
                <span
                  style={{
                    marginTop: 4,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 8,
                    backgroundColor: hasAppointments ? '#0B2023' : isToday ? '#4CD5C5' : 'transparent',
                    color: hasAppointments ? '#4CD5C5' : isToday ? '#0B2023' : 'transparent',
                    lineHeight: 1,
                  }}
                >
                  {hasAppointments ? 'APPT' : isToday ? 'TODAY' : ''}
                </span>
              </button>
            );
          })}
        </div>

        <p className="note" style={{ marginTop: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span>
            <span style={{ display: 'inline-block', width: 8, height: 8, backgroundColor: '#4CD5C5', borderRadius: 2, marginRight: 4 }}></span> 
            Appointment booked
          </span>
          <span>
            <span style={{ borderBottom: '1px dashed #4CD5C5' }}>Today</span>
          </span>
        </p>
      </section>

      {/* Selected Date Appointments */}
      <h3 className="s">Appointments on {dateLabel(selectedDate, i18n.language)}</h3>
      {selectedAppointments.length === 0 ? (
        <div className="card"><p className="sub">No appointments on this date.</p></div>
      ) : selectedAppointments.map((appointment) => (
        <div className="card" key={appointment._id}>
          <div className="appt">
            <div className="when">
              <b>{appointment.time || '—'}</b>
              <span>{dateLabel(appointment.date, i18n.language)}</span>
            </div>
            <div className="grow">
              <h3 className="s">{appointment.title}</h3>
              <p className="sub">{appointment.place || 'Location not specified'}</p>
            </div>
          </div>
          <div className="row sp">
            <span className="sub">{t('remindMe')}</span>
            <button className="sw" type="button" role="switch"
              aria-checked={!!appointment.remind}
              aria-label={`Reminder for ${appointment.title}`}
              onClick={() => toggle(appointment)} />
          </div>
          <button className="btn ghost sm" type="button"
            onClick={() => remove(appointment)}>{t('remove')}</button>
        </div>
      ))}

      {/* Upcoming List */}
      <h3 className="s">{t('comingUp')}</h3>
      {upcoming.length === 0 ? (
        <div className="card"><p className="sub">{t('nothingBooked')}</p></div>
      ) : upcoming.map((appointment) => (
        <button
          className="card"
          key={`upcoming-${appointment._id}`}
          type="button"
          onClick={() => {
            setSelectedDate(appointment.date);
            const [year, month] = appointment.date.split('-').map(Number);
            setViewMonth(new Date(year, month - 1, 1));
          }}
          style={{ width: '100%', textAlign: 'left', color: 'inherit', cursor: 'pointer' }}
        >
          <div className="appt">
            <div className="when">
              <b>{appointment.time || '—'}</b>
              <span>{dateLabel(appointment.date, i18n.language)}</span>
            </div>
            <div className="grow">
              <h3 className="s">{appointment.title}</h3>
              <p className="sub">{appointment.place || 'Location not specified'}</p>
            </div>
          </div>
        </button>
      ))}
    </main>
  );
}