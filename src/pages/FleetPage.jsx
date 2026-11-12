import { useData } from '../data.js'
import { formatDay, formatNumber, formatTime } from '../atmo.js'
import { Loading, Tile } from '../components.jsx'

const STATUS = { en_service: 'En service', en_maintenance: 'En maintenance', en_stock: 'En stock', hors_service: 'Hors service', reforme: 'Réformé' }

export default function FleetPage() {
  const { data, error } = useData('fleet')
  if (!data) return <Loading error={error} />
  const { sensors, indicators: k } = data.fleet
  if (!sensors.length) return <p className="notice">Les données du parc ne sont pas incluses dans cet export.</p>
  const installed = sensors.filter((c) => c.site_nom)

  return (
    <>
      <h1>Parc de capteurs Aeria</h1>
      <p className="muted">Extrait du back-office de maintenance (module 4). Capteurs et historique simulés au Havre.</p>
      <div className="grid tiles">
        <Tile value={`${k.en_service} / ${installed.length}`} label="capteurs en service" hint={`${k.en_maintenance} en maintenance, ${k.en_stock} en stock`} />
        <Tile value={`${formatNumber(k.disponibilite, 2)} %`} label="disponibilité moyenne sur 365 jours" />
        <Tile value={k.tickets_actifs} label="tickets de maintenance actifs" hint={`${k.p1_actifs} urgent(s), ${k.hors_delai} hors délai`} />
        <Tile value={`${formatNumber(k.sla_30j, 1)} %`} label="incidents résolus dans les délais (30 j)" />
      </div>
      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Capteur</th><th>Site</th><th>Statut</th><th>Dernier message</th><th className="n">Disponibilité</th><th className="n">MTBF (j)</th><th>Prochain étalonnage</th></tr>
            </thead>
            <tbody>
              {installed.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.id}</b><br /><span className="muted small">{c.modele}</span></td>
                  <td>{c.site_nom}<br /><span className="muted small">{c.commune} · {c.environnement}</span></td>
                  <td><span className={`status status-${c.statut}`}>{STATUS[c.statut] ?? c.statut}</span>
                    {c.tickets_actifs ? <span className="muted small"> · {c.tickets_actifs} ticket(s)</span> : null}</td>
                  <td className="small">{formatTime(c.derniere_communication)}</td>
                  <td className="n">{c.disponibilite_pct != null ? `${formatNumber(c.disponibilite_pct, 2)} %` : '—'}</td>
                  <td className="n">{formatNumber(c.mtbf_jours, 0)}</td>
                  <td>{formatDay(c.prochain_etalonnage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
