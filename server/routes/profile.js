import { Router } from 'express';
import { UserM } from '../models.js';
import { requireAuth } from '../auth.js';

const r = Router();
r.use(requireAuth);

const idOf = (x) => String(x?._id ?? x?.id ?? x);

const toList = (v) =>
  (Array.isArray(v) ? v : String(v || '').split(','))
    .map((s) => String(s).trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 20);

// Works out whose profile is being used, and whether this person may change it.
// Elder: their own profile, editable only when they have no caregiver.
// Caregiver: only the elders linked to them, always editable.
async function resolve(req, res) {
  const me = await UserM.findById(req.user._id);
  if (me.role === 'elder') {
    return { elder: me, canEdit: (me.caregivers || []).length === 0 };
  }
  const id = String(req.query.elder || req.body?.elder || '');
  if (!(me.elders || []).some((e) => idOf(e) === id)) {
    res.status(403).json({ error: 'You can only see the profile of someone you care for.' });
    return null;
  }
  const elder = await UserM.findById(id);
  if (!elder) { res.status(404).json({ error: 'Person not found.' }); return null; }
  return { elder, canEdit: true };
}

const shape = (u, canEdit) => ({ age: u.age ?? null, conditions: u.conditions || [], medicines: u.medicines || [], canEdit });

// GET /api/profile            (elder: own profile)
// GET /api/profile?elder=ID   (caregiver: a linked elder)
r.get('/', async (req, res) => {
  const found = await resolve(req, res);
  if (!found) return;
  res.json(shape(found.elder, found.canEdit));
});

// PUT /api/profile  { age, conditions, medicines, elder? }
r.put('/', async (req, res) => {
  const found = await resolve(req, res);
  if (!found) return;
  if (!found.canEdit) return res.status(403).json({ error: 'Your caregiver manages this. Ask them to change it.' });
  const age = Number(req.body?.age);
  found.elder.age = Number.isFinite(age) && age > 0 && age < 120 ? Math.round(age) : undefined;
  found.elder.conditions = toList(req.body?.conditions);
  found.elder.medicines = toList(req.body?.medicines);
  await found.elder.save();
  res.json(shape(found.elder, true));
});

export default r;