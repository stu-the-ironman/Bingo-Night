# DONE

## dev1 — Initial System

**Shipped:** 2026-05-25

### Backend

- Flask + Flask-SocketIO backend (`app.py`) with `async_mode='threading'`.
- `bingo/game.py` — `BingoGame` class: in-memory pool of 75 standard balls (B1–15, I16–30, N31–45, G46–60, O61–75), draw without replacement, undo last call, reset to new game. State serialised as `{current, called, remaining, total}`.
- `bingo/card_generator.py` — generates random 5×5 bingo cards using correct per-column ranges; FREE space at row 2, col 2 (centre). Returns list of `{id, grid}` dicts via `/api/cards?count=N`.

### TV Display (`/display`)

- Full-screen dark-theme page for TV/projector.
- Current ball displayed large with column colour (`#e74c3c` B, `#e67e22` I, `#27ae60` N, `#2980b9` G, `#8e44ad` O).
- All 75 numbers pre-rendered in five columns; called numbers light up, latest pulses.
- Called count shown in header. "Waiting for first call…" idle state.

### Mobile Controller (`/`)

- Mobile-friendly layout (max 480px, `user-scalable=no`).
- **Call Next** button draws the next ball and broadcasts `state` to all clients.
- **Undo** reverts the last call (disabled when no calls made).
- **New Game** opens a confirmation modal before resetting.
- Progress bar and called/remaining counter.
- Called numbers listed per column with latest highlighted.
- Link to Open Display and Print Bingo Cards.

### Card Generator (`/cards`)

- Configurable count (1–30 cards).
- 5×5 grid, colour-coded BINGO header row, FREE centre space.
- Print-ready: controls hidden with `@media print`, cards 2-per-row on paper.
- Cards auto-generated on page load; regenerate button for fresh sets.
