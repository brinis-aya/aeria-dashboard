import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useData, stationSummaries } from '../data.js'
import { level, formatDay, pollutantLabel } from '../atmo.js'
import { IndexBadge, Legend, Loading } from '../components.jsx'

const VIEWS = { today: 'Observé', tomorrow: 'Prévu demain' }

export default function MapPage() {
  const { data, error } = useData('stations', 'daily', 'forecast', 'meta', 'fleet')
  const [view, setView] = useState('today')
  const [showSensors, setShowSensors] = useState(true)
  const navigate = useNavigate()

  const items = useMemo(() => (data ? stationSummaries(data) : []), [data])
  if (!data) return <Loading error={error} />

  const indexOf = (s) => (view === 'today' ? s.today?.idx : s.tomorrow?.atmo_index) ?? null
  const respOf = (s) => (view === 'today' ? s.today?.resp : s.tomorrow?.responsible)
  const sorted = [...items].filter((s) => indexOf(s)).sort((a, b) => indexOf(b) - indexOf(a) || a.station_name.localeCompare(b.station_name))
  const sensors = (data.fleet.sensors ?? []).filter((c) => c.latitude && c.statut !== 'reforme')
  const day = view === 'today' ? data.meta.last_day : data.forecast.forecasts[0]?.target_date

  return (
    <div className="map-layout">
      <section className="map-panel">
        <div className="panel-head">
          <h1>Carte de l'indice ATMO</h1>
          <p className="muted">{VIEWS[view]} · {formatDay(day)}</p>
          <div className="segmented" role="radiogroup" aria-label="Période affichée">
            {Object.entries(VIEWS).map(([k, label]) => (
              <button key={k} role="radio" aria-checked={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>
                {label}
              </button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" checked={showSensors} onChange={(e) => setShowSensors(e.target.checked)} />
            Capteurs Aeria (Le Havre, simulés)
          </label>
          <Legend compact />
        </div>
        <ol className="station-list">
          {sorted.map((s) => (
            <li key={s.station_code}>
              <Link to={`/station/${s.station_code}`}>
                <span className="station-name">{s.station_name}</span>
                <span className="muted small">{s.town} · {s.influence}</span>
              </Link>
              <IndexBadge index={indexOf(s)} size="sm" responsible={respOf(s)} />
            </li>
          ))}
        </ol>
        <p className="muted small">Positions indicatives : centre de la commune de chaque station (les données ouvertes du LCSQA ne publient pas de coordonnées).</p>
      </section>

      <div className="map-wrap">
        <MapContainer center={[49.3, 0.6]} zoom={8} scrollWheelZoom className="map" aria-label="Carte des stations">
          <TileLayer attribution='&copy; contributeurs <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                     url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {items.map((s) => {
            const idx = indexOf(s)
            const lv = level(idx)
            return (
              <CircleMarker key={s.station_code} center={[s.latitude, s.longitude]} radius={idx ? 9 : 6}
                            pathOptions={{ color: '#1f2328', weight: 1.5, fillColor: lv.color, fillOpacity: idx ? 0.95 : 0.5 }}
                            eventHandlers={{ click: () => navigate(`/station/${s.station_code}`) }}>
                <Tooltip>
                  <strong>{s.station_name}</strong><br />
                  {lv.label}{respOf(s) ? ` · ${pollutantLabel(respOf(s))}` : ''}
                </Tooltip>
              </CircleMarker>
            )
          })}
          {showSensors && sensors.map((c) => (
            <CircleMarker key={c.id} center={[c.latitude, c.longitude]} radius={5}
                          pathOptions={{ color: '#2a78d6', weight: 2, fillColor: '#ffffff', fillOpacity: 1 }}>
              <Tooltip>
                <strong>Capteur {c.id}</strong> · {c.site_nom}<br />
                {c.statut === 'en_service' ? 'en service' : c.statut.replace('_', ' ')}
                {c.disponibilite_pct != null ? ` · disponibilité ${c.disponibilite_pct} %` : ''}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
