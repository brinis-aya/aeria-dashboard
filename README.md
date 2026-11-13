# Aeria · Dashboard

[![CI and Pages](https://github.com/brinis-aya/aeria-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/brinis-aya/aeria-dashboard/actions/workflows/ci.yml)

Module 6 of **Aeria**, an open air-quality monitoring platform: a **UX case study** and a **React dashboard**
with a map, charts and the next-day forecast of the French ATMO air-quality index for Normandy. It also serves
as the project's presentation page.

**Live: <https://brinis-aya.github.io/aeria-dashboard/>**

> Other modules: [IoT sensors](https://github.com/brinis-aya/aeria-iot-sensors) ·
> [data pipeline](https://github.com/brinis-aya/aeria-data-pipeline) ·
> [24 h forecast](https://github.com/brinis-aya/aeria-forecast) ·
> [back-office](https://github.com/brinis-aya/aeria-backoffice) ·
> [security](https://github.com/brinis-aya/aeria-security) ·
> [overview](https://github.com/brinis-aya/aeria)

## Pages

| Page | What it answers |
|---|---|
| Home | the project in one screen, plus how many stations are good or degraded **today and tomorrow** |
| Map | every station coloured by its ATMO index (observed or forecast), the Aeria sensors, and a list sorted worst first |
| Station | today and tomorrow, a 120-day calendar strip, daily concentrations coloured by sub-index, last 14 days hourly |
| Forecast | tomorrow for every station with the responsible pollutant and alerts, plus the model's backtest accuracy |
| Aeria sensors | the sensor fleet from the maintenance back-office: status, availability, MTBF, next calibration |
| About | method, sources and licences, known limits, accessibility statement |

## UX case study

[`docs/etude-ux.md`](docs/etude-ux.md) (French): three personas, a problem statement ("the useful information is
tomorrow"), information architecture, low-fidelity wireframes ([`docs/wireframes`](docs/wireframes)), a
visual system built on the official ATMO colours, a Nielsen heuristic review with the fixes it led to, and a
usability-test protocol.

Design rules applied everywhere:

- tomorrow is as prominent as today;
- every index is written in words, never colour alone;
- one colour scale, the ATMO sub-index, used for every chart;
- approximations stated where the user meets them.

## How it works

The site is static: [`scripts/export_data.py`](scripts/export_data.py) exports a JSON snapshot from the other
modules into `public/data/`, and the React app reads it.

| Source | Data |
|---|---|
| Warehouse (module 2) | stations, 120 days of daily index, 14 days of hourly values |
| Forecast API (module 3) | tomorrow's index and the backtest metrics |
| Back-office API (module 4) | the sensor fleet |

Station coordinates are not published with the open data, so each station is placed at the centre of its
town, geocoded with api-adresse.data.gouv.fr. The map says so.

Stack: React 18, React Router, react-leaflet (OpenStreetMap tiles), Recharts, Vite.

## Run

Nothing to install to look at it: open the live site above. To run it locally (Node.js 18+, CI uses 22):

```bash
npm install
npm run dev                         # http://localhost:5173  (data are committed, no backend needed)
npm test                            # 15 unit tests (scale, data shaping, components, colour contrast)
python scripts/export_data.py       # refresh public/data from a running Aeria platform
```

CI runs the unit tests, builds the site, checks every page with **axe-core** (WCAG 2.1 AA) in Chromium, then
deploys to GitHub Pages.

## Report

French report: [`docs/rapport.md`](docs/rapport.md).

## License

MIT. Data: LCSQA / Geod'air (Licence Ouverte 2.0), Open-Meteo (CC BY 4.0), map © OpenStreetMap contributors.
