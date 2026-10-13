import mongoose from 'mongoose';

// Vercel can reuse a function instance between requests. Keeping the connection on globalThis
// stops every request from opening a new connection, which would exhaust the free Atlas tier.
const cache = globalThis._careAideMongo || (globalThis._careAideMongo = { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set. Copy .env.example to .env and fill it in.');
  cache.promise ||= mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  cache.conn = await cache.promise;
  return cache.conn;
}
