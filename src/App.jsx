import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Icon from './components/Icon.jsx';
import { SosSheet, AskSheet } from './components/Sheets.jsx';
import Login from './pages/Login.jsx';
import Videos from './pages/Videos.jsx';
import Appointments from './pages/Appointments.jsx';
import Health from './pages/Health.jsx';
import Meds from './pages/Meds.jsx';
import Me from './pages/Me.jsx';
import CaregiverHome from './pages/CaregiverHome.jsx';
import CaregiverDoses from './pages/CaregiverDoses.jsx';

const ELDER_TABS = [['/videos', 'Videos', 'video'], ['/calendar', 'Calendar', 'cal'], ['/health', 'Health', 'pulse'], ['/medicine', 'Medicine', 'pill'], ['/me', 'Me', 'user']];
const CARE_TABS = [['/home', 'Overview', 'pulse'], ['/doses', 'Dose videos', 'video'], ['/me', 'Profile', 'user']];

function Shell() {
  const { user } = useAuth();
  const [sheet, setSheet] = useState(null);
  const elder = user.role === 'elder';
  const tabs = elder ? ELDER_TABS : CARE_TABS;
  let scale = 1;
  try { scale = Number(localStorage.getItem('scale') || 1); } catch { /* private mode */ }

  return (
    <div className="phone" style={{ '--scale': scale }}>
      <header className="bar">
        <div className="brand"><img src="/logo-cakna.svg" alt ="" width="50" height="80" />{!elder && <span className="rolechip">Caregiver</span>}</div>
        {elder && (
          <div className="barbtns">
            <button className="pillbtn ask" onClick={() => setSheet('ask')}><Icon name="chat" size={20} /> Ask</button>
            <button className="pillbtn sos" onClick={() => setSheet('sos')}><Icon name="sos" size={20} /> SOS</button>
          </div>
        )}
      </header>
      <Outlet />
      <nav className={`nav${elder ? '' : ' n3'}`} aria-label="Main">
        {tabs.map(([to, label, icon]) => (
          <NavLink key={to} to={to}><Icon name={icon} size={24} />{label}</NavLink>
        ))}
      </nav>
      {sheet === 'sos' && <SosSheet onClose={() => setSheet(null)} />}
      {sheet === 'ask' && <AskSheet name={user.name} onClose={() => setSheet(null)} />}
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Loading…</div>;
  if (!user) return <Login />;
  const elder = user.role === 'elder';
  return (
    <Routes>
      <Route element={<Shell />}>
        {elder ? (
          <>
            <Route path="/videos" element={<Videos />} />
            <Route path="/calendar" element={<Appointments />} />
            <Route path="/health" element={<Health />} />
            <Route path="/medicine" element={<Meds />} />
            <Route path="/me" element={<Me />} />
            <Route path="*" element={<Navigate to="/videos" replace />} />
          </>
        ) : (
          <>
            <Route path="/home" element={<CaregiverHome />} />
            <Route path="/doses" element={<CaregiverDoses />} />
            <Route path="/me" element={<Me />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </>
        )}
      </Route>
    </Routes>
  );
}
