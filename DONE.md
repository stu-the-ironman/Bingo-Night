# DONE

## dev5 — Audit Log + QR Verification

**Shipped:** 2026-06-19

### Backend

- `bingo/audit.py` — `GameAudit` class: thread-safe per-session JSON log files stored in `logs/{YYYY-MM-DD}_{NNN}.json`. Records `calls`, `undos`, `registrations`, and `winner` per game session. Auto-creates a session on first `record_call()`. Methods: `new_session`, `close_session`, `record_call`, `record_undo`, `record_registration`, `record_winner`, `list_sessions`, `get_session`, `to_csv`, `delete_session`, `clear_all`.
- `bingo/card_generator.py` — card IDs upgraded from sequential integers to random 8-character alphanumeric strings (`random.choices(ascii_uppercase + digits, k=8)`) for unique card identification.
- `app.py` — `GameAudit` and `physical_cards` globals added. `_decode_grid()` helper decodes column-major comma-separated grid strings. `on_call_next` records each ball; `on_undo` records the undone ball; `on_reset` closes the session and clears physical card registrations; `on_claim_bingo` records the digital winner. Card count limit raised from 30 to 200. Version bumped to `v0.1.0-dev5`.

### New Routes

- `GET /verify` — renders the card verify page.
- `GET /api/game-state` — returns `{current, called, remaining, game_won}` for verify page polling.
- `GET /api/card-registration/<card_id>` — returns `{registered, name}` for a physical card.
- `POST /api/register-card` — links a physical card ID to a player name; records to audit log.
- `POST /api/claim-physical` — server-verifies a physical card grid against called balls; broadcasts `bingo_winner` and records winner if valid; returns 409 if game already won.
- `GET /api/sessions` — lists all audit sessions.
- `DELETE /api/sessions` — clears all audit session files.
- `GET /api/sessions/<id>` — returns full session JSON.
- `DELETE /api/sessions/<id>` — deletes a session file.
- `GET /api/sessions/<id>/csv` — returns session data as CSV download.

### Verify Page (`/verify`)

- `templates/verify.html` + `static/js/verify.js` + `static/css/verify.css` — mobile-optimised dark-theme page.
- Parses `id` and `c` query params from the card QR URL.
- `decodeGrid(c)` reconstructs the 5×5 grid from the column-major encoding (FREE=0).
- Fetches `/api/game-state` and `/api/card-registration/{id}` in parallel on load.
- Renders the card with called numbers highlighted in column colour; winning line cells outlined in gold.
- Unregistered cards show a name registration form; `POST /api/register-card` on submit.
- "Claim BINGO!" button renders **only** when the client-side win check passes and `game_won` is false — scanning at game start shows the card with no marks and no claim button.
- Physical claim goes to `POST /api/claim-physical`; on success the button turns gold and the server broadcasts `bingo_winner` to all connected clients.

### Cards (`/cards`)

- QR toggle button added (persisted in `localStorage`). When enabled, a 60px QR code appears in each card footer, encoding `{origin}/verify?id={card.id}&c={encoded_grid}`.
- "Cards per book" input (1–20, default 4). Cards are grouped into books with a printed serial header ("BOOK 001", "BOOK 002", …) + player name line — matches physical bingo book format seen on TV bingo.
- Each card footer shows book serial and card position (e.g., "BOOK 001 — CARD 2 OF 4"), giving a quick verbal reference when someone calls bingo without scanning.
- Card count input limit raised to 200.
- Print layout: each book starts on a new page (`page-break-before: page`); first book avoids leading break.

### Display (`/display`)

- Scan-to-join QR code size increased from 120px to 180px (QRCode constructor + CSS `clamp(120px, 14vw, 180px)`).

### Infrastructure

- `.gitignore` — `logs/` excluded so audit files don't enter version control.

## dev4 — Display Polish + Sharing

**Shipped:** 2026-06-19

### Display (`/display`)

- QR code widget (`qrcodejs`) fixed bottom-right corner encodes `window.location.origin + "/play"` — renders once on load; players scan to join without typing anything.
- Caller history row between current-ball widget and board: up to 5 previous calls shown as coloured chips (newest left), each coloured to its column and auto-hidden when no history.
- Logo `<img class="site-logo">` placeholder in header with CSS rule to hide when `src` is empty.
- `display.js`: uncalled board cells now show their column colour at 50% opacity (stored in `dataset.colour`); called cells white text on 20%-tinted column background; latest is full column colour.

### Controller (`/`)

- Share play link row added to Players section header: Copy Link (copies `origin + "/play"` to clipboard, shows "Copied!" confirmation) and QR toggle (lazy-builds `play-qr-code` div on first open).
- Logo placeholder in header matching display.
- `controller.css`: `.players-header` flex row, `.play-share-btns`, `.btn-share`, `.play-qr` styles; `.header-left` wraps logo + title.

### Cards (`/cards`)

- Colour / B&W toggle button next to Generate and Print. Toggles `body.print-bw` class which overrides all `.card-header-cell` backgrounds to `#111`. Preference stored in `localStorage` and restored on load.

### Player App (`/play`)

- `play.js`: unmarked card cells now show their column colour at 60% opacity in both `renderCard` and `updateMarks`, restoring the correct colour when a mark is cleared (e.g. on new game).

## dev3 — TTS + Casting

**Shipped:** 2026-05-26

### Backend

- `bingo/tts.py` — `BingoTTS` class wraps Piper TTS (`piper-tts` PyPI package). `generate_all(force=False)` pre-generates all 75 ball WAVs (`static/audio/balls/{ball}.wav`) plus `bingo.wav`, `new_game.wav`, `all_called.wav`. Skips existing files unless `force=True`. Returns count of generated files.
- `app.py` — `_init_tts()` reads `PIPER_MODEL` env var (default `models/en_US-lessac-medium.onnx`); logs warning and sets `tts_available=False` if model missing. `tts_toggle` SocketIO event flips `tts_enabled` and broadcasts `tts_state {enabled, available}` to all clients. `on_connect` now emits `tts_state` so display page syncs on load. Version bumped to `v0.1.0-dev3`.
- `scripts/download_voice.py` — downloads `.onnx` + `.onnx.json` for Piper `en_US-lessac-medium` voice from HuggingFace; accepts custom voice path and stem as CLI args.
- `requirements.txt` — `piper-tts` added.
- `.gitignore` — `models/` and `static/audio/` excluded from version control.

### Display (`/display`)

- `<audio id="tts-audio" preload="none">` element added.
- TTS indicator (🔊/🔇) shown in header when TTS is available; reflects enabled state.
- `display.js` tracks `_lastBall`; plays `static/audio/balls/{ball}.wav` when `current` changes, `bingo.wav` on `bingo_winner`, `all_called.wav` on `all_called`. Handles `tts_state` event to update `ttsEnabled` flag and indicator text.

### Controller (`/`)

- TTS toggle button (🔇/🔊) added to header; hidden when `tts_available=false`; emits `tts_toggle` on click.
- Cast to TV section: `PresentationRequest` API used for native Chromecast/AirPlay device picker. `getAvailability()` updates button label to show 📺 when devices are detected. Falls back to QR code (qrcodejs CDN) + Copy URL button when Presentation API is absent or picker is dismissed/rejected.
- `controller.css` — `.header-actions` flex wrapper; `.btn-icon` for TTS button; `.cast-section`, `.cast-qr`, `.btn-cast`, `.btn-copy-url` styles.

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
