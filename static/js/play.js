const COLORS  = { B: '#e74c3c', I: '#e67e22', N: '#27ae60', G: '#2980b9', O: '#8e44ad' };
const LETTERS = 'BINGO';

const socket = io();

let playerId  = null;
let playerName = null;
let cardGrid  = null;   // 5×5 array
let calledSet = new Set();
let prevCalledSet = new Set();

// ── Screen management ───────────────────────────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Join form ───────────────────────────────────────────────────────────────

const nameInput = document.getElementById('name-input');
const btnJoin   = document.getElementById('btn-join');

nameInput.addEventListener('input', () => {
  btnJoin.disabled = nameInput.value.trim().length === 0;
});

nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !btnJoin.disabled) doJoin();
});

btnJoin.addEventListener('click', doJoin);

function doJoin() {
  const name = nameInput.value.trim();
  if (!name) return;
  btnJoin.disabled = true;
  socket.emit('join', { name });
}

// ── SocketIO events ─────────────────────────────────────────────────────────

socket.on('connect', () => {
  const storedId = localStorage.getItem('bingo_player_id');
  if (storedId) {
    socket.emit('rejoin', { player_id: storedId });
  } else {
    showScreen('screen-join');
  }
});

socket.on('disconnect', () => {
  // Stay on card screen; will auto-rejoin when socket reconnects
});

socket.on('joined', data => {
  playerId   = data.player_id;
  playerName = data.name;
  localStorage.setItem('bingo_player_id', playerId);
  applyGameState(data.game_state);
  setCard(data.card);
  showScreen('screen-card');
  document.getElementById('btn-bingo').disabled = false;
  document.getElementById('player-tag').textContent = playerName;
});

socket.on('rejoined', data => {
  playerId   = localStorage.getItem('bingo_player_id');
  playerName = data.name;
  applyGameState(data.game_state);
  setCard(data.card);
  showScreen('screen-card');
  document.getElementById('btn-bingo').disabled = false;
  document.getElementById('player-tag').textContent = playerName;
});

socket.on('rejoin_failed', () => {
  localStorage.removeItem('bingo_player_id');
  showScreen('screen-join');
});

socket.on('state', state => {
  prevCalledSet = new Set(calledSet);
  calledSet = new Set(state.called);
  updateMiniball(state.current);
  if (cardGrid) updateMarks();
});

socket.on('new_card', data => {
  prevCalledSet = new Set();
  setCard(data.card);
  // calledSet will be cleared by the incoming 'state' broadcast
});

socket.on('claim_result', data => {
  if (data.valid) {
    showToast('BINGO confirmed!', 'valid');
    highlightWinLine(data.line);
  } else {
    showToast('Not quite — keep going!', 'invalid');
  }
});

socket.on('bingo_winner', data => {
  document.getElementById('winner-name-text').textContent = `${data.name} wins!`;
  document.getElementById('winner-overlay').classList.add('show');
});

// ── Card rendering ──────────────────────────────────────────────────────────

function setCard(card) {
  cardGrid = card.grid;
  renderCard();
  updateMarks();
}

function renderCard() {
  // Letter header row
  const lettersEl = document.getElementById('card-letters');
  lettersEl.innerHTML = '';
  for (const letter of LETTERS) {
    const el = document.createElement('div');
    el.className = 'card-letter';
    el.style.background = COLORS[letter];
    el.textContent = letter;
    lettersEl.appendChild(el);
  }

  // Grid
  const gridEl = document.getElementById('card-grid');
  gridEl.innerHTML = '';
  for (let r = 0; r < 5; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'grid-row';
    for (let c = 0; c < 5; c++) {
      const val = cardGrid[r][c];
      const cell = document.createElement('div');
      cell.className = 'grid-cell' + (val === null ? ' free marked' : '');
      cell.dataset.r = r;
      cell.dataset.c = c;
      if (val === null) {
        cell.textContent = 'FREE';
        cell.style.background = '#f9ca24';
        cell.style.color = '#111';
      } else {
        cell.textContent = val;
      }
      rowEl.appendChild(cell);
    }
    gridEl.appendChild(rowEl);
  }
}

function updateMarks() {
  if (!cardGrid) return;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const val = cardGrid[r][c];
      if (val === null) continue;
      const ball = `${LETTERS[c]}${val}`;
      const cell = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
      if (!cell) continue;

      const isMarked   = calledSet.has(ball);
      const wasMarked  = prevCalledSet.has(ball);
      const isNew      = isMarked && !wasMarked;

      cell.classList.toggle('marked', isMarked);
      if (isMarked) {
        cell.style.background = `${COLORS[LETTERS[c]]}cc`;
        cell.style.color = '#fff';
      } else {
        cell.style.background = '';
        cell.style.color = '';
      }

      if (isNew) {
        cell.classList.add('latest-mark');
        cell.addEventListener('animationend', () => cell.classList.remove('latest-mark'), { once: true });
      }
    }
  }
}

function highlightWinLine(line) {
  if (!line) return;
  for (const [r, c] of line) {
    const cell = document.querySelector(`.grid-cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) cell.style.outline = '3px solid #f9ca24';
  }
}

// ── Mini ball display ───────────────────────────────────────────────────────

function updateMiniball(current) {
  const el = document.getElementById('mini-ball');
  if (current) {
    el.textContent = current;
    el.style.background = COLORS[current[0]];
    el.style.color = '#fff';
    el.classList.add('active');
  } else {
    el.textContent = 'Waiting…';
    el.style.background = '';
    el.style.color = '';
    el.classList.remove('active');
  }
}

function applyGameState(state) {
  calledSet = new Set(state.called);
  prevCalledSet = new Set(state.called);
  updateMiniball(state.current);
}

// ── BINGO claim ─────────────────────────────────────────────────────────────

document.getElementById('btn-bingo').addEventListener('click', () => {
  if (!playerId) return;
  socket.emit('claim_bingo', { player_id: playerId });
});

// ── Toast ───────────────────────────────────────────────────────────────────

let toastTimer = null;

function showToast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── Winner overlay ──────────────────────────────────────────────────────────

function dismissWinner() {
  document.getElementById('winner-overlay').classList.remove('show');
}
