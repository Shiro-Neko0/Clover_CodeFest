// Local development only. On Vercel, api/index.js runs the app instead.
import app from './app.js';

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Care Aide API on http://localhost:${port}`));
