# Roadmap

## Current State

**v0.1.0-dev1** — Initial system shipped. Flask + SocketIO caller with TV display, mobile controller, and printable card generator.

## Timeline

```mermaid
gantt
    title Bingo Night Development
    dateFormat  YYYY-MM-DD
    section Core
    Initial system (caller + cards)   :done,    dev1, 2026-05-25, 1d
    section Phase 2
    Player app (phone/tablet play)    :planned, dev2, 2026-06-01, 14d
    section Phase 3
    Polish (sounds, QR, themes)       :planned, dev3, after dev2, 14d
```

## Now (dev1 — shipped)

- TV display caller with full 75-ball board
- Mobile controller (call, undo, reset)
- Printable card generator (configurable count, print layout)
- Real-time WebSocket sync

## Next (dev2 — Player App)

- `/play` join page — enter name, receive a card on your device
- Numbers auto-mark as host calls them (WebSocket push)
- BINGO claim button — host notified on controller
- Server-side session map — rejoin on page reload

## Later (dev3 — Polish)

- Sound effects on ball call (browser Web Audio)
- QR code on TV display to scan and join
- Themed ball sets (holiday skins)
- Dark/light print modes for cards
- Caller history on display (last 5 calls)
