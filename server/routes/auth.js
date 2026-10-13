import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { UserM } from '../models.js';
import { requireAuth, onlyRole, signToken } from '../auth.js';
import { publicUser } from '../util.js';

const r = Router();

const makeLinkCode = () => crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();

// POST /api/auth/register  { name, email, password, role: 'elder' | 'caregiver' }
r.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Please fill in your name, email and password.' });
  if (!['elder', 'caregiver'].includes(role)) return res.status(400).json({ error: 'Choose elder or caregiver.' });
  if (String(password).length < 6) return res.status(400).json({ error: 'Password needs at least 6 characters.' });
  if (await UserM.findOne({ email: String(email).toLowerCase() })) return res.status(409).json({ error: 'That email is already registered.' });
  const user = await UserM.create({
    name, email, role,
    passwordHash: await bcrypt.hash(password, 10),
    linkCode: role === 'elder' ? makeLinkCode() : undefined
  });
  res.status(201).json({ token: signToken(user), user: await publicUser(user) });
});

// POST /api/auth/login  { email, password }
r.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await UserM.findOne({ email: String(email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash))) {
    return res.status(401).json({ error: 'Email or password is wrong.' });
  }
  res.json({ token: signToken(user), user: await publicUser(user) });
});

// GET /api/auth/me
r.get('/me', requireAuth, async (req, res) => res.json({ user: await publicUser(req.user) }));

// POST /api/auth/link  { code }   (caregiver types the code shown on the elder's Me screen)
r.post('/link', requireAuth, onlyRole('caregiver'), async (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const elder = await UserM.findOne({ role: 'elder', linkCode: code });
  if (!elder) return res.status(404).json({ error: 'No one has that code. Check it with the person you care for.' });
  await UserM.updateOne({ _id: req.user._id }, { $addToSet: { elders: elder._id } });
  await UserM.updateOne({ _id: elder._id }, { $addToSet: { caregivers: req.user._id } });
  const fresh = await UserM.findById(req.user._id);
  res.json({ user: await publicUser(fresh) });
});

export default r;
