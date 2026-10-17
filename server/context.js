import { UserM, CheckInM, MealM } from './models.js';
import { lastNDates } from './util.js';

const list = (v) => (Array.isArray(v) ? v.join(', ') : v || '');

export async function buildContext(sessionUser) {
  const user = (await UserM.findById(sessionUser._id)) || sessionUser;
  const dates = lastNDates(7);
  const [checkins, meals] = await Promise.all([
    CheckInM.find({ elder: user._id, date: { $in: dates } }).sort({ date: 1 }),
    MealM.find({ elder: user._id, date: { $in: dates } }).sort({ createdAt: -1 }).limit(10)
  ]);

  const lines = [`Name: ${user.name}.`];
  if (user.age) lines.push(`Age: ${user.age}.`);
  if (list(user.conditions)) lines.push(`Conditions: ${list(user.conditions)}.`);
  if (list(user.medicines)) lines.push(`Medicines: ${list(user.medicines)}.`);

  const sleep = checkins.filter((c) => c.sleepHours != null).map((c) => `${c.date}: ${c.sleepHours}h`);
  if (sleep.length) lines.push(`Sleep, last 7 days: ${sleep.join(', ')}.`);

  const bp = checkins.filter((c) => c.bpSys != null).map((c) => `${c.date}: ${c.bpSys}/${c.bpDia}`);
  if (bp.length) lines.push(`Blood pressure: ${bp.join(', ')}.`);

  const symptoms = checkins.filter((c) => c.symptoms?.length).map((c) => `${c.date}: ${c.symptoms.join(', ')}`);
  if (symptoms.length) lines.push(`Warning signs reported: ${symptoms.join('; ')}.`);

  if (meals.length) lines.push(`Recent meals: ${meals.map((m) => `${m.name} (${m.kcal} kcal)`).join(', ')}.`);

  return lines.join('\n');
}