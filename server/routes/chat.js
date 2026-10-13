import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { chatTurn, RED_FLAGS } from '../ai.js';

const r = Router();
r.use(requireAuth);

// POST /api/chat  { messages: [{ from: 'bot' | 'user', text }] }
r.post('/', async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-12) : [];
  const last = messages[messages.length - 1];
  if (!last || last.from !== 'user' || !last.text) return res.status(400).json({ error: 'Send your question.' });
  // Emergency words skip the AI completely, so the answer is always the safe one.
  if (RED_FLAGS.test(last.text)) {
    return res.json({ sos: true, reply: 'This may be an emergency. Please call 999 now. If you can, press SOS so your caregiver knows.' });
  }
  res.json({ reply: await chatTurn(messages) });
});

export default r;
