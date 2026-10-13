import jwt from 'jsonwebtoken';
import { UserM } from './models.js';

export const signToken = (user) =>
  jwt.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Puts the signed-in user on req.user. Send the token as "Authorization: Bearer <token>".
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserM.findById(payload.id);
    if (!user) throw new Error('missing user');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Your session ended. Please sign in again.' });
  }
}

export const onlyRole = (role) => (req, res, next) =>
  req.user.role === role ? next() : res.status(403).json({ error: `Only ${role} accounts can do this.` });

// Works out whose data this request is about.
// Elders always see their own. Caregivers see the elder they are linked to (?elderId= picks one if there are several).
export function resolveElder(req, res, next) {
  if (req.user.role === 'elder') {
    req.elderId = req.user._id;
    return next();
  }
  const wanted = req.query.elderId || req.body?.elderId || req.user.elders[0];
  if (!wanted) return res.status(400).json({ error: 'Link an elderly account first.' });
  if (!req.user.elders.some((id) => String(id) === String(wanted))) {
    return res.status(403).json({ error: 'You are not linked to that person.' });
  }
  req.elderId = wanted;
  next();
}
