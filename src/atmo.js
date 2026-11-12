// French ATMO index (arrêté du 10 juillet 2020) - same scale as modules 2 and 3.

export const LEVELS = [
  { level: 1, label: 'Bon', color: '#50F0E6', ink: '#0b2e2c' },
  { level: 2, label: 'Moyen', color: '#50CCAA', ink: '#0b2e24' },
  { level: 3, label: 'Dégradé', color: '#F0E641', ink: '#2e2a05' },
  { level: 4, label: 'Mauvais', color: '#FF5050', ink: '#330a0a' },
  { level: 5, label: 'Très mauvais', color: '#960032', ink: '#ffffff' },
  { level: 6, label: 'Extrêmement mauvais', color: '#872181', ink: '#ffffff' },
]

export const POLLUTANTS = {
  pm25: { label: 'PM2.5', long: 'Particules fines PM2.5', agg: 'moyenne journalière', thresholds: [10, 20, 25, 50, 75] },
  pm10: { label: 'PM10', long: 'Particules PM10', agg: 'moyenne journalière', thresholds: [20, 40, 50, 100, 150] },
  no2: { label: 'NO₂', long: "Dioxyde d'azote", agg: 'maximum horaire', thresholds: [40, 90, 120, 230, 340] },
  o3: { label: 'O₃', long: 'Ozone', agg: 'maximum horaire', thresholds: [50, 100, 130, 240, 380] },
  so2: { label: 'SO₂', long: 'Dioxyde de soufre', agg: 'maximum horaire', thresholds: [100, 200, 350, 500, 750] },
}

export const NO_DATA = { level: 0, label: 'Pas de donnée', color: '#c9ced6', ink: '#1f2328' }

export function level(index) {
  return LEVELS.find((l) => l.level === index) ?? NO_DATA
}

/** Sub-index of a concentration: values are rounded to the unit, first threshold not exceeded. */
export function subIndex(pollutant, value) {
  if (value == null || Number.isNaN(value)) return null
  const v = Math.round(value)
  const i = POLLUTANTS[pollutant].thresholds.findIndex((t) => v <= t)
  return i === -1 ? 6 : i + 1
}

export function pollutantLabel(code) {
  return POLLUTANTS[code]?.label ?? code ?? '—'
}

const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

export const formatDay = (iso) => (iso ? dayFmt.format(new Date(`${iso}T12:00:00`)) : '—')
export const formatShort = (iso) => (iso ? shortFmt.format(new Date(`${iso}T12:00:00`)) : '—')
export const formatTime = (iso) => (iso ? timeFmt.format(new Date(iso)) : '—')
export const formatNumber = (v, digits = 0) =>
  v == null ? '—' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(v)
