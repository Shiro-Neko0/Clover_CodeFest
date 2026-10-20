import { useCallback, useEffect, useRef, useState } from 'react';
import { api, photoToBase64 } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icon.jsx';
import Tiles from '../components/Tiles.jsx';
import { useTranslation } from '../i18n.js';

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Health() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [msgs, setMsgs] = useState([{ from: 'bot', text: t('healthIntro', { name: user.name }) }]);
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
  useEffect(() => {
    setMsgs((current) => current.length === 1 && current[0].from === 'bot'
      ? [{ from: 'bot', text: t('healthIntro', { name: user.name }) }]
      : current);
  }, [i18n.language, t, user.name]);

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
    rec.lang = i18n.language === 'ms' ? 'ms-MY' : 'en-MY';
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
      <h2 className="t">{t('yourHealth')}</h2>
      {err && <div className="err">{err}</div>}

      <section className="card" aria-label={t('dailyCheckin')}>
        <div className="row sp"><h3 className="s">{t('todaysCheckin')}</h3><span className="pill mute">Cakna · AI</span></div>
        <div className="thread">
          {msgs.map((m, i) => <div key={i} className={`msg ${m.from === 'user' ? 'u' : 'b'}`}>{m.text}</div>)}
          {busy && <div className="typing">{t('typing')}</div>}
          {listening && <div className="typing">{t('listening')}</div>}
          <div ref={end} />
        </div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
          <input id="checkin-input" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('typeOrTapMic')} aria-label={t('yourAnswer')} autoComplete="off" />
          {SpeechRec && <button type="button" className={`round${listening ? ' live' : ''}`} onClick={listen} aria-label={t('speakYourAnswer')}><Icon name="mic" /></button>}
          <button className="round go" aria-label={t('send')} disabled={busy}><Icon name="send" size={22} /></button>
        </form>
      </section>

      <Tiles today={week.today} kcal={meals.kcal} />

      <section className="card" aria-label={t('mealsToday')}>
        <h3 className="s">{t('mealsToday')}</h3>
        {meals.meals.length === 0 && <p className="sub">{t('noMealsYet')}</p>}
        {meals.meals.map((m) => (
          <div className="meal" key={m._id}>
            <div className="thumb"><Icon name="food" size={26} /></div>
            <div className="grow"><b>{m.name}</b><div className="sub">{m.source === 'photo' ? t('fromPhoto') : t('fromChat')}</div></div>
            <b>{m.kcal} kcal</b>
          </div>
        ))}
        <hr className="hr" />
        <label className="btn full" aria-disabled={analyzing}>
          <Icon name="cam" size={22} /> {analyzing ? t('lookingAtPhoto') : t('addMealPhoto')}
          <input className="vh" type="file" accept="image/*" onChange={onPhoto} disabled={analyzing} />
        </label>
        {lastMeal && (
          <div className="card" style={{ background: 'var(--bg)', border: 0 }}>
            <div className="row sp"><b>{lastMeal.name}</b><span className="pill warn">{t('estimate')}</span></div>
            <div className="macros">
              <div><b>{lastMeal.kcal}</b>kcal</div><div><b>{lastMeal.carbs} g</b>{t('carbs')}</div><div><b>{lastMeal.protein} g</b>{t('protein')}</div>
            </div>
            <p style={{ margin: 0 }}><b>{t('suggestion')}:</b> {lastMeal.tip}</p>
          </div>
        )}
        <p className="note">{t('calorieEstimateDisclaimer')}</p>
      </section>

      <section className="card" aria-label={t('sleepLast7Days')}>
        <h3 className="s">{t('sleepLast7Days')}</h3>
        <div className="bars">
          {week.days.map((d, i) => (
            <div key={d.date} className={`c${i === week.days.length - 1 ? ' now' : ''}`}>
              <span>{d.sleepHours ?? ''}</span>
              <div style={{ height: `${d.sleepHours ? Math.round((d.sleepHours / maxSleep) * 100) : 0}%` }} />
            </div>
          ))}
        </div>
        <div className="days">
          {week.days.map((d) => <span key={d.date}>{new Date(d.date + 'T00:00').toLocaleDateString(i18n.language === 'ms' ? 'ms-MY' : 'en-GB', { weekday: 'short' }).slice(0, 3)}</span>)}
        </div>
      </section>
    </main>
  );
}
