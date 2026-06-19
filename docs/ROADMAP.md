# Roadmap

## Current State

**v0.1.0-dev5** — Audit log + QR verification shipped. Every game session is logged to `logs/` as a JSON file. Printed cards optionally carry a QR code that encodes the full card grid — scanning opens `/verify` which shows live call marks and a "Claim BINGO!" button that only appears on a confirmed win. Cards now group into numbered books with printed serial codes. Full REST audit API added.

## Timeline

```mermaid
gantt
    title Bingo Night Development
    dateFormat  YYYY-MM-DD
    section Core
    Initial system (caller + cards)   :done,    dev1, 2026-05-25, 1d
    section Phase 2
    Player app (phone/tablet play)    :done,    dev2, 2026-05-25, 1d
    section Phase 3
    TTS + Casting                     :done,    dev3, 2026-05-26, 1d
    Display polish + sharing          :done,    dev4, 2026-06-19, 1d
    Audit log + QR verification       :done,    dev5, 2026-06-19, 1d
    section Future
    Themes + further polish           :planned, dev6, after dev5, 14d
```

## Now (dev5 — shipped)

- Game session audit log — every game session stored as `logs/{YYYY-MM-DD}_{NNN}.json` with all calls, undos, registrations, and winner timestamped in UTC
- QR codes on printed cards (toggle on `/cards`) — encodes full card grid into `/verify` URL for winner verification
- `/verify` page — mobile-optimised; shows card with live call marks; "Claim BINGO!" only appears on confirmed win; registration form links card to player name
- Book grouping + serial codes — cards group into numbered books ("BOOK 001") with a player name line; each card shows its book and position for quick verbal cross-reference
- Cards-per-book input + 200-card limit
- Audit REST API — list, get, delete sessions; CSV export
- Display QR size bumped to 180 px

## Recent (dev4 — shipped)

- QR code on TV display — scan to join `/play`, no URL typing needed
- Caller history row — last 5 previous balls shown as coloured chips on display
- Share play link on controller — Copy Link + QR toggle in players section
- Colour / B&W print toggle on cards — localStorage-persisted
- Logo placeholder in display and controller headers
- Column-colour numbers — uncalled/unmarked cells show column colour at reduced opacity across all pages

## Recent (dev3 — shipped)

- Piper TTS offline voice: all 75 balls + bingo/new-game/all-called clips pre-generated at startup
- Controller TTS toggle (🔊/🔇) — synced to display; hidden when model not installed
- Cast to TV — PresentationRequest API (Chromecast/AirPlay native picker); QR code + copy URL fallback
- `scripts/download_voice.py` — one-command model download

## Recent (dev2 — shipped)

- `/play` join page — enter name, receive a card on your device
- Numbers auto-mark as host calls them (WebSocket push)
- BINGO claim button — server-side win verification, toast feedback
- Server-side session map — rejoin on page reload (localStorage UUID)
- Live player roster on controller; winner banner + TV overlay

## Recent (dev1 — shipped)

- TV display caller with full 75-ball board
- Mobile controller (call, undo, reset)
- Printable card generator (configurable count, print layout)
- Real-time WebSocket sync

## Next (Future)

- Themed ball sets (holiday skins)
- Admin UI for browsing and exporting audit logs
- Card PDF export (server-side, WeasyPrint)
