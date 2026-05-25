# Changelog

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
