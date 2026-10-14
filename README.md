# Rakan Sihat

A health buddy app for older people, with a separate caregiver account.
Stack: **React (Vite)**, **Node.js + Express**, **MongoDB Atlas**, **Claude API**, deployed on **Vercel**, tested with **Postman**.

## What works now

| Area | Status |
|---|---|
| Sign up and sign in (elder or caregiver), caregiver linking by code | Built |
| Health: AI check-in chat (type or mic) saving sleep, meals, blood pressure, warning signs | Built |
| Health: meal photo to calories, dashboard tiles, 7-day sleep chart | Built |
| Medicine: today's doses, record a video to mark as taken, video log | Built (needs Cloudinary for video) |
| Caregiver: overview, dose videos with notes, alerts | Built, first draft |
| Ask clover chatbot and SOS button | Built |
| Appointments | Built as a list and form. TODO: month grid from the prototype |
| Video feed | Layout only. TODO: add real video links in `src/data/videos.js` |
| Reminders and push notifications | **Not built** |
| Settings (sound, language) | **Not built** |

## Setup, step by step (about 20 minutes)

You need Node.js 20.6 or newer.

1. **Install:** `npm install`
2. **MongoDB Atlas:** make a free cluster, create a database user, and under Network Access allow `0.0.0.0/0` (needed for Vercel). Copy the connection string.
3. **Claude key:** create a free key at https://aistudio.google.com and copy it.
4. **Cloudinary (for videos):** make a free account. Settings > Upload > add an **unsigned** upload preset. Note the cloud name and preset name.
5. **Environment:** copy `.env.example` to `.env` and fill in every value. Pick any long random string for `JWT_SECRET`.
6. **Run:** `npm run dev`. Open http://localhost:5173. The API runs on port 4000.

Test on your phone while developing: connect to the same Wi-Fi and open `http://YOUR-COMPUTER-IP:5173`. Camera and microphone access can need HTTPS, so test those on the Vercel link.

## Try it (demo flow)

1. Register an **elder** account and note the link code on the Me tab.
2. In a private window, register a **caregiver** account and enter that code on the Profile tab.
3. As the elder: add a medicine, chat on the Health tab, add a meal photo, record a dose video.
4. As the caregiver: watch the overview update, open Dose videos, leave a note.

## Deploy to Vercel

1. Push this folder to GitHub and import it in Vercel. The framework is detected as Vite.
2. Add all the variables from `.env.example` under Project Settings > Environment Variables.
3. Deploy. `vercel.json` sends `/api/*` to `api/index.js`, which runs the Express app.
4. Check `https://YOUR-APP.vercel.app/api/health`. If it returns `{ "ok": true }`, the API is running.

## Test with Postman

Import `postman/care-clover.postman_collection.json`. Run **Login elder** or **Register elder** first. It saves the token for the other requests.

## Folder map (who edits what)

```
api/index.js            Vercel entry point (do not edit)
server/
  app.js                Express setup, route list
  models.js             MongoDB collections
  ai.js                 All Claude prompts and calls (AI person edits here)
  auth.js               Login token check, roles, caregiver access
  routes/               One file per feature
src/
  App.jsx               Navigation and role switch
  pages/                One file per screen
  components/           Shared pieces (tiles, dose video card, sheets)
  api.js                Calls to the server, photo resize, video upload
  styles.css            All styling (from the prototype)
postman/                API test collection
```

## Known limits and things to decide

- **Medical safety:** clover gives general information only. Emergency words are caught by a keyword list in `server/ai.js` before the AI answers. Have a health professional review the wording and the example thresholds in `src/components/Tiles.jsx` before you present them as real.
- **Claude free tier** has low rate limits. If many people test at once during the demo, expect "AI helper is busy" messages. Check the model name in AI Studio if calls start failing.
- **Videos** are uploaded straight to Cloudinary. Do not send them through the API (Vercel limits bodies to about 4.5 MB).
- **Reminders:** a web app cannot reliably alarm in the background, especially on iPhone. Decide whether to show an in-app "due now" banner (easy), use web push (medium), or send messages another way.
- **Privacy:** this stores health data and videos. Add a consent line and mention how data is protected in your pitch.
- Passwords are hashed and logins use a 30-day token. For a real launch you would add rate limiting and email verification.
