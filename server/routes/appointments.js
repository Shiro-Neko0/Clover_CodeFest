import { Router } from 'express';
import { AppointmentM } from '../models.js';
import { requireAuth, resolveElder } from '../auth.js';

const r = Router();
r.use(requireAuth, resolveElder);

// GET /api/appointments  -> soonest first
r.get('/', async (req, res) => {
  res.json({ appointments: await AppointmentM.find({ elder: req.elderId }).sort({ date: 1, time: 1 }) });
});

// POST /api/appointments  { title, place, date: 'YYYY-MM-DD', time: 'HH:MM', remind }
r.post('/', async (req, res) => {
  const { title, place, date, time, remind } = req.body || {};
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ error: 'Add a title and a date.' });
  res.status(201).json({ appointment: await AppointmentM.create({ elder: req.elderId, title, place, date, time, remind: remind !== false }) });
});

// PATCH /api/appointments/:id  { remind }
r.patch('/:id', async (req, res) => {
  const appointment = await AppointmentM.findOneAndUpdate({ _id: req.params.id, elder: req.elderId }, { $set: { remind: !!req.body?.remind } }, { new: true });
  if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
  res.json({ appointment });
});

// DELETE /api/appointments/:id
r.delete('/:id', async (req, res) => {
  await AppointmentM.deleteOne({ _id: req.params.id, elder: req.elderId });
  res.json({ ok: true });
});

export default r;
