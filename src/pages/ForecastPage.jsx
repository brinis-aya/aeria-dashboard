import { Link } from 'react-router-dom'
import { useData, stationSummaries } from '../data.js'
import { formatDay, formatNumber, POLLUTANTS } from '../atmo.js'
import { IndexBadge, Loading, Tile } from '../components.jsx'

const pct = (v) => (v == null ? '—' : `${formatNumber(v * 100, 1)} %`)

export default function ForecastPage() {
  const { data, error } = useData('stations', 'daily', 'forecast', 'meta')
  if (!data) return <Loading error={error} />
  const items = stationSummaries(data).filter((s) => s.tomorrow?.atmo_index)
    .sort((a, b) => b.tomorrow.atmo_index - a.tomorrow.atmo_index || a.station_name.localeCompare(b.station_name))
  const f0 = data.forecast.forecasts[0]
  const bt = data.forecast.backtest ?? {}
  const idx = Object.fromEntries((bt.index ?? []).map((r) => [r.method, r]))
  const alerts = items.filter((s) => s.tomorrow.alert)

  return (
    <>
      <h1>Prévision pour le {formatDay(f0?.target_date)}</h1>
      <p className="muted">Émise à partir des mesures du {formatDay(f0?.issue_date)} et de la prévision météo Open-Meteo.</p>

      <div className="grid tiles">
        <Tile value={alerts.length} label="station(s) en alerte" hint="« Dégradé » ou pire attendu (marge d'alerte 0,95)" />
        <Tile value={pct(idx.model?.accuracy)} label="indice exact (backtest)" hint={`persistance « demain = aujourd'hui » : ${pct(idx.persistence?.accuracy)}`} />
        <Tile value={pct(idx.model?.within_1)} label="à un niveau près" hint={`${formatNumber(idx.model?.n)} jours-stations évalués, ${bt.test_period?.[0] ?? ''} → ${bt.test_period?.[1] ?? ''}`} />
      </div>

      <section className="card">
        <h2>Toutes les stations</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Station</th><th>Commune</th><th>Indice prévu</th><th>Concentrations prévues (µg/m³)</th></tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.station_code}>
                  <td><Link to={`/station/${s.station_code}`}>{s.station_name}</Link></td>
                  <td>{s.town}</td>
                  <td><IndexBadge index={s.tomorrow.atmo_index} size="sm" responsible={s.tomorrow.responsible} />
                    {s.tomorrow.alert ? <span className="flag">alerte</span> : null}</td>
                  <td className="small">
                    {Object.entries(s.tomorrow.concentrations).map(([p, v]) => `${POLLUTANTS[p].label} ${formatNumber(v)}`).join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Comment cette prévision est faite</h2>
        <p>
          Cinq modèles de <em>gradient boosting</em> (un par polluant) prévoient les concentrations du lendemain à
          partir des mesures des derniers jours, du niveau de la soirée, du fond régional et de la météo prévue
          (vent, soleil, humidité). L'indice est ensuite calculé avec la grille officielle. Le modèle bat la
          persistance tous les mois du test, surtout l'été (ozone) ; il n'apporte rien sur les particules.
          Détails : <a href="https://github.com/brinis-aya/aeria-forecast">module 3</a>.
        </p>
      </section>
    </>
  )
}
