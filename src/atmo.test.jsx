import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { level, subIndex, LEVELS } from './atmo.js'
import { stationSummaries, countByLevel } from './data.js'
import { IndexBadge, Legend } from './components.jsx'

describe('ATMO scale (same thresholds as modules 2 and 3)', () => {
  it.each([
    ['pm25', 10, 1], ['pm25', 10.4, 1], ['pm25', 10.6, 2], ['pm25', 25, 3], ['pm25', 76, 6],
    ['pm10', 41, 3], ['no2', 90, 2], ['o3', 131, 4], ['so2', 751, 6],
  ])('%s %s µg/m³ -> level %s', (p, v, expected) => {
    expect(subIndex(p, v)).toBe(expected)
  })

  it('keeps missing values missing', () => {
    expect(subIndex('o3', null)).toBeNull()
    expect(level(null).label).toBe('Pas de donnée')
  })

  it('has six levels with readable ink on every colour', () => {
    const luminance = (hex) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    }
    const contrast = (a, b) => {
      const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
      return (l1 + 0.05) / (l2 + 0.05)
    }
    expect(LEVELS).toHaveLength(6)
    for (const l of LEVELS) expect(contrast(l.color, l.ink)).toBeGreaterThanOrEqual(4.5) // WCAG AA, normal text
  })
})

describe('data shaping', () => {
  const stations = [
    { station_code: 'A', station_name: 'Alpha', is_reference: true, latitude: 49, longitude: 0 },
    { station_code: 'B', station_name: 'Beta', is_reference: true, latitude: 49.1, longitude: 0.1 },
    { station_code: 'LH-001', station_name: 'Capteur', is_reference: false, latitude: 49.5, longitude: 0.1 },
  ]
  const daily = [
    { date: '2026-11-10', station: 'A', idx: 1 }, { date: '2026-11-11', station: 'A', idx: 3 },
    { date: '2026-11-11', station: 'B', idx: 2 },
  ]
  const forecast = { forecasts: [{ station_code: 'A', atmo_index: 2, target_date: '2026-11-12' }] }

  it('takes the last observed day and the forecast of each reference station', () => {
    const s = stationSummaries({ stations, daily, forecast })
    expect(s.map((x) => x.station_code)).toEqual(['A', 'B'])
    expect(s[0].today.idx).toBe(3)
    expect(s[0].tomorrow.atmo_index).toBe(2)
    expect(s[1].tomorrow).toBeNull()
  })

  it('counts stations per level', () => {
    const counts = countByLevel(stationSummaries({ stations, daily, forecast }), (x) => x.today?.idx)
    expect(counts.get(3)).toBe(1)
    expect(counts.get(2)).toBe(1)
  })
})

describe('components', () => {
  it('writes the level in words, not only in colour', () => {
    render(<IndexBadge index={3} responsible="o3" />)
    expect(screen.getByText('Dégradé')).toBeInTheDocument()
    expect(screen.getByText(/O₃/)).toBeInTheDocument()
  })

  it('shows the whole scale in the legend', () => {
    render(<Legend />)
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
  })
})
