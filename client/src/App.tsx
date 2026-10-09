import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { StudioPage } from './pages/StudioPage';
import { RemotePage } from './pages/RemotePage';
import { OverlayPage } from './pages/OverlayPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { SponsorsPage } from './pages/SponsorsPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/remote" element={<RemotePage />} />
        <Route path="/overlay" element={<OverlayPage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
