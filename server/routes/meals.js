import { buildContext } from '../context.js';
import { Router } from 'express';
import { MealM } from '../models.js';
import { requireAuth, onlyRole, resolveElder } from '../auth.js';
const result = await analyzeMeal({ base64: imageBase64, mimeType, context: await buildContext(req.user) });
import { todayKL } from '../util.js';

const r = Router();
r.use(requireAuth);

// POST /api/meals/analyze  { imageBase64, mimeType }
// Resize photos in the browser first (about 1024px wide). Vercel rejects request bodies over roughly 4.5 MB.
r.post('/analyze', onlyRole('elder'), async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'Add a photo of your meal.' });
  if (imageBase64.length > 3_500_000) return res.status(413).json({ error: 'That photo is too big. Try a smaller one.' });
  const result = await analyzeMeal({ base64: imageBase64, mimeType });
  if (result.isFood === false) return res.status(422).json({ error: 'I could not see food in that photo. Try another one.' });
  const meal = await MealM.create({
    elder: req.user._id, date: todayKL(), source: 'photo',
    name: result.name, kcal: Math.round(Number(result.kcal) || 0), carbs: result.carbs, protein: result.protein, fat: result.fat, tip: result.tip
  });
  res.status(201).json({ meal });
});

// GET /api/meals?date=YYYY-MM-DD  (defaults to today)
r.get('/', resolveElder, async (req, res) => {
  const date = req.query.date || todayKL();
  const meals = await MealM.find({ elder: req.elderId, date }).sort({ createdAt: 1 });
  res.json({ meals, kcal: meals.reduce((sum, m) => sum + (m.kcal || 0), 0) });
});

export default r;
