import { useState } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

const when = (iso) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' });

// One recorded dose: the proof video plus any notes. Caregivers also get a box to add a note.
export default function DoseLog({ dose, canNote, onChange }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function addNote(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setErr('');
    try { await api(`/meds/doses/${dose._id}/notes`, { method: 'POST', body: { text } }); setText(''); onChange?.(); }
    catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  }

  return (
    <div className="card vlog">
      <div className="row sp"><b>{dose.medName}</b><span className="sub">{when(dose.takenAt)}</span></div>
      {dose.videoUrl
        ? <video controls playsInline preload="metadata" src={dose.videoUrl} />
        : <div className="vplace"><Icon name="video" size={30} /><span>No video recorded</span></div>}
      {dose.notes.map((n, i) => (
        <div className="cgnote" key={i}><b>Note from {n.by}</b>{n.text}</div>
      ))}
      {!dose.notes.length && !canNote && <span className="note">No note yet.</span>}
      {canNote && (
        <form className="composer" onSubmit={addNote}>
          <input id={`note-${dose._id}`} type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a note" aria-label="Note" />
          <button className="btn sm" disabled={busy}>Add note</button>
        </form>
      )}
      {err && <div className="err">{err}</div>}
    </div>
  );
}
