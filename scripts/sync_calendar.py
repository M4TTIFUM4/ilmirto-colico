#!/usr/bin/env python3
"""
Sincronizzazione calendari per Il Mirto (eseguito da GitHub Actions).

1. Scarica i calendari iCal/ICS di Airbnb e Booking.com
   (URL letti dai "secrets" del repository: AIRBNB_ICAL_URL, BOOKING_ICAL_URL).
2. Aggiunge le prenotazioni dirette inserite a mano in data/blocchi-manuali.json.
3. Scrive data/availability.json con SOLO le date occupate (nessun dato personale).
4. Scrive calendario-diretto.ics con le prenotazioni dirette, da importare
   in Airbnb e Booking.com per bloccare quelle date anche lì.

Usa solo la libreria standard di Python: nessuna dipendenza da installare.
"""
import json
import os
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_JSON = os.path.join(ROOT, "data", "availability.json")
MANUAL = os.path.join(ROOT, "data", "blocchi-manuali.json")
OUT_ICS = os.path.join(ROOT, "calendario-diretto.ics")

FEEDS = [
    ("Airbnb", os.environ.get("AIRBNB_ICAL_URL", "").strip()),
    ("Booking.com", os.environ.get("BOOKING_ICAL_URL", "").strip()),
]
# Eventuali altri calendari (es. VRBO), separati da spazio
for i, u in enumerate(os.environ.get("EXTRA_ICAL_URLS", "").split()):
    FEEDS.append((f"Calendario {i + 1}", u))


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (calendar-sync; GitHub Actions)"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", errors="replace")


def parse_date(value):
    v = value.strip()[:8]
    return date(int(v[0:4]), int(v[4:6]), int(v[6:8]))


def parse_ics(text):
    """Restituisce una lista di (inizio, fine) con fine esclusa (= giorno di check-out)."""
    lines = []
    for raw in text.replace("\r\n", "\n").split("\n"):
        if raw[:1] in (" ", "\t") and lines:
            lines[-1] += raw[1:]
        else:
            lines.append(raw)
    events, cur = [], None
    for line in lines:
        if line == "BEGIN:VEVENT":
            cur = {}
        elif line == "END:VEVENT" and cur is not None:
            if "start" in cur:
                end = cur.get("end") or cur["start"] + timedelta(days=1)
                if end > cur["start"]:
                    events.append((cur["start"], end))
            cur = None
        elif cur is not None and ":" in line:
            name, value = line.split(":", 1)
            prop = name.split(";")[0].upper()
            if prop == "DTSTART":
                cur["start"] = parse_date(value)
            elif prop == "DTEND":
                cur["end"] = parse_date(value)
    if "BEGIN:VCALENDAR" not in text:
        raise ValueError("il contenuto scaricato non è un calendario ICS")
    return events


def merge(ranges):
    out = []
    for s, e in sorted(ranges):
        if out and s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out


def main():
    today = datetime.now(timezone.utc).date()
    ranges, sources = [], []

    for name, url in FEEDS:
        if not url:
            continue
        try:
            ev = parse_ics(fetch(url))
        except Exception as exc:  # noqa: BLE001
            # Meglio non pubblicare un calendario incompleto: il sito resta alla versione precedente.
            print(f"ERRORE: impossibile leggere il calendario {name}: {exc}", file=sys.stderr)
            sys.exit(1)
        print(f"{name}: {len(ev)} periodi occupati")
        ranges += ev
        sources.append(name)

    manual = []
    if os.path.exists(MANUAL):
        with open(MANUAL, encoding="utf-8") as f:
            for b in json.load(f).get("prenotazioni", []):
                s, e = date.fromisoformat(b["arrivo"]), date.fromisoformat(b["partenza"])
                if e > s:
                    manual.append((s, e, b.get("nota", "")))
                    ranges.append((s, e))
        print(f"Prenotazioni dirette: {len(manual)}")
        if any(e > today for _, e, _ in manual):
            sources.append("prenotazioni dirette")

    busy = [
        {"start": s.isoformat(), "end": e.isoformat()}
        for s, e in merge(ranges)
        if e > today
    ]
    data = {
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds") if sources else None,
        "sources": [s for s in sources if s != "prenotazioni dirette"] or sources,
        "busy": busy,
    }
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    # Calendario delle prenotazioni dirette, da importare su Airbnb/Booking
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Il Mirto//Prenotazioni dirette//IT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"]
    for s, e, _ in manual:
        if e <= today:
            continue
        ics += [
            "BEGIN:VEVENT",
            f"UID:diretta-{s:%Y%m%d}-{e:%Y%m%d}@ilmirto",
            f"DTSTAMP:{stamp}",
            f"DTSTART;VALUE=DATE:{s:%Y%m%d}",
            f"DTEND;VALUE=DATE:{e:%Y%m%d}",
            "SUMMARY:Non disponibile",
            "END:VEVENT",
        ]
    ics.append("END:VCALENDAR")
    with open(OUT_ICS, "w", encoding="utf-8", newline="") as f:
        f.write("\r\n".join(ics) + "\r\n")

    print(f"Scritti {len(busy)} periodi occupati in data/availability.json")


if __name__ == "__main__":
    main()
