// One place that talks to the Express API. Every page uses api('/path', { method, body }).
const read = () => { try { return localStorage.getItem('token'); } catch { return null; } };
let token = read();

export function setToken(t) {
  token = t;
  try { t ? localStorage.setItem('token', t) : localStorage.removeItem('token'); } catch { /* private mode */ }
}
export const hasToken = () => !!token;

export async function api(path, { method = 'GET', body } = {}, retries = 1) {
  try {
    const res = await fetch('/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) setToken(null);
      throw new Error(data.error || 'Something went wrong. Please try again.');
    }
    return data;
  } catch (err) {
    // If a proxy ECONNRESET or socket drop happens, wait 300ms and retry once automatically
    if (retries > 0 && (err.name === 'TypeError' || err.message.includes('fetch'))) {
      await new Promise((r) => setTimeout(r, 300));
      return api(path, { method, body }, retries - 1);
    }
    throw err;
  }
}

// Videos go straight from the phone to Cloudinary (unsigned upload), so they never pass through Vercel's 4.5 MB limit.
// Setup: see README, "Cloudinary".
export async function uploadMedia(file, kind = 'video') {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
  const preset = import.meta.env.VITE_CLOUDINARY_PRESET;
  if (!cloud || !preset) throw new Error('Video upload is not set up yet. Add the Cloudinary values to .env (see README).');
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${kind}/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('The upload failed. Check your connection and try again.');
  return (await res.json()).secure_url;
}

// Shrinks a photo to about 1024px so it fits in one request, and returns it as base64 for the AI.
export function photoToBase64(file, maxSide = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve({ imageBase64: canvas.toDataURL('image/jpeg', 0.8).split(',')[1], mimeType: 'image/jpeg' });
    };
    img.onerror = () => reject(new Error('I could not open that photo.'));
    img.src = URL.createObjectURL(file);
  });
}