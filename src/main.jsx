import React, { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import { Loading } from './components.jsx'
import './styles.css'

// The map (Leaflet) and the charts (Recharts) are loaded only when their page is opened:
// the home page stays light on a phone.
const MapPage = lazy(() => import('./pages/MapPage.jsx'))
const StationPage = lazy(() => import('./pages/StationPage.jsx'))
const ForecastPage = lazy(() => import('./pages/ForecastPage.jsx'))
const FleetPage = lazy(() => import('./pages/FleetPage.jsx'))
const About = lazy(() => import('./pages/About.jsx'))

const NAV = [
  ['/', 'Accueil'], ['/carte', 'Carte'], ['/prevision', 'Prévision'], ['/parc', 'Capteurs Aeria'], ['/a-propos', 'À propos'],
]

function App() {
  return (
    <>
      <a className="skip" href="#contenu">Aller au contenu</a>
      <header className="top">
        <div className="bar">
          <NavLink to="/" className="brand" aria-label="Aeria, accueil">
            <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="var(--accent)" /><path d="M7 21c4-8 14-8 18 0M10 16c3-4 9-4 12 0" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" /><circle cx="16" cy="22" r="2.5" fill="#fff" /></svg>
            Aeria
          </NavLink>
          <nav aria-label="Navigation principale">
            {NAV.map(([to, label]) => <NavLink key={to} to={to} end>{label}</NavLink>)}
          </nav>
        </div>
      </header>
      <main id="contenu">
        <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/carte" element={<MapPage />} />
          <Route path="/station/:code" element={<StationPage />} />
          <Route path="/prevision" element={<ForecastPage />} />
          <Route path="/parc" element={<FleetPage />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="*" element={<p className="notice">Page introuvable.</p>} />
        </Routes>
        </Suspense>
      </main>
      <footer className="foot">
        Données : LCSQA / Geod'air (Licence Ouverte), Open-Meteo, © OpenStreetMap. Projet étudiant Aeria —{' '}
        <a href="https://github.com/brinis-aya/aeria">code source</a>.
      </footer>
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter><App /></HashRouter>
  </React.StrictMode>,
)
