import Icon from './Icon.jsx';

// The status colours below use example thresholds from the prototype. They are not medical advice.
// Ask a health professional (or your lecturer) before presenting real cut-offs.
const sleepState = (h) => (h >= 7 ? ['ok', 'On target'] : h >= 6 ? ['warn', 'Slightly short'] : ['bad', 'Too short']);
const bpState = (s, d) => (s >= 140 || d >= 90 ? ['bad', 'High, recheck'] : ['ok', 'In range']);

export default function Tiles({ today, kcal = 0, alertCount = 0 }) {
  const sleep = today?.sleepHours != null ? sleepState(today.sleepHours) : null;
  const bp = today?.bpSys != null ? bpState(today.bpSys, today.bpDia) : null;
  const symptoms = today?.symptoms?.length ? today.symptoms.join(', ') : null;
  return (
    <div className="tiles">
      <div className="tile">
        <div className="lab"><Icon name="moon" size={18} /> Sleep</div>
        <div className="val">{today?.sleepHours ?? '–'}<small> hours</small></div>
        <div>{sleep ? <span className={`pill ${sleep[0]}`}>{sleep[1]}</span> : <span className="pill mute">Not told yet</span>}</div>
      </div>
      <div className="tile">
        <div className="lab"><Icon name="heart" size={18} /> Blood pressure</div>
        <div className="val">{bp ? `${today.bpSys}/${today.bpDia}` : '–'}</div>
        <div>{bp ? <span className={`pill ${bp[0]}`}>{bp[1]}</span> : <span className="pill mute">Not told yet</span>}</div>
      </div>
      <div className="tile">
        <div className="lab"><Icon name="food" size={18} /> Calories</div>
        <div className="val">{kcal.toLocaleString()}<small> / 1,800</small></div>
        <div className="meter"><i style={{ width: `${Math.min(100, Math.round((kcal / 1800) * 100))}%` }} /></div>
      </div>
      <div className="tile">
        <div className="lab"><Icon name="sos" size={18} /> Warning signs</div>
        <div className="val" style={{ fontSize: '1.1em', lineHeight: 1.2 }}>{symptoms || 'Nothing reported'}</div>
        <div><span className={`pill ${symptoms || alertCount ? 'bad' : 'ok'}`}>{symptoms || alertCount ? 'Needs a look' : 'None today'}</span></div>
      </div>
    </div>
  );
}
