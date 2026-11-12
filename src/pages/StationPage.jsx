import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData, stationSummaries } from '../data.js'
import { POLLUTANTS, LEVELS, level, subIndex, formatDay, formatShort, formatNumber, formatTime } from '../atmo.js'
import { IndexBadge, Loading, Tile } from '../components.jsx'

const GRID = 'var(--grid)'
const AXIS = { stroke: 'var(--ink-2)', fontSize: 12 }

function DailyChart({ rows, pollutant }) {
  const p = POLLUTANTS[pollutant]
  const points = rows.filter((r) => r[pollutant] != null).map((r) => ({ date: r.date, v: r[pollutant], lv: subIndex(pollutant, r[pollutant]) }))
  if (!points.length) return <p className="muted">Ce polluant n'est pas mesuré par cette station.</p>
  return (
    <figure className="chart">
      <figcaption>{p.long} : {p.agg} (µg/m³), couleur = sous-indice ATMO</figcaption>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }} barCategoryGap={1}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatShort} tick={AXIS} minTickGap={40} />
          <YAxis tick={AXIS} width={44} />
          {p.thresholds.slice(0, 3).map((t, i) => (
            <ReferenceLine key={t} y={t} stroke="var(--ink-2)" strokeDasharray="3 4"
                           label={{ value: `${LEVELS[i].label} ≤ ${t}`, position: 'insideTopRight', fill: 'var(--ink-2)', fontSize: 11 }} />
          ))}
          <Tooltip cursor={{ fill: 'var(--hover)' }}
                   formatter={(v, _n, item) => [`${formatNumber(v, 1)} µg/m³ · ${level(item.payload.lv).label}`, p.label]}
                   labelFormatter={formatDay} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)' }} />
          <Bar dataKey="v" radius={[3, 3, 0, 0]}>
            {points.map((pt) => <Cell key={pt.date} fill={level(pt.lv).color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  )
}

function HourlyChart({ hourly, code, pollutant }) {
  const series = hourly.series[code]?.[pollutant]
  const start = new Date(hourly.start).getTime()
  const points = useMemo(() => (series ?? []).map((v, i) => ({ t: new Date(start + i * 3600e3).toISOString(), v })), [series, start])
  if (!series) return null
  return (
    <figure className="chart">
      <figcaption>{POLLUTANTS[pollutant].long} : valeurs horaires des 14 derniers jours (µg/m³)</figcaption>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="t" tickFormatter={(t) => formatShort(t.slice(0, 10))} tick={AXIS} minTickGap={50} />
          <YAxis tick={AXIS} width={44} />
          <Tooltip formatter={(v) => [`${formatNumber(v, 1)} µg/m³`, POLLUTANTS[pollutant].label]} labelFormatter={formatTime}
                   contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)' }} />
          <Line dataKey="v" stroke="var(--accent)" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </figure>
  )
}

function Calendar({ rows }) {
  return (
    <div className="calendar" role="list" aria-label="Indice ATMO des derniers jours">
      {rows.map((r) => {
        const lv = level(r.idx)
        return <span key={r.date} role="listitem" className="cal-day" style={{ background: lv.color }}
                     title={`${formatDay(r.date)} : ${lv.label}`} aria-label={`${formatDay(r.date)} : ${lv.label}`} />
      })}
    </div>
  )
}

export default function StationPage() {
  const { code } = useParams()
  const { data, error } = useData('stations', 'daily', 'forecast', 'hourly', 'meta')
  const [pollutant, setPollutant] = useState(null)
  if (!data) return <Loading error={error} />
  const st = stationSummaries(data).find((s) => s.station_code === code)
  if (!st) return <p className="notice">Station inconnue. <Link to="/carte">Retour à la carte</Link></p>

  const rows = data.daily.filter((d) => d.station === code)
  const measured = Object.keys(POLLUTANTS).filter((p) => rows.some((r) => r[p] != null))
  const current = pollutant && measured.includes(pollutant) ? pollutant : (st.today?.resp ?? measured[0])
  const counts = LEVELS.map((l) => ({ ...l, n: rows.filter((r) => r.idx === l.level).length })).filter((l) => l.n)

  return (
    <>
      <p className="muted"><Link to="/carte">Carte</Link> / {st.station_name}</p>
      <h1>{st.station_name}</h1>
      <p className="muted">{st.town} · station {st.influence?.toLowerCase()} · {st.area_type?.toLowerCase()} · code {st.station_code}</p>

      <div className="grid tiles">
        <Tile value={<IndexBadge index={st.today?.idx} size="lg" />} label={`Observé le ${formatDay(st.today?.date ?? data.meta.last_day)}`}
              hint={st.today?.resp ? `Polluant responsable : ${POLLUTANTS[st.today.resp].label}` : null} />
        <Tile value={<IndexBadge index={st.tomorrow?.atmo_index} size="lg" />} label={`Prévu le ${formatDay(st.tomorrow?.target_date)}`}
              hint={st.tomorrow?.responsible ? `Polluant responsable : ${POLLUTANTS[st.tomorrow.responsible].label}${st.tomorrow.alert ? ' · alerte' : ''}` : null} />
        <Tile value={rows.length} label="jours avec un indice" hint={counts.map((c) => `${c.n} ${c.label.toLowerCase()}`).join(', ')} />
      </div>

      <section className="card">
        <h2>{rows.length} derniers jours</h2>
        <Calendar rows={rows} />
      </section>

      <section className="card">
        <div className="row-between">
          <h2>Concentrations</h2>
          <div className="segmented" role="radiogroup" aria-label="Polluant">
            {measured.map((p) => (
              <button key={p} role="radio" aria-checked={current === p} className={current === p ? 'on' : ''} onClick={() => setPollutant(p)}>
                {POLLUTANTS[p].label}
              </button>
            ))}
          </div>
        </div>
        <DailyChart rows={rows} pollutant={current} />
        <HourlyChart hourly={data.hourly} code={code} pollutant={current} />
      </section>
    </>
  )
}
