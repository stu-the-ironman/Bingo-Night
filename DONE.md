# DONE

## dev2 — Player App

**Shipped:** 2026-05-25

### Backend

- `bingo/session.py` — `PlayerRegistry`: thread-safe (per-operation `threading.Lock`). `join` creates UUID + card, stores socket_id mapping. `rejoin` swaps socket_id for reconnecting player. `disconnect` nulls socket_id (keeps card). `claim` runs `verify_win` against all 12 lines (5 rows, 5 cols, 2 diagonals) using called set passed from `game.called`. `reset_cards` regenerates all cards, returns `(socket_id, card)` pairs for push. `player_list` returns name/claimed/connected state for roster.
- `bingo/session.py` — `verify_win`: checks all 12 lines; `None` cells (FREE) count as marked; returns `(valid, winning_line)`.
- `app.py` — `game_won` flag prevents duplicate `bingo_winner` broadcasts. `join`/`rejoin`/`disconnect`/`claim_bingo` events wired. `reset` now calls `registry.reset_cards()` and pushes `new_card` to each connected player before broadcasting `state`.

### Player App (`/play`)

- Three-screen flow: loading (spinner while checking rejoin) → join form → card.
- **Loading**: on connect, checks `localStorage` for `bingo_player_id`; emits `rejoin` if found, falls through to join form if not or if server returns `rejoin_failed`.
- **Join**: name input (max 30 chars), Enter or button to submit. Disabled until non-empty.
- **Card**: 5×5 grid with colour-coded BINGO header. FREE centre always marked gold. Cells animate with a pop on new mark. Mini ball in corner shows current call. BINGO button (red) triggers server-side win check.
- **Claim feedback**: toast message — green "BINGO confirmed!" or red "Not quite — keep going!". Winning line cells outlined in gold.
- **Winner overlay**: full-screen dark overlay with winner name; dismiss button.
- **New game**: server pushes `new_card` event; card re-renders with no marks.

### Controller (`/`)

- Player roster below controls: live pills showing each player's name, connected status (dimmed if disconnected), claimed state (gold border + 🎉 on claimed).
- Player count shown in progress label and roster header badge.
- BINGO winner banner slides in at top of screen on valid claim; dismiss button; cleared on New Game.

### Display (`/display`)

- `bingo_winner` SocketIO event triggers full-screen winner overlay with player name. Auto-dismisses after 15 seconds; tap to dismiss early.

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
