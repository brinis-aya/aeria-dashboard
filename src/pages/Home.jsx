import { Link } from 'react-router-dom'
import { useData, stationSummaries, countByLevel } from '../data.js'
import { LEVELS, formatDay } from '../atmo.js'
import { IndexBadge, Loading } from '../components.jsx'

const MODULES = [
  { n: 1, name: 'Capteurs IoT', text: 'Capteurs ESP32, MQTT, ingestion Spring Boot validée', repo: 'aeria-iot-sensors' },
  { n: 2, name: 'Pipeline de données', text: 'Open data LCSQA, nettoyage pandas, entrepôt en étoile', repo: 'aeria-data-pipeline' },
  { n: 3, name: 'Prévision 24 h', text: 'Indice ATMO de demain, scikit-learn et FastAPI', repo: 'aeria-forecast' },
  { n: 4, name: 'Back-office', text: 'Parc, techniciens, maintenance : Merise, SQL, BPMN', repo: 'aeria-backoffice' },
  { n: 5, name: 'Sécurité', text: 'EBIOS RM, audit, Wazuh, ISO 27001', repo: 'aeria-security' },
  { n: 6, name: 'Tableau de bord', text: 'Étude UX, carte, graphiques : ce site', repo: 'aeria-dashboard' },
]

function Distribution({ counts, total, title }) {
  return (
    <figure className="dist">
      <figcaption>{title}</figcaption>
      <div className="dist-bar" role="img"
           aria-label={LEVELS.filter((l) => counts.get(l.level)).map((l) => `${counts.get(l.level)} ${l.label}`).join(', ')}>
        {LEVELS.filter((l) => counts.get(l.level)).map((l) => (
          <span key={l.level} style={{ flexGrow: counts.get(l.level), background: l.color, color: l.ink }}
                title={`${l.label} : ${counts.get(l.level)} station(s)`}>
            {counts.get(l.level) / total >= 0.12 ? `${counts.get(l.level)} ${l.label}` : counts.get(l.level)}
          </span>
        ))}
      </div>
    </figure>
  )
}

export default function Home() {
  const { data, error } = useData('stations', 'daily', 'forecast', 'meta')
  if (!data) return <Loading error={error} />
  const items = stationSummaries(data)
  const withToday = items.filter((s) => s.today)
  const withTomorrow = items.filter((s) => s.tomorrow?.atmo_index)
  const today = countByLevel(withToday, (s) => s.today.idx)
  const tomorrow = countByLevel(withTomorrow, (s) => s.tomorrow.atmo_index)
  const worstTomorrow = [...withTomorrow].sort((a, b) => b.tomorrow.atmo_index - a.tomorrow.atmo_index)[0]
  const target = data.forecast.forecasts[0]?.target_date
  const modelAcc = data.forecast.backtest?.index?.find((r) => r.method === 'model')?.accuracy

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Qualité de l'air en Normandie</p>
        <h1>Respirer, ça se mesure.</h1>
        <p className="lead">
          Aeria rassemble les mesures officielles de {withToday.length} stations, un réseau de capteurs au Havre
          et une prévision de l'indice ATMO pour le lendemain, en données ouvertes.
        </p>
        <div className="actions">
          <Link className="btn primary" to="/carte">Voir la carte</Link>
          <Link className="btn" to="/prevision">Prévision de demain</Link>
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <h2>Observé le {formatDay(data.meta.last_day)}</h2>
          <Distribution counts={today} total={withToday.length} title={`Indice ATMO de ${withToday.length} stations`} />
        </div>
        <div className="card">
          <h2>Prévu pour le {formatDay(target)}</h2>
          <Distribution counts={tomorrow} total={withTomorrow.length} title={`Prévision de ${withTomorrow.length} stations`} />
          {worstTomorrow ? (
            <p className="muted">Indice le plus élevé : <Link to={`/station/${worstTomorrow.station_code}`}>{worstTomorrow.station_name}</Link>{' '}
              <IndexBadge index={worstTomorrow.tomorrow.atmo_index} size="sm" responsible={worstTomorrow.tomorrow.responsible} /></p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="section-title">Trois missions</h2>
        <div className="grid three">
          <div className="card mission"><h3>Mesurer</h3><p>36 stations de référence d'ATMO Normandie et 6 capteurs Aeria au Havre, heure par heure.</p></div>
          <div className="card mission"><h3>Informer</h3><p>L'indice du jour et celui de demain, avec le polluant responsable. Le modèle trouve le bon indice {modelAcc ? `${Math.round(modelAcc * 100)} %` : 'la plupart'} du temps.</p></div>
          <div className="card mission"><h3>Maintenir</h3><p>Un parc suivi par un back-office : pannes détectées automatiquement, interventions tracées, étalonnages planifiés.</p></div>
        </div>
      </section>

      <section>
        <h2 className="section-title">Sept modules, un projet</h2>
        <div className="grid three">
          {MODULES.map((m) => (
            <a key={m.n} className="card module" href={`https://github.com/brinis-aya/${m.repo}`}>
              <span className="module-n">Module {m.n}</span>
              <h3>{m.name}</h3>
              <p>{m.text}</p>
            </a>
          ))}
          <a className="card module" href="https://github.com/brinis-aya/aeria">
            <span className="module-n">Module 7</span>
            <h3>Vitrine</h3>
            <p>Architecture d'ensemble, intégration continue, vidéo de démonstration</p>
          </a>
        </div>
      </section>
    </>
  )
}
