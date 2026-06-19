# Bingo Night Agent Workflow Rules

These rules apply to any automation or agent working in this repo.

## Current Project State

- Current cycle: `v0.1.0-dev4` — **Display polish + sharing shipped.** QR code on TV display for scan-to-join. Caller history (last 5 calls). Share play link on controller (Copy Link + QR). Colour/B&W print toggle. Logo placeholder. Column-colour numbers on all pages. Piper TTS pre-generates offline voice clips for all 75 balls and special events. Display page plays audio on each call. Controller has a 🔊/🔇 toggle. Cast to TV uses the W3C Presentation API (Chromecast/AirPlay) with a QR code fallback.
- Public/stable baseline: none yet (pre-release).
- `dev3` shipped: `bingo/tts.py` BingoTTS class (Piper TTS wrapper). `scripts/download_voice.py` model downloader. `app.py`: `_init_tts()` startup; `tts_toggle` SocketIO handler; `tts_state` broadcast; version `v0.1.0-dev3`. Display: `<audio>` element, TTS indicator, plays ball/bingo/all_called WAVs. Controller: TTS toggle button, Cast to TV with PresentationRequest API + QR fallback. `.gitignore`: `models/` and `static/audio/` excluded.
- `dev2` shipped: `bingo/session.py` PlayerRegistry (join, rejoin, disconnect, claim, reset_cards, thread-safe). `/play` route + `play.html`/`play.css`/`play.js` player app (loading→join→card screens, localStorage rejoin, auto-mark with pop animation, BINGO claim button, toast feedback, winner overlay). Controller: player roster (live pills with connected/claimed state), winner banner with dismiss. Display: winner overlay (auto-dismisses 15s). `app.py`: `join`, `rejoin`, `disconnect`, `claim_bingo` SocketIO events; `game_won` flag prevents duplicate broadcasts; reset pushes new cards to all players.
- `dev1` shipped: Initial project scaffold. Flask + Flask-SocketIO backend. `/display` full-screen TV caller (75-ball board, colour-coded columns, live current-ball highlight). `/` mobile controller (Call Next, Undo, New Game with confirmation, progress bar, per-column called list). `/cards` printable card generator (configurable count 1–30, 5×5 FREE-centre cards, 2-per-page print layout, colour-coded BINGO headers). `bingo/game.py` game state (draw without replacement, undo, reset). `bingo/card_generator.py` standard B-I-N-G-O column ranges.
- Issue tracker: use GitHub issues on `stu-the-ironman/bingo-night`.
- Primary planning source is `TODO.md`; shipped scope is tracked in `DONE.md`; release-facing history is `docs/CHANGELOG.md`.

## Immediate Handoff Priorities

### Phase 3 — TTS + Casting (SHIPPED dev3)

| Task | File(s) | Status |
|------|---------|--------|
| Piper TTS offline voice announcements | `bingo/tts.py`, `app.py` | **SHIPPED** |
| TTS toggle button on controller | `controller.html`, `controller.js`, `controller.css` | **SHIPPED** |
| Audio playback on display | `display.html`, `display.js` | **SHIPPED** |
| Cast to TV (Presentation API + QR fallback) | `controller.html`, `controller.js`, `controller.css` | **SHIPPED** |
| Voice model download helper | `scripts/download_voice.py` | **SHIPPED** |

### Phase 2 — Player App (SHIPPED dev2)

| Task | File(s) | Status |
|------|---------|--------|
| `/play` route — join-game page (enter name, get assigned a card) | `app.py`, `templates/play.html` | **SHIPPED** |
| WebSocket auto-mark — called numbers highlight on player's card | `static/js/play.js`, `app.py` | **SHIPPED** |
| BINGO claim button — server auto-verifies all 12 lines | `static/js/play.js`, `bingo/session.py` | **SHIPPED** |
| Session persistence — localStorage UUID → server rejoin | `app.py`, `bingo/session.py` | **SHIPPED** |
| Player list on controller — live roster with claimed state | `templates/controller.html`, `static/js/controller.js` | **SHIPPED** |
| Winner banner on controller + overlay on display | `controller.html`, `display.html`, `display.js` | **SHIPPED** |

### Remaining Polish Items (Future)

| Task | File(s) | Status |
|------|---------|--------|
| QR code on display — scan to join as player | `templates/display.html` | Planned |
| Themed ball sets — holiday skins | `bingo/game.py`, `app.py` | Planned |
| Dark/light print option for cards | `static/css/cards.css` | Planned |
| Caller history scroll on display (last 5 calls) | `display.html`, `display.js` | Planned |

## Commit Discipline

- **ALWAYS stage and commit after every change. Do not wait for permission.**
- `git add` relevant files then `git commit -m "..."`.
- Do not leave unstaged changes in the worktree.
- Commit only files related to the current task.

## Documentation Discipline

Every time work lands, **all six documents must be updated in the same commit**:

| Document | What to update |
|---|---|
| `docs/roadmap.html` | Card status, cycle, desc; add new cards; update changelog/checklist data |
| `docs/ROADMAP.md` | Mermaid timeline entry; Current State prose; Now/Next sections |
| `docs/CHANGELOG.md` | New bullet under current dev cycle heading |
| `AGENTS.md` | Settled decisions, handoff priorities, current cycle state |
| `DONE.md` | New section entry for the completed feature |
| `TODO.md` | Check off completed items; add newly scoped items |

## Interactive Roadmap Maintenance (`docs/roadmap.html`)

The interactive roadmap is the **primary visual tracker** for the project.

### Card Status Values

| Value | Meaning |
|---|---|
| `shipped` | Merged, tested, confirmed working by a real user or tester |
| `done` | Code committed and CI green, but not yet tester-verified |
| `active` | Currently being worked on this cycle |
| `planned` | Scoped for an upcoming cycle — implementation not started |
| `future` | Deferred; no cycle assigned yet |

### What to Update When a Feature Lands

1. **Find the card** — search the `roadmap` JS object by `id` or `title`.
2. **Update `status`** — set to `done` when committed, `shipped` once tester confirms.
3. **Update `cycle`** — set to the current dev cycle (e.g. `'dev2'`).
4. **Update `desc`** — if the implementation detail differs from what was planned, rewrite it to match reality.
5. **Update `files`** — add or correct the key file paths.

### What to Update When New Work Is Scoped

Add a new card object to the correct module's `items` array:

```javascript
{ id: 'unique-kebab-id', title: 'Feature Name',
  desc: 'What it does and why it matters — one or two sentences.',
  status: 'planned', cycle: 'dev2',
  files: ['app.py', 'templates/play.html'],
  deps: ['id-of-dependency-card'] },
```

### What NOT to Do

- Do not leave a card at `status: 'planned'` after the code is committed.
- Do not leave a card at `status: 'done'` indefinitely — chase the tester sign-off.
- Do not edit `roadmap.html` in isolation — always sync `ROADMAP.md`, `CHANGELOG.md`, `DONE.md`, `TODO.md` in the same commit.

## Version Bumping

- After every major feature/change: bump the version in `app.py` (`APP_VERSION`) and `docs/CHANGELOG.md`.
- Versioning model:
  - `v0.1.0-devN` is the rolling dev/nightly line
  - `v0.1.0` will be the first public stable release
  - dev numbering is continuous

## Settled Decisions

### WebSocket Transport — Flask-SocketIO + threading

**Flask-SocketIO with `async_mode='threading'` is the chosen transport.** Eventlet was evaluated and rejected due to deprecation warnings and maintenance status. The threading mode is sufficient for LAN game-night scale (< 20 concurrent players). Do not switch to eventlet or gevent without a concrete reason.

### No External Database

**Game state is held in memory in `BingoGame` singleton.** There is no database. This is intentional — the app runs for a single game session and resets cleanly. Persistence (e.g. SQLite for session rejoin) can be added in Phase 2 player app work, but the in-memory model must remain the primary path.

### Standard BINGO Column Ranges

**B: 1–15, I: 16–30, N: 31–45, G: 46–60, O: 61–75.** Do not change or make these configurable. Themed variants should use a separate ball-set abstraction layered on top, not modify the core ranges.

### Column Colours

**B: `#e74c3c`, I: `#e67e22`, N: `#27ae60`, G: `#2980b9`, O: `#8e44ad`.** These are defined in the JS client files and the CSS. Keep them consistent across all three pages.

## Platform Scope

- **LAN / local network web app.** Not designed for public internet deployment.
- Python 3.11+, Flask 3.x, Flask-SocketIO 5.x.
- Client targets: any modern browser. TV display tested on Chrome. Controller tested on mobile Chrome/Safari.

## Coordination

- Ask before changing the WebSocket event schema — controller and display must stay in sync.
- The `state` event payload (`current`, `called`, `remaining`, `total`) is the canonical game state wire format. Do not rename fields without updating all JS consumers.
- Keep `bingo/game.py` free of Flask imports — it is pure logic and must remain independently testable.
