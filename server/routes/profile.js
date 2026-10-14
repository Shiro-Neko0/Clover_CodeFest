import { Router } from 'express';
import { UserM } from '../models.js';
import { requireAuth, onlyRole } from '../auth.js';

const r = Router();
r.use(requireAuth);

const toList = (v) =>
  (Array.isArray(v) ? v : String(v || '').split(','))
    .map((s) => String(s).trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 20);

r.get('/', onlyRole('elder'), async (req, res) => {
  const u = await UserM.findById(req.user._id);
  res.json({ age: u.age ?? null, conditions: u.conditions || [], medicines: u.medicines || [] });
});

r.put('/', onlyRole('elder'), async (req, res) => {
  const age = Number(req.body?.age);
  const update = {
    age: Number.isFinite(age) && age > 0 && age < 120 ? Math.round(age) : null,
    conditions: toList(req.body?.conditions),
    medicines: toList(req.body?.medicines)
  };
  const u = await UserM.findByIdAndUpdate(req.user._id, update, { new: true });
  res.json({ age: u.age ?? null, conditions: u.conditions, medicines: u.medicines });
});

export default r;