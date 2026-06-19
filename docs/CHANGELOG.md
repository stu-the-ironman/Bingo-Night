# Changelog

## v0.1.0-dev5 — 2026-06-19

### Added

- `bingo/audit.py` — `GameAudit`: thread-safe per-session JSON audit files in `logs/`; records every call, undo, physical registration, and winner with UTC timestamps.
- `bingo/card_generator.py` — card IDs now 8-char random alphanumeric strings for unique card identity.
- `/verify` — mobile-optimised card verification page; decodes full grid from QR URL; shows called marks; registration form for unregistered cards; "Claim BINGO!" button appears only when the win check passes and the game is still live.
- `POST /api/claim-physical` — server-side verification of a physical printed card; broadcasts `bingo_winner` on valid win; returns 409 if game already won.
- `POST /api/register-card` — links a physical card to a player name; recorded in the audit log.
- `GET /api/card-registration/<card_id>` — returns registration state for a card.
- `GET /api/game-state` — lightweight poll endpoint returning `{current, called, remaining, game_won}`.
- `GET|DELETE /api/sessions`, `GET|DELETE /api/sessions/<id>`, `GET /api/sessions/<id>/csv` — full audit log management API.
- Cards: QR toggle (persisted in `localStorage`) — each card gets a 60px QR in its footer encoding its unique verify URL.
- Cards: "Cards per book" input; cards are grouped into numbered books ("BOOK 001", "BOOK 002", …) with a player-name line, matching physical bingo book format; book serial + card position printed on each card footer for quick verbal reference.
- Cards: card count limit raised from 30 to 200.
- Display: scan-to-join QR size increased from 120 px to 180 px.
- `.gitignore` — `logs/` excluded.

## v0.1.0-dev4 — 2026-06-19

### Added

- Display: QR code widget fixed bottom-right corner encodes `/play` URL — players scan to join without typing a URL.
- Display: Caller history row shows up to 5 previous calls (newest first) as coloured chips between the current ball and the board.
- Display: Logo `<img class="site-logo">` placeholder in header — hidden until a file is placed at `static/img/logo.png`.
- Controller: Share play link row in Players section header — Copy Link button (clipboard) and QR toggle that lazy-renders the `/play` QR code.
- Controller: Logo placeholder in header to match display.
- Cards: Colour / B&W toggle button — switches card header row between full-colour and black & white; preference persisted in `localStorage`.
- Colour-coded numbers across all pages: uncalled board cells show their column colour at 50% opacity; unmarked player card cells show column colour at 60% opacity — column identity is always visible, not just after a ball is called.
- `app.py`: version bumped to `v0.1.0-dev4`.

## v0.1.0-dev3 — 2026-05-26

### Added

- `bingo/tts.py` — `BingoTTS`: wraps Piper TTS voice model; `generate_all()` pre-generates WAV clips for all 75 balls + `bingo.wav`, `new_game.wav`, `all_called.wav` into `static/audio/`.
- `scripts/download_voice.py` — one-command helper to fetch the Piper `en_US-lessac-medium` voice model from HuggingFace into `models/`.
- `requirements.txt` — added `piper-tts`.
- `app.py` — `_init_tts()` startup function; `tts_available` / `tts_enabled` globals; `tts_toggle` SocketIO handler broadcasts `tts_state` to all clients; `on_connect` now emits `tts_state`; version bumped to `v0.1.0-dev3`.
- Display: `<audio id="tts-audio">` element; TTS indicator (🔊/🔇) in header; `display.js` plays ball WAV on each new call, `bingo.wav` on winner, `all_called.wav` on completion; handles `tts_state` event.
- Controller: TTS toggle button (🔇/🔊) in header; wired to `tts_toggle` SocketIO event; hidden when TTS unavailable.
- Controller: Cast to TV section — `PresentationRequest` API triggers native Chromecast/AirPlay picker; falls back to QR code + Copy URL button when Presentation API unavailable or declined.
- `.gitignore` — added `models/` and `static/audio/` so generated audio and voice model binaries stay out of the repo.

## v0.1.0-dev2 — 2026-05-25

### Added

- `bingo/session.py` — `PlayerRegistry`: thread-safe player state management (join, rejoin, disconnect, claim, reset_cards, player_list). `verify_win` checks all 12 BINGO lines (5 rows, 5 cols, 2 diagonals); FREE centre counts for all lines it participates in.
- `/play` route — player join + card page. Three-screen flow: loading → join → card.
- Player join/rejoin via localStorage UUID; page reload restores card without re-entering name.
- Numbers auto-mark on card with pop animation as host calls them.
- BINGO claim button — server verifies win, returns result to player; toast feedback (confirmed / not yet).
- Winning line highlighted in gold outline on valid claim.
- Winner overlay on player page; winner overlay on TV display (auto-dismisses 15 s, tap to dismiss).
- Controller: live player roster (name pills, connected/disconnected state, claimed indicator).
- Controller: BINGO winner banner slides in at top on valid claim; dismissed by host or on New Game.
- `app.py`: `game_won` flag prevents duplicate `bingo_winner` broadcasts per game.
- `app.py` `reset`: pushes `new_card` event to all connected players before broadcasting new game state; clears `game_won`.
- `APP_VERSION = 'v0.1.0-dev2'` constant in `app.py`.

## v0.1.0-dev1 — 2026-05-25

### Added

- Initial project: Flask + Flask-SocketIO backend with threading async mode.
- `bingo/game.py` — `BingoGame`: draw without replacement, undo, reset, state serialisation over WebSocket.
- `bingo/card_generator.py` — standard 5×5 BINGO card generation (B1–15, I16–30, N31–45, G46–60, O61–75) with FREE centre space.
- `/display` — full-screen TV caller display: large current-ball widget with column colour, 75-ball board with live highlight and pulse animation, idle state, called count.
- `/` — mobile controller: Call Next, Undo (with disabled state), New Game (with confirmation modal), progress bar, per-column called list, link to display and card generator.
- `/cards` — printable card generator: configurable 1–30 cards, colour-coded headers, 2-per-page print layout via `@media print`, auto-generate on load.
- `/api/cards` — JSON endpoint returning card data for the JS card renderer.
- Real-time WebSocket sync: all connected clients (display + controller + future player tabs) receive `state` events on every call, undo, and reset.
- `requirements.txt` — `flask>=3.0.0`, `flask-socketio>=5.3.6`.
- `AGENTS.md`, `TODO.md`, `DONE.md`, `docs/CHANGELOG.md`, `docs/ROADMAP.md`, `docs/roadmap.html` — full project documentation scaffold.
