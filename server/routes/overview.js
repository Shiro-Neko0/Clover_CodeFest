import { Router } from 'express';
import { CheckInM, MealM, AlertM, AppointmentM, UserM } from '../models.js';
import { requireAuth, onlyRole, resolveElder } from '../auth.js';
import { todaySlots } from './meds.js';
import { todayKL } from '../util.js';

const r = Router();
r.use(requireAuth);

// POST /api/alerts  { text }   -> the SOS button
r.post('/alerts', onlyRole('elder'), async (req, res) => {
  const alert = await AlertM.create({ elder: req.user._id, kind: 'sos', text: String(req.body?.text || 'SOS pressed').slice(0, 200) });
  res.status(201).json({ alert });
});

// GET /api/overview  -> everything the caregiver home screen needs in one call
r.get('/overview', resolveElder, async (req, res) => {
  const date = todayKL();
  const [elder, today, meals, slots, alerts, nextAppt] = await Promise.all([
    UserM.findById(req.elderId).select('name'),
    CheckInM.findOne({ elder: req.elderId, date }),
    MealM.find({ elder: req.elderId, date }),
    todaySlots(req.elderId),
    AlertM.find({ elder: req.elderId }).sort({ createdAt: -1 }).limit(5),
    AppointmentM.findOne({ elder: req.elderId, date: { $gte: date } }).sort({ date: 1, time: 1 })
  ]);
  res.json({
    elder: { id: elder._id, name: elder.name },
    today,
    kcal: meals.reduce((sum, m) => sum + (m.kcal || 0), 0),
    slots, alerts, nextAppt
  });
});

export default r;
