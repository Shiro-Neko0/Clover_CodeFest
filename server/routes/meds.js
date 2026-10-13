import { Router } from 'express';
import { MedicationM, DoseLogM } from '../models.js';
import { requireAuth, onlyRole, resolveElder } from '../auth.js';
import { todayKL, nowMinutesKL, toMinutes } from '../util.js';

const r = Router();
r.use(requireAuth);

// Builds today's dose list: one row per medicine per time, marked taken / due / missed / later.
// "due" starts at the scheduled time. "missed" starts 2 hours after it.
export async function todaySlots(elderId) {
  const date = todayKL();
  const [meds, logs] = await Promise.all([
    MedicationM.find({ elder: elderId, active: true }),
    DoseLogM.find({ elder: elderId, date })
  ]);
  const now = nowMinutesKL();
  const slots = [];
  for (const med of meds) {
    for (const time of med.times) {
      const log = logs.find((l) => String(l.medication) === String(med._id) && l.time === time);
      const t = toMinutes(time);
      const status = log ? 'taken' : now >= t + 120 ? 'missed' : now >= t ? 'due' : 'later';
      slots.push({ medId: med._id, name: med.name, dose: med.dose, time, status, doseId: log?._id || null });
    }
  }
  return slots.sort((a, b) => a.time.localeCompare(b.time));
}

// GET /api/meds/today
r.get('/today', resolveElder, async (req, res) => res.json({ slots: await todaySlots(req.elderId) }));

// GET /api/meds/doses  -> video log, newest first
r.get('/doses', resolveElder, async (req, res) => {
  res.json({ doses: await DoseLogM.find({ elder: req.elderId }).sort({ takenAt: -1 }).limit(30) });
});

// GET /api/meds
r.get('/', resolveElder, async (req, res) => res.json({ meds: await MedicationM.find({ elder: req.elderId, active: true }) }));

// POST /api/meds  { name, dose, times: ['08:00'] }   (elder or caregiver)
r.post('/', resolveElder, async (req, res) => {
  const { name, dose, times } = req.body || {};
  const list = (Array.isArray(times) ? times : []).filter((t) => /^\d{2}:\d{2}$/.test(t));
  if (!name || !list.length) return res.status(400).json({ error: 'Add the medicine name and at least one time, like 08:00.' });
  res.status(201).json({ med: await MedicationM.create({ elder: req.elderId, name, dose, times: list }) });
});

// POST /api/meds/:id/take  { time, videoUrl }
r.post('/:id/take', onlyRole('elder'), async (req, res) => {
  const med = await MedicationM.findOne({ _id: req.params.id, elder: req.user._id });
  if (!med) return res.status(404).json({ error: 'Medicine not found.' });
  const { time, videoUrl } = req.body || {};
  if (!med.times.includes(time)) return res.status(400).json({ error: 'That time is not on this medicine.' });
  const date = todayKL();
  const dose = await DoseLogM.findOneAndUpdate(
    { elder: req.user._id, medication: med._id, date, time },
    { $set: { medName: med.name, videoUrl: videoUrl || null }, $setOnInsert: { takenAt: new Date() } },
    { upsert: true, new: true }
  );
  res.status(201).json({ dose });
});

// POST /api/meds/doses/:id/notes  { text }   (caregiver only)
r.post('/doses/:id/notes', onlyRole('caregiver'), async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Write a note first.' });
  const dose = await DoseLogM.findOne({ _id: req.params.id, elder: { $in: req.user.elders } });
  if (!dose) return res.status(404).json({ error: 'Dose not found.' });
  dose.notes.push({ by: req.user.name, text: text.slice(0, 500) });
  await dose.save();
  res.status(201).json({ dose });
});

export default r;
