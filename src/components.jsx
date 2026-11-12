import { LEVELS, level, pollutantLabel } from './atmo.js'

/** ATMO level as a coloured pill with its label: colour never carries the meaning alone. */
export function IndexBadge({ index, size = 'md', responsible }) {
  const lv = level(index)
  return (
    <span className={`badge badge-${size}`} style={{ background: lv.color, color: lv.ink }}>
      {lv.level ? <b aria-hidden="true">{lv.level}</b> : null}
      <span>{lv.label}</span>
      {responsible ? <span className="badge-resp">· {pollutantLabel(responsible)}</span> : null}
    </span>
  )
}

export function Legend({ compact = false }) {
  return (
    <ul className={`legend ${compact ? 'legend-compact' : ''}`} aria-label="Échelle de l'indice ATMO">
      {LEVELS.map((l) => (
        <li key={l.level}>
          <span className="swatch" style={{ background: l.color }} aria-hidden="true" />
          {l.label}
        </li>
      ))}
    </ul>
  )
}

export function Tile({ value, label, hint }) {
  return (
    <div className="tile">
      <div className="tile-value">{value}</div>
      <div className="tile-label">{label}</div>
      {hint ? <div className="tile-hint">{hint}</div> : null}
    </div>
  )
}

export function Loading({ error }) {
  if (error) return <p className="notice error" role="alert">Données indisponibles : {String(error.message ?? error)}</p>
  return <p className="notice" aria-live="polite">Chargement des données…</p>
}
