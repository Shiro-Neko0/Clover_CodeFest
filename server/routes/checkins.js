import { buildContext } from '../context.js';
import { Router } from 'express';
import { CheckInM, MealM, AlertM } from '../models.js';
import { requireAuth, onlyRole, resolveElder } from '../auth.js';
import { checkinTurn, RED_FLAGS } from '../ai.js';
import { todayKL, lastNDates } from '../util.js';

const r = Router();
r.use(requireAuth);

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// POST /api/checkins/message  { messages: [{ from: 'bot' | 'user', text }] }
// The AI reads the whole chat, replies like a person, and we save whatever facts it pulled out of the latest message.
r.post('/message', onlyRole('elder'), async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-20) : [];
  const last = messages[messages.length - 1];
  if (!last || last.from !== 'user' || !last.text) return res.status(400).json({ error: 'Send the chat so far, ending with the user message.' });

  const date = todayKL();
  const out = await checkinTurn(messages, await buildContext(req.user));
  if (RED_FLAGS.test(last.text)) out.reply = 'This may be an emergency. Please call 999 now. I am telling your caregiver.';
  const x = out.extracted || {};

  const symptoms = Array.isArray(x.symptoms) ? x.symptoms.filter(Boolean).map(String) : [];

  // Find today's record (or start one) and fill in whatever the person just told us.
  const checkin = (await CheckInM.findOne({ elder: req.user._id, date })) || new CheckInM({ elder: req.user._id, date });
  if (num(x.sleepHours) !== null) checkin.sleepHours = x.sleepHours;
  if (num(x.bpSys) !== null && num(x.bpDia) !== null) { checkin.bpSys = x.bpSys; checkin.bpDia = x.bpDia; }
  for (const s of symptoms) if (!checkin.symptoms.includes(s)) checkin.symptoms.push(s);
  await checkin.save();

  for (const m of Array.isArray(x.meals) ? x.meals : []) {
    if (m?.name && num(m.kcal) !== null) await MealM.create({ elder: req.user._id, date, name: m.name, kcal: m.kcal, source: 'chat' });
  }

  // Tell the caregiver about warning signs, using both the AI's list and a plain keyword check as a safety net.
  const flagged = symptoms.length ? symptoms : RED_FLAGS.test(last.text) ? [last.text.slice(0, 80)] : [];
  if (flagged.length) await AlertM.create({ elder: req.user._id, kind: 'symptom', text: `Reported: ${flagged.join(', ')}` });

  res.json({ reply: out.reply, done: out.done, checkin });
});

// GET /api/checkins/week  -> last 7 days, oldest first, plus today's record
r.get('/week', resolveElder, async (req, res) => {
  const dates = lastNDates(7);
  const rows = await CheckInM.find({ elder: req.elderId, date: { $in: dates } });
  const byDate = Object.fromEntries(rows.map((c) => [c.date, c]));
  res.json({
    days: dates.map((d) => ({ date: d, sleepHours: byDate[d]?.sleepHours ?? null, bpSys: byDate[d]?.bpSys ?? null, bpDia: byDate[d]?.bpDia ?? null })),
    today: byDate[todayKL()] || null
  });
});

export default r;
