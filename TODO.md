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

## dev2 — Player App (Phase 2)

- [ ] `/play` route — join-game page (enter name, receive a card)
- [ ] WebSocket auto-mark — incoming `state` event highlights matched numbers on player card
- [ ] BINGO claim button — emits `claim_bingo` event; controller receives `bingo_claimed` with player name
- [ ] Server-side session map — socket ID → player name + card; survive page reload via cookie
- [ ] Player list on controller — live roster of connected players, highlight who claimed

## dev3 — Polish (Phase 3)

- [ ] Sound effects — short audio cue on ball call (browser Web Audio API, no server-side deps)
- [ ] QR code on display — scan-to-join URL shown in corner of TV display
- [ ] Themed ball sets — Christmas, Halloween, etc. (label skin over standard numbers)
- [ ] Dark/light print option for card generator
- [ ] `/display` — caller history scroll (last 5 calls shown below current ball)

## Backlog / Future

- [ ] Multiple simultaneous games (room codes)
- [ ] Host password protection
- [ ] Card PDF export (server-side, e.g. with WeasyPrint)
- [ ] Caller voice announcement (browser SpeechSynthesis API)
