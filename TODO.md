# TODO

## dev1 — Initial System (current cycle)

- [x] Flask + Flask-SocketIO backend scaffold
- [x] `bingo/game.py` — draw without replacement, undo, reset, state serialisation
- [x] `bingo/card_generator.py` — standard 5×5 BINGO cards with FREE centre
- [x] `/display` — full-screen TV caller (75-ball board, colour-coded columns, live highlight)
- [x] `/` controller — mobile-friendly (Call Next, Undo, New Game, progress bar, called list)
- [x] `/cards` — printable card generator (configurable count, 2-per-page print layout)
- [x] WebSocket real-time sync between controller and display
- [x] `AGENTS.md`, `TODO.md`, `DONE.md`, `docs/CHANGELOG.md`, `docs/ROADMAP.md`, `docs/roadmap.html`

## dev2 — Player App (DONE)

- [x] `/play` route — join-game page (enter name, receive a card)
- [x] WebSocket auto-mark — incoming `state` event highlights matched numbers on player card
- [x] BINGO claim button — server auto-verifies all 12 lines; toast feedback to player
- [x] Session persistence — localStorage UUID → server rejoin on page reload
- [x] Player list on controller — live roster with connected/claimed state
- [x] Winner banner on controller; winner overlay on TV display (auto-dismisses 15s)

## dev3 — Polish (Phase 3) (DONE)

- [x] Piper TTS — server-side offline voice announcements; pre-generated WAVs for all 75 balls + special clips
- [x] TTS toggle button on controller (🔊/🔇); graceful degradation when model not installed
- [x] TTS indicator on display header; audio plays on call, bingo, and all-called events
- [x] Cast to TV — Presentation API (Chromecast/AirPlay native picker); QR code fallback with copy URL
- [x] `scripts/download_voice.py` — one-command model download helper

## dev4 — Display Polish + Sharing (DONE)

- [x] QR code on display — scan-to-join widget fixed bottom-right of TV display
- [x] Caller history on display — last 5 previous calls shown as coloured chips
- [x] Share play link on controller — Copy Link + QR toggle in players section header
- [x] Colour / B&W print toggle on cards — localStorage-persisted preference
- [x] Logo placeholder in controller and display headers
- [x] Column-colour numbers on all pages — uncalled/unmarked cells show column colour at reduced opacity

## dev5 — Audit Log + QR Verification (DONE)

- [x] `bingo/audit.py` — `GameAudit`: thread-safe per-session JSON log files in `logs/`; records calls, undos, registrations, winner; list/get/csv/delete/clear query API
- [x] `bingo/card_generator.py` — card IDs changed to random 8-char alphanumeric strings
- [x] `app.py` — `GameAudit` integrated; `physical_cards` dict; `_decode_grid` helper; `/verify` route; 9 new REST endpoints; `on_call_next/undo/reset/claim_bingo` wired to audit; card count limit raised to 200; version `v0.1.0-dev5`
- [x] `/verify` — mobile-optimised card verify page; decodes grid from QR URL; shows card with called marks; registration form for unregistered cards; Claim BINGO! button appears only on valid win
- [x] Cards: QR toggle button + localStorage persistence; `encodeGrid()` builds verify URL; per-card QR (60px) in card footer when enabled; book grouping with printed serial "BOOK 001"; cards-per-book input; card count limit raised to 200
- [x] Display: QR join code size bumped 120→180 px; CSS clamp for responsive sizing
- [x] `.gitignore` — added `logs/`

## Backlog / Future

- [ ] Multiple simultaneous games (room codes)
- [ ] Host password protection
- [ ] Card PDF export (server-side, e.g. with WeasyPrint)
- [ ] Admin UI for viewing/exporting session audit logs
