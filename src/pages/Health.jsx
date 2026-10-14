import { useCallback, useEffect, useRef, useState } from 'react';
import { api, photoToBase64 } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import Tiles from '../components/Tiles.jsx';

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Health() {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([{ from: 'bot', text: `Hello ${user.name}, I'm clover. How did you sleep last night?` }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [week, setWeek] = useState({ days: [], today: null });
  const [meals, setMeals] = useState({ meals: [], kcal: 0 });
  const [analyzing, setAnalyzing] = useState(false);
  const [lastMeal, setLastMeal] = useState(null);
  const [err, setErr] = useState('');
  const end = useRef(null);

  const load = useCallback(async () => {
    try {
      const [w, m] = await Promise.all([api('/checkins/week'), api('/meals')]);
      setWeek(w); setMeals(m);
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);

  async function send(value) {
    const t = value.trim();
    if (!t || busy) return;
    const next = [...msgs, { from: 'user', text: t }];
    setMsgs(next); setText(''); setBusy(true); setErr('');
    try {
      const { reply } = await api('/checkins/message', { method: 'POST', body: { messages: next } });
      setMsgs([...next, { from: 'bot', text: reply }]);
      load(); // refresh the dashboard with what the AI just learned
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  // Voice input uses the browser's built-in speech recognition. Test Bahasa Melayu (ms-MY) early. Support varies by phone.
  function listen() {
    if (!SpeechRec || listening) return;
    const rec = new SpeechRec();
    rec.lang = 'en-MY';
    rec.onresult = (e) => { setListening(false); send(e.results[0][0].transcript); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAnalyzing(true); setErr('');
    try {
      const photo = await photoToBase64(file);
      const { meal } = await api('/meals/analyze', { method: 'POST', body: photo });
      setLastMeal(meal); load();
    } catch (e2) { setErr(e2.message); } finally { setAnalyzing(false); }
  }

  const maxSleep = 10;
  return (
    <main className="screen">
      <h2 className="t">Your health</h2>
      {err && <div className="err">{err}</div>}

      <section className="card" aria-label="Daily check-in">
        <div className="row sp"><h3 className="s">Today's check-in</h3><span className="pill mute">clover · AI</span></div>
        <div className="thread">
          {msgs.map((m, i) => <div key={i} className={`msg ${m.from === 'user' ? 'u' : 'b'}`}>{m.text}</div>)}
          {busy && <div className="typing">clover is typing…</div>}
          {listening && <div className="typing">Listening…</div>}
          <div ref={end} />
        </div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <input id="checkin-input" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type, or tap the mic" aria-label="Your answer" autoComplete="off" />
          {SpeechRec && <button type="button" className={`round${listening ? ' live' : ''}`} onClick={listen} aria-label="Speak your answer"><Icon name="mic" /></button>}
          <button className="round go" aria-label="Send" disabled={busy}><Icon name="send" size={22} /></button>
        </form>
      </section>

      <Tiles today={week.today} kcal={meals.kcal} />

      <section className="card" aria-label="Meals">
        <h3 className="s">Meals today</h3>
        {meals.meals.length === 0 && <p className="sub">No meals yet. Tell clover in the chat, or add a photo.</p>}
        {meals.meals.map((m) => (
          <div className="meal" key={m._id}>
            <div className="thumb"><Icon name="food" size={26} /></div>
            <div className="grow"><b>{m.name}</b><div className="sub">{m.source === 'photo' ? 'From photo' : 'From chat'}</div></div>
            <b>{m.kcal} kcal</b>
          </div>
        ))}
        <hr className="hr" />
        <label className="btn full" aria-disabled={analyzing}>
          <Icon name="cam" size={22} /> {analyzing ? 'Looking at your photo…' : 'Add meal photo'}
          <input className="vh" type="file" accept="image/*" onChange={onPhoto} disabled={analyzing} />
        </label>
        {lastMeal && (
          <div className="card" style={{ background: 'var(--bg)', border: 0 }}>
            <div className="row sp"><b>{lastMeal.name}</b><span className="pill warn">Estimate</span></div>
            <div className="macros">
              <div><b>{lastMeal.kcal}</b>kcal</div><div><b>{lastMeal.carbs} g</b>carbs</div><div><b>{lastMeal.protein} g</b>protein</div>
            </div>
            <p style={{ margin: 0 }}><b>Suggestion:</b> {lastMeal.tip}</p>
          </div>
        )}
        <p className="note">Calories are AI estimates from a photo, not exact.</p>
      </section>

      <section className="card" aria-label="Sleep this week">
        <h3 className="s">Sleep, last 7 days</h3>
        <div className="bars">
          {week.days.map((d, i) => (
            <div key={d.date} className={`c${i === week.days.length - 1 ? ' now' : ''}`}>
              <span>{d.sleepHours ?? ''}</span>
              <div style={{ height: `${d.sleepHours ? Math.round((d.sleepHours / maxSleep) * 100) : 0}%` }} />
            </div>
          ))}
        </div>
        <div className="days">
          {week.days.map((d) => <span key={d.date}>{new Date(d.date + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 3)}</span>)}
        </div>
      </section>
    </main>
  );
}
