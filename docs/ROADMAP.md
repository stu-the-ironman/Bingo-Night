# Roadmap

## Current State

**v0.1.0-dev3** — TTS + Casting shipped. Piper TTS provides offline server-side voice announcements for all 75 balls and game events. Controller has a live TTS toggle. TV display plays audio. Cast to TV uses the W3C Presentation API (Chromecast/AirPlay) with a QR code fallback.

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
    section Future
    Polish (QR join, themes, history) :planned, dev4, after dev3, 14d
```

## Now (dev3 — shipped)

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

- QR code on TV display to scan and join as player
- Themed ball sets (holiday skins)
- Dark/light print modes for cards
- Caller history on display (last 5 calls)
