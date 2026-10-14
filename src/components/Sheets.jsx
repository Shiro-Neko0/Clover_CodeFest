import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import Icon from './Icon.jsx';

function Sheet({ onClose, children }) {
  return (
    <div className="sheetwrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true"><div className="grab" />{children}</div>
    </div>
  );
}

// SOS: shows 999 and lets the elder alert their caregiver.
export function SosSheet({ onClose }) {
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  async function alertCaregiver() {
    try { await api('/alerts', { method: 'POST', body: { text: 'SOS pressed' } }); setSent(true); } catch (e) { setErr(e.message); }
  }
  return (
    <Sheet onClose={onClose}>
      <h2 className="t">Need help now?</h2>
      <p style={{ margin: 0 }}>If you are in danger or very unwell, call the emergency number.</p>
      <div className="card" style={{ background: 'var(--bad-soft)', borderColor: 'transparent', alignItems: 'center' }}>
        <span className="note" style={{ color: 'var(--bad)' }}>Emergency</span>
        <div style={{ font: '800 3em var(--font-d)', color: 'var(--bad)' }}>999</div>
      </div>
      {err && <div className="err">{err}</div>}
      {sent
        ? <div className="banner">Your caregiver has been alerted.</div>
        : <button className="btn bad full" onClick={alertCaregiver}><Icon name="bell" size={22} /> Alert my caregiver</button>}
      <button className="btn ghost full" onClick={onClose}>Close</button>
    </Sheet>
  );
}

const SUGGESTIONS = ['I feel dizzy', 'What can I eat for dinner?', 'Can I take pills with tea?', 'What is HbA1c?'];

// Ask clover: the AI chatbot, answered by /api/chat.
export function AskSheet({ onClose, name }) {
  const [msgs, setMsgs] = useState([{ from: 'bot', text: `Hello ${name}. Ask me about your medicine, food or how you feel. I give general information, not a diagnosis.` }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, busy]);

  async function send(q) {
    const t = q.trim();
    if (!t || busy) return;
    const next = [...msgs, { from: 'user', text: t }];
    setMsgs(next); setText(''); setBusy(true);
    try {
      const { reply } = await api('/chat', { method: 'POST', body: { messages: next } });
      setMsgs([...next, { from: 'bot', text: reply }]);
    } catch (e) {
      setMsgs([...next, { from: 'bot', text: e.message }]);
    } finally { setBusy(false); }
  }

  return (
    <Sheet onClose={onClose}>
      <div className="row sp"><h2 className="t">Ask Cakna</h2><span className="pill mute">AI</span></div>
      <div className="thread" style={{ maxHeight: 300 }}>
        {msgs.map((m, i) => <div key={i} className={`msg ${m.from === 'user' ? 'u' : 'b'}`}>{m.text}</div>)}
        {busy && <div className="typing">clover is typing…</div>}
        <div ref={end} />
      </div>
      <div className="chips">{SUGGESTIONS.map((q) => <button key={q} className="chip" onClick={() => send(q)}>{q}</button>)}</div>
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input id="ask-input" type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your question" aria-label="Your question" autoComplete="off" />
        <button className="round go" aria-label="Send"><Icon name="send" size={22} /></button>
      </form>
      <button className="btn ghost full" onClick={onClose}>Close</button>
    </Sheet>
  );
}
