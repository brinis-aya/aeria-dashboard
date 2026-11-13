"""Export the data shown by the dashboard (public/data/*.json).

    python scripts/export_data.py --dw postgresql://aeria:aeria@127.0.0.1:5440/aeria \
        --forecast http://127.0.0.1:8083 --backoffice http://127.0.0.1:8084

Sources: the warehouse (module 2), the forecast API (module 3), the back-office API (module 4).
The JSON snapshot is committed, so the dashboard works as a static site (GitHub Pages) without any backend.

Station coordinates: the LCSQA open data has no coordinates, so each station is placed at the centre of its
town (geocoded once with the national geocoder, see towns.json), slightly spread when several stations share a town. The
dashboard says so: positions are indicative.
"""
from __future__ import annotations

import argparse
import json
import math
import os
from datetime import datetime, timezone
from pathlib import Path

import psycopg
import requests

OUT = Path(__file__).resolve().parents[1] / "public" / "data"

# station -> town (from the station names published by ATMO Normandie)
TOWNS = {
    "FR05037": "Le Havre", "FR05074": "Le Havre", "FR05089": "Le Havre", "FR05090": "Le Havre",
    "FR05083": "Gonfreville-l'Orcher", "FR05084": "Port-Jérôme-sur-Seine", "FR05085": "Lillebonne",
    "FR05080": "Rogerville", "FR05081": "La Cerlangue", "FR05069": "Tancarville", "FR05070": "Harfleur",
    "FR05056": "Quillebeuf-sur-Seine", "FR05040": "Honfleur", "FR05082": "Touques", "FR05087": "Arelaune-en-Seine",
    "FR21001": "Caen", "FR21042": "Caen", "FR21019": "Ifs", "FR21041": "Ouistreham", "FR21031": "Alençon",
    "FR21038": "Cherbourg-en-Cotentin", "FR21039": "Cherbourg-en-Cotentin", "FR21040": "Saint-Lô",
    "FR21050": "La Coulonche", "FR25036": "Rouen", "FR25043": "Rouen", "FR25053": "Rouen",
    "FR25035": "Grand-Couronne", "FR25040": "Le Mesnil-Esnard", "FR25048": "Le Petit-Quevilly",
    "FR25054": "Le Petit-Quevilly", "FR25039": "Évreux", "FR25049": "Poses", "FR25050": "Bures-en-Bray",
    "FR25051": "Dieppe", "FR25055": "Dieppe",
}


TOWNS_FILE = Path(__file__).with_name("towns.json")  # town centres, geocoded once and committed


def load_towns() -> dict:
    if TOWNS_FILE.exists():
        return {t: tuple(c) for t, c in json.loads(TOWNS_FILE.read_text(encoding="utf-8")).items()}
    return {}


def geocode(town: str, cache: dict) -> tuple[float, float]:
    """Town centre: from towns.json, else the national geocoder (Géoplateforme, ex api-adresse)."""
    if town not in cache:
        r = requests.get("https://data.geopf.fr/geocodage/search",
                         params={"q": town, "type": "municipality", "limit": 1}, timeout=30)
        r.raise_for_status()
        lon, lat = r.json()["features"][0]["geometry"]["coordinates"]
        cache[town] = (round(lat, 5), round(lon, 5))
    return cache[town]


def query(conn, sql: str, *params) -> list[dict]:
    cur = conn.execute(sql, params)
    cols = [c.name for c in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def jsonable(v):
    if isinstance(v, datetime):
        return v.astimezone(timezone.utc).isoformat(timespec="minutes")
    if hasattr(v, "isoformat"):
        return v.isoformat()
    if v is not None and type(v).__name__ == "Decimal":
        return float(v)
    return v


def write(name: str, data) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":"), default=jsonable), encoding="utf-8")
    print(f"{name}: {path.stat().st_size / 1024:.0f} KB")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--dw", default=os.getenv("DW_URL", "postgresql://aeria:aeria@127.0.0.1:5440/aeria"))
    p.add_argument("--forecast", default="http://127.0.0.1:8083")
    p.add_argument("--backoffice", default="http://127.0.0.1:8084")
    p.add_argument("--backoffice-user", default=os.getenv("BO_USER", "responsable"))
    p.add_argument("--backoffice-password", default=os.getenv("BO_PASSWORD"))
    p.add_argument("--days", type=int, default=120)
    a = p.parse_args()

    with psycopg.connect(a.dw) as conn:
        last = query(conn, "SELECT max(d.date_local) AS d FROM dw.fact_daily_index f JOIN dw.dim_date d USING (date_key)")[0]["d"]
        stations = query(conn, """
            SELECT s.station_code, s.station_name, s.zone, s.area_type, s.influence, s.is_reference,
                   s.latitude, s.longitude
            FROM dw.dim_station s ORDER BY s.is_reference DESC, s.station_code""")
        daily = query(conn, """
            SELECT d.date_local AS date, s.station_code AS station, f.atmo_index AS idx, p.code AS resp,
                   f.n_pollutants AS n, f.pm25_conc AS pm25, f.pm10_conc AS pm10, f.no2_conc AS no2,
                   f.o3_conc AS o3, f.so2_conc AS so2
            FROM dw.fact_daily_index f JOIN dw.dim_date d USING (date_key)
            JOIN dw.dim_station s USING (station_key) LEFT JOIN dw.dim_pollutant p ON p.pollutant_key = f.responsible_pollutant_key
            WHERE d.date_local > %s::date - %s ORDER BY d.date_local, s.station_code""", last, a.days)
        hourly_rows = query(conn, """
            SELECT station_code, pollutant, ts_utc, value FROM dw.v_measurement
            WHERE usable AND ts_utc >= (SELECT max(ts_utc) FROM dw.v_measurement WHERE is_reference) - interval '14 days'
            ORDER BY station_code, pollutant, ts_utc""")

    cache: dict = load_towns()
    by_town: dict[str, int] = {}
    for s in stations:
        if s["is_reference"]:
            town = TOWNS.get(s["station_code"], "Rouen")
            lat, lon = geocode(town, cache)
            k = by_town.get(town, 0)
            by_town[town] = k + 1
            if k:  # spread stations of the same town on a small circle (~700 m)
                angle = k * 2.4
                lat, lon = lat + 0.0065 * math.sin(angle), lon + 0.0095 * math.cos(angle)
            s.update(town=town, latitude=round(lat, 5), longitude=round(lon, 5), position="commune")
        else:
            s.update(town="Le Havre", position="exacte")
        for f in ("latitude", "longitude"):
            s[f] = float(s[f]) if s[f] is not None else None

    # hourly: compact arrays per station and pollutant on a common hourly axis
    hours = sorted({r["ts_utc"] for r in hourly_rows})
    pos = {h: i for i, h in enumerate(hours)}
    hourly: dict = {}
    for r in hourly_rows:
        series = hourly.setdefault(r["station_code"], {}).setdefault(r["pollutant"], [None] * len(hours))
        series[pos[r["ts_utc"]]] = round(float(r["value"]), 1)

    forecast = requests.get(f"{a.forecast}/forecast", timeout=120).json()
    model = requests.get(f"{a.forecast}/model", timeout=30).json()

    fleet, kpi = [], {}
    if a.backoffice_password:
        auth = (a.backoffice_user, a.backoffice_password)
        fleet = requests.get(f"{a.backoffice}/api/capteurs", auth=auth, timeout=30).json()
        kpi = requests.get(f"{a.backoffice}/api/indicateurs", auth=auth, timeout=30).json()
        keep = ("id", "modele", "statut", "site_nom", "commune", "environnement", "latitude", "longitude",
                "derniere_communication", "taux_rejet_pct", "tickets_actifs", "prochain_etalonnage",
                "disponibilite_pct", "mtbf_jours")
        fleet = [{k: c.get(k) for k in keep} for c in fleet]

    write("stations.json", stations)
    write("daily.json", daily)
    write("hourly.json", {"start": hours[0], "count": len(hours), "series": hourly})
    write("forecast.json", {"forecasts": forecast, "backtest": model.get("backtest", {}),
                            "trained_until": model.get("trained_until")})
    if a.backoffice_password:
        write("fleet.json", {"sensors": fleet, "indicators": kpi})
    else:  # the daily CI refresh has no back-office: keep the last fleet export
        print("fleet.json: kept (no back-office password given)")
    write("meta.json", {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="minutes"),
        "last_day": last,
        "sources": [
            {"name": "LCSQA / Geod'air - données temps réel", "licence": "Licence Ouverte 2.0",
             "url": "https://www.data.gouv.fr/fr/datasets/donnees-temps-reel-de-mesure-des-concentrations-de-polluants-atmospheriques-reglementes-1/"},
            {"name": "Open-Meteo (prévisions météo du modèle)", "licence": "CC BY 4.0", "url": "https://open-meteo.com"},
            {"name": "Géocodage des communes : Géoplateforme (IGN), ex api-adresse", "licence": "Licence Ouverte 2.0",
             "url": "https://adresse.data.gouv.fr"},
            {"name": "Fond de carte © contributeurs OpenStreetMap", "licence": "ODbL", "url": "https://www.openstreetmap.org/copyright"},
        ]})


if __name__ == "__main__":
    main()
