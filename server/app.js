import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import auth from './routes/auth.js';
import checkins from './routes/checkins.js';
import meals from './routes/meals.js';
import meds from './routes/meds.js';
import appointments from './routes/appointments.js';
import overview from './routes/overview.js';
import chat from './routes/chat.js';
import profile from './routes/profile.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '4mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Every other /api route needs the database. connectDB() reuses one connection, so this is cheap.
app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/auth', auth);
app.use('/api/checkins', checkins);
app.use('/api/meals', meals);
app.use('/api/meds', meds);
app.use('/api/appointments', appointments);
app.use('/api/chat', chat);
app.use('/api/profile', profile);
app.use('/api', overview); // /api/alerts and /api/overview

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Express 5 sends errors from async handlers here. Keep the message friendly and log the details.
app.use((err, req, res, next) => {
  console.error(err);
  const aiProblem = /CLAUDE|GEMINI|503|UNAVAILABLE|429|quota|RESOURCE_EXHAUSTED|fetch failed/i.test(String(err?.message));
  res.status(500).json({
    error: aiProblem ? 'The AI helper is busy right now. Please try again in a minute.' : 'Something went wrong on our side. Please try again.'
  });
});

export default app;