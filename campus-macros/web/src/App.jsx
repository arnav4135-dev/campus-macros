import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Auth from './pages/Auth';
import ProfileSetup from './pages/ProfileSetup';
import Today from './pages/Today';
import Menu from './pages/Menu';
import Recommend from './pages/Recommend';
import Search from './pages/Search';
import Photo from './pages/Photo';
import Settings from './pages/Settings';

const TABS = [['/', '◉', 'Today'], ['/menu', '▤', 'Menu'], ['/search', '⌕', 'Search'], ['/snap', '◎', 'Snap'], ['/you', '◍', 'You']];

function Shell() {
  const { ready, user, needsProfile, profileDone } = useAuth();
  if (!ready) return <div className="page center small">Loading…</div>;
  if (!user) return <Auth />;
  if (needsProfile) return <ProfileSetup onDone={profileDone} />;
  return (<>
    <Routes>
      <Route path="/" element={<Today />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/recommend" element={<Recommend />} />
      <Route path="/search" element={<Search />} />
      <Route path="/snap" element={<Photo />} />
      <Route path="/you" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <nav className="tabbar"><div className="tabbar-inner">
      {TABS.map(([to, g, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}><span className="glyph" aria-hidden>{g}</span>{l}</NavLink>)}
    </div></nav>
  </>);
}

export default function App() {
  return <BrowserRouter><AuthProvider><div className="shell"><Shell /></div></AuthProvider></BrowserRouter>;
}
