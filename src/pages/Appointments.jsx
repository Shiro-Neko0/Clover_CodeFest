import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import Icon from '../components/Icon.jsx';

// TODO (team): swap this list for the month-grid calendar from the prototype (see "apptsView" in care-aide.html).
const fmt = (d) => new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });

export default function Appointments() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: 'Check-up', place: '', date: today(), time: '10:30' });
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try { setItems((await api('/appointments')).appointments); } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add(e) {
    e.preventDefault(); setErr('');
    try { await api('/appointments', { method: 'POST', body: form }); setOpen(false); load(); } catch (e2) { setErr(e2.message); }
  }
  const toggle = async (a) => { await api(`/appointments/${a._id}`, { method: 'PATCH', body: { remind: !a.remind } }); load(); };
  const remove = async (a) => { await api(`/appointments/${a._id}`, { method: 'DELETE' }); load(); };

  const upcoming = items.filter((a) => a.date >= today());
  const past = items.filter((a) => a.date < today());

  return (
    <main className="screen">
      <h2 className="t">Calendar</h2>
      {err && <div className="err">{err}</div>}
      <button className="btn full" onClick={() => setOpen(!open)}><Icon name="plus" size={22} /> Book an appointment</button>

      {open && (
        <form className="card" onSubmit={add}>
          <div className="field"><label htmlFor="atitle">What for</label><input id="atitle" type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="field"><label htmlFor="aplace">Where</label><input id="aplace" type="text" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Klinik Kesihatan" /></div>
          <div className="field"><label htmlFor="adate">Date</label><input id="adate" type="date" value={form.date} min={today()} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
          <div className="field"><label htmlFor="atime">Time</label><input id="atime" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
          <button className="btn">Save appointment</button>
          <span className="note">This saves your own record. It does not book with a real clinic.</span>
        </form>
      )}

      <h3 className="s">Coming up</h3>
      {upcoming.length === 0 && <div className="card"><p className="sub">Nothing booked yet.</p></div>}
      {upcoming.map((a) => (
        <div className="card" key={a._id}>
          <div className="appt">
            <div className="when"><b>{a.time || '–'}</b><span>{fmt(a.date).split(' ').slice(1).join(' ')}</span></div>
            <div className="grow"><h3 className="s">{a.title}</h3><p className="sub">{a.place} · {fmt(a.date)}</p></div>
          </div>
          <div className="row sp">
            <span className="sub">Remind me</span>
            <button className="sw" role="switch" aria-checked={a.remind} aria-label={`Reminder for ${a.title}`} onClick={() => toggle(a)} />
          </div>
          <button className="btn ghost sm" onClick={() => remove(a)}>Remove</button>
        </div>
      ))}
      {past.length > 0 && <p className="note">{past.length} past appointment{past.length > 1 ? 's' : ''} hidden.</p>}
    </main>
  );
}
