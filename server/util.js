// Dates are stored as plain YYYY-MM-DD strings in Malaysia time, so "today" means today for the user.
const TZ = 'Asia/Kuala_Lumpur';

export const todayKL = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });

export function nowMinutesKL() {
  const [h, m] = new Date().toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).split(':').map(Number);
  return h * 60 + m;
}

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
};

export function lastNDates(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(Date.now() - i * 86400000).toLocaleDateString('en-CA', { timeZone: TZ }));
  }
  return out;
}

export const publicUser = async (user) => {
  await user.populate([{ path: 'elders', select: 'name' }, { path: 'caregivers', select: 'name' }]);
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    linkCode: user.role === 'elder' ? user.linkCode : undefined,
    elders: user.elders.map((e) => ({ id: e._id, name: e.name })),
    caregivers: user.caregivers.map((c) => ({ id: c._id, name: c.name }))
  };
};
