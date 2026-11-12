import { useEffect, useState } from 'react'

const cache = new Map()

/** Loads public/data/<name>.json once (the committed snapshot exported from the platform). */
export function load(name) {
  if (!cache.has(name)) {
    const url = `${import.meta.env.BASE_URL}data/${name}.json`
    cache.set(name, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`)
      return r.json()
    }))
  }
  return cache.get(name)
}

export function useData(...names) {
  const [state, setState] = useState({ data: null, error: null })
  const key = names.join(',')
  useEffect(() => {
    let alive = true
    Promise.all(names.map(load))
      .then((values) => alive && setState({ data: Object.fromEntries(names.map((n, i) => [n, values[i]])), error: null }))
      .catch((error) => alive && setState({ data: null, error }))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return state
}

/** Last observed daily index per station, and the forecast for the next day. */
export function stationSummaries({ stations, daily, forecast }) {
  const lastDay = daily.reduce((m, d) => (d.date > m ? d.date : m), '')
  const latest = new Map()
  for (const d of daily) {
    if (d.date === lastDay) latest.set(d.station, d)
  }
  const fc = new Map(forecast.forecasts.map((f) => [f.station_code, f]))
  return stations
    .filter((s) => s.is_reference && s.latitude != null)
    .map((s) => ({ ...s, today: latest.get(s.station_code) ?? null, tomorrow: fc.get(s.station_code) ?? null }))
}

export function countByLevel(items, pick) {
  const counts = new Map()
  for (const it of items) {
    const lv = pick(it)
    if (lv) counts.set(lv, (counts.get(lv) ?? 0) + 1)
  }
  return counts
}
