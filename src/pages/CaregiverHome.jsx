import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Tiles from '../components/Tiles.jsx';

const pillFor = {
  taken: ['ok', 'Taken'],
  due: ['warn', 'Due'],
  missed: ['bad', 'Missed'],
  later: ['mute', 'Later']
};

const ago = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur'
  });

export default function CaregiverHome() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundMessage, setSoundMessage] = useState('');
  const [activeSos, setActiveSos] = useState(null);
  const [alarmPlaying, setAlarmPlaying] = useState(false);

  const knownAlertIds = useRef(null);
  const activeSosRef = useRef(null);
  const soundEnabledRef = useRef(false);
  const alarmStoppedRef = useRef(false);
  const audioContextRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  const playBeep = useCallback((frequency = 880) => {
    const ctx = audioContextRef.current;
    if (!ctx || ctx.state !== 'running') return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.18,
      ctx.currentTime + 0.025
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.22
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.23);
  }, []);

  const playAlarmPattern = useCallback(() => {
    playBeep(880);
    window.setTimeout(() => playBeep(660), 260);
  }, [playBeep]);

  const startAlarm = useCallback(() => {
    if (alarmIntervalRef.current !== null) return;

    playAlarmPattern();
    alarmIntervalRef.current = window.setInterval(
      playAlarmPattern,
      1400
    );
    setAlarmPlaying(true);
  }, [playAlarmPattern]);

  const stopAlarm = useCallback(() => {
    if (alarmIntervalRef.current !== null) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    alarmStoppedRef.current = true;
    setAlarmPlaying(false);

    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  const enableSound = useCallback(async () => {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        setSoundMessage('Sound alerts are not supported in this browser.');
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      await audioContextRef.current.resume();
      soundEnabledRef.current = true;
      setSoundEnabled(true);
      setSoundMessage('Alarm sound is enabled.');

      // Let the caregiver hear a test beep.
      playBeep(880);

      if (activeSosRef.current && !alarmStoppedRef.current) {
        startAlarm();
      }
    } catch {
      setSoundMessage(
        'Could not enable sound. Check the browser sound settings.'
      );
    }
  }, [playBeep, startAlarm]);

  const load = useCallback(async () => {
    if (!user.elders.length) return;

    try {
      const result = await api('/overview');
      setData(result);
      setErr('');

      const alerts = result.alerts || [];
      const currentIds = new Set(alerts.map((a) => a._id));

      // First load establishes a baseline; old alerts do not sound again.
      if (knownAlertIds.current === null) {
        knownAlertIds.current = currentIds;
        return;
      }

      const newSos = alerts.find(
        (a) =>
          a.kind === 'sos' &&
          !knownAlertIds.current.has(a._id)
      );

      knownAlertIds.current = currentIds;

      if (newSos) {
        activeSosRef.current = newSos;
        setActiveSos(newSos);
        alarmStoppedRef.current = false;

        if (soundEnabledRef.current) {
          startAlarm();
        }

        if ('vibrate' in navigator) {
          navigator.vibrate([300, 120, 300, 120, 600]);
        }
      }
    } catch (e) {
      setErr(e.message);
    }
  }, [user.elders.length, startAlarm]);

  useEffect(() => {
    load();

    // Check for newly saved alerts every 5 seconds.
    const poll = window.setInterval(load, 5000);

    return () => {
      window.clearInterval(poll);

      if (alarmIntervalRef.current !== null) {
        window.clearInterval(alarmIntervalRef.current);
      }

      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [load]);

  if (!user.elders.length) {
    return (
      <main className="screen">
        <h2 className="t">Welcome, {user.name}</h2>
        <div className="card">
          <p style={{ margin: 0 }}>
            Link the person you care for to see their health here.
          </p>
          <Link className="btn" to="/me">Enter their code</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="screen">
        {err ? <div className="err">{err}</div> : <p className="sub">Loading...</p>}
      </main>
    );
  }

  const taken = data.slots.filter(
    (s) => s.status === 'taken'
  ).length;

  return (
    <main className="screen">
      <div className="row sp"><div><h2 className="t">{data.elder.name}</h2><p className="sub">Updates every 30 seconds</p></div>
        <span className={`pill ${data.alerts.length ? 'bad' : 'ok'}`}>{data.alerts.length ? 'Has alerts' : 'All fine'}</span></div>
      <div className="row sp">
        <div>
          <h2 className="t">{data.elder.name}</h2>
          <p className="sub">Checks for new alerts every 5 seconds</p>
        </div>
        <span className={`pill ${data.alerts.length ? 'bad' : 'ok'}`}>
          {data.alerts.length ? 'Has alerts' : 'All fine'}
        </span>
      </div>

      {!soundEnabled && (
        <div className="card">
          <h3 className="s">SOS notification settings</h3>
          <p className="sub">
            Enable sound before the demo. Keep this page open to detect new SOS alerts.
          </p>
          <button className="btn full" onClick={enableSound}>
            Enable alarm sound
          </button>
          {soundMessage && <p className="sub">{soundMessage}</p>}
        </div>
      )}

      {activeSos && (
        <div
          className="card"
          role="alert"
          style={{
            background: 'var(--bad-soft)',
            border: '2px solid var(--bad)',
            padding: 20
          }}
        >
          <h2 style={{ color: 'var(--bad)', marginTop: 0 }}>
            SOS ALERT — PLEASE CHECK NOW
          </h2>
          <p>
            <b>{data.elder.name}</b> may need help.
          </p>
          <p className="sub">Alert received: {ago(activeSos.createdAt)}</p>

          {alarmPlaying && (
            <button className="btn bad full" onClick={stopAlarm}>
              Stop alarm sound
            </button>
          )}

          {!alarmPlaying && soundEnabled && (
            <button
              className="btn bad full"
              onClick={() => {
                alarmStoppedRef.current = false;
                startAlarm();
              }}
            >
              Play alarm again
            </button>
          )}
        </div>
      )}

      <h3 className="s">Recent alerts</h3>
      {data.alerts.length === 0 && (
        <p className="sub">No alerts recorded.</p>
      )}

      {data.alerts.map((a) => (
        <div
          className="card"
          key={a._id}
          style={{
            background: a.kind === 'sos' ? 'var(--bad-soft)' : undefined,
            border: a.kind === 'sos' ? '1px solid var(--bad)' : undefined
          }}
        >
          <div className="row sp">
            <b style={{ color: a.kind === 'sos' ? 'var(--bad)' : undefined }}>
              {a.kind === 'sos' ? 'SOS pressed' : a.text}
            </b>
            <span className="sub">{ago(a.createdAt)}</span>
          </div>
        </div>
      ))}

      <Tiles today={data.today} kcal={data.kcal} alertCount={0} />

      <div className="card">
        <div className="row sp">
          <h3 className="s">Medicine today</h3>
          <span className={`pill ${data.slots.length && taken === data.slots.length ? 'ok' : 'mute'}`}>
            {taken} of {data.slots.length}
          </span>
        </div>

        {data.slots.length === 0 && (
          <p className="sub">No medicine added yet.</p>
        )}

        {data.slots.map((s) => (
          <div className="dose" key={s.medId + s.time}>
            <span className="tm">{s.time}</span>
            <div className="grow"><b>{s.name}</b></div>
            <span className={`pill ${pillFor[s.status][0]}`}>
              {pillFor[s.status][1]}
            </span>
          </div>
        ))}
      </div>

      {data.nextAppt && (
        <div className="card">
          <h3 className="s">Next appointment</h3>
          <b>{data.nextAppt.title}</b>
          <div className="sub">
            {data.nextAppt.place} · {data.nextAppt.date} {data.nextAppt.time}
          </div>
        </div>
      )}

      <Link className="btn" to="/doses">Watch dose videos</Link>
    </main>
  );
}