const COLORS  = { B: '#ff2d78', I: '#ff9500', N: '#00e676', G: '#00d4ff', O: '#b44dff' };
const LETTERS = ['B', 'I', 'N', 'G', 'O'];

const PATTERN_CELLS = {
  corners:  [[0,0],[0,4],[4,0],[4,4]],
  plus:     [[0,2],[1,2],[2,0],[2,1],[2,2],[2,3],[2,4],[3,2],[4,2]],
  x:        [[0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]],
  blackout: Array.from({length:25}, (_,i) => [Math.floor(i/5), i%5]),
};

const params      = new URLSearchParams(location.search);
const cardId      = params.get('id') || '';
const encodedGrid = params.get('c')  || '';

function decodeGrid(c) {
  const vals = c.split(',').map(Number);
  const grid = Array.from({length: 5}, () => Array(5).fill(null));
  for (let col = 0; col < 5; col++)
    for (let row = 0; row < 5; row++) {
      const v = vals[col * 5 + row];
      grid[row][col] = v === 0 ? null : v;
    }
  return grid;
}

function checkWin(grid, calledSet, pattern = 'line') {
  function isMarked(r, c) {
    const val = grid[r][c];
    return val === null || calledSet.has(`${LETTERS[c]}${val}`);
  }

  if (pattern === 'line' || !PATTERN_CELLS[pattern]) {
    const lines = [];
    for (let r = 0; r < 5; r++) lines.push([[r,0],[r,1],[r,2],[r,3],[r,4]]);
    for (let c = 0; c < 5; c++) lines.push([[0,c],[1,c],[2,c],[3,c],[4,c]]);
    lines.push([[0,0],[1,1],[2,2],[3,3],[4,4]]);
    lines.push([[0,4],[1,3],[2,2],[3,1],[4,0]]);
    for (const line of lines) {
      if (line.every(([r, c]) => isMarked(r, c))) return line;
    }
    return null;
  }

  const cells = PATTERN_CELLS[pattern];
  return cells.every(([r, c]) => isMarked(r, c)) ? cells : null;
}

function renderCard(grid, calledSet, winLine) {
  const winSet    = winLine ? new Set(winLine.map(([r,c]) => `${r},${c}`)) : null;
  const lettersEl = document.getElementById('card-letters');
  const gridEl    = document.getElementById('card-grid');
  lettersEl.innerHTML = '';
  gridEl.innerHTML    = '';

  for (const letter of LETTERS) {
    const el = document.createElement('div');
    el.className = 'card-letter';
    el.style.background = COLORS[letter];
    el.textContent = letter;
    lettersEl.appendChild(el);
  }

  for (let r = 0; r < 5; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'grid-row';
    for (let c = 0; c < 5; c++) {
      const val      = grid[r][c];
      const isFree   = val === null;
      const isMarked = isFree || calledSet.has(`${LETTERS[c]}${val}`);
      const isWin    = winSet && winSet.has(`${r},${c}`);

      const cell = document.createElement('div');
      cell.className = 'grid-cell' +
        (isFree               ? ' free'     : '') +
        (isMarked && !isFree  ? ' marked'   : '') +
        (isWin                ? ' win-cell' : '');

      if (!isFree && isMarked) {
        cell.style.color      = COLORS[LETTERS[c]];
        cell.style.background = `${COLORS[LETTERS[c]]}22`;
      }
      cell.textContent = isFree ? 'FREE' : val;
      rowEl.appendChild(cell);
    }
    gridEl.appendChild(rowEl);
  }
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function init() {
  if (!cardId || !encodedGrid) {
    showError('Invalid card link. Please scan the QR code on your card again.');
    return;
  }

  let grid;
  try { grid = decodeGrid(encodedGrid); }
  catch { showError('Could not decode card data.'); return; }

  const [stateRes, regRes] = await Promise.all([
    fetch('/api/game-state').catch(() => null),
    fetch(`/api/card-registration/${encodeURIComponent(cardId)}`).catch(() => null),
  ]);

  if (!stateRes || !stateRes.ok) {
    showError('Could not reach the game server. Make sure you are on the same network.');
    return;
  }

  const state     = await stateRes.json();
  const reg       = (regRes && regRes.ok) ? await regRes.json() : null;
  const calledSet = new Set(state.called || []);
  const pattern   = state.pattern || 'line';
  const winLine   = checkWin(grid, calledSet, pattern);

  renderCard(grid, calledSet, winLine);

  document.getElementById('card-serial').textContent = `ID: ${cardId}`;
  document.getElementById('card-wrap').classList.remove('hidden');

  const playerLabel = document.getElementById('player-label');
  if (reg && reg.name) {
    playerLabel.textContent = `Registered to: ${reg.name}`;
  } else {
    playerLabel.textContent = 'Unregistered card';
    document.getElementById('register-section').classList.remove('hidden');
  }

  const statusEl = document.getElementById('bingo-status');
  if (winLine) {
    statusEl.textContent = 'BINGO!';
    statusEl.className   = 'bingo-status win';
  } else {
    statusEl.textContent = 'Not yet!';
    statusEl.className   = 'bingo-status not-yet';
  }

  if (winLine && !state.game_won) {
    document.getElementById('btn-claim').classList.remove('hidden');
  }
}

document.getElementById('btn-register').addEventListener('click', async () => {
  const name = document.getElementById('register-name').value.trim();
  if (!name) return;
  const btn = document.getElementById('btn-register');
  btn.disabled = true;

  const res = await fetch('/api/register-card', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ card_id: cardId, name, c: encodedGrid }),
  });

  if (res.ok) {
    document.getElementById('register-section').classList.add('hidden');
    document.getElementById('player-label').textContent = `Registered to: ${name}`;
  } else {
    btn.disabled = false;
    const data = await res.json().catch(() => ({}));
    showError(data.error || 'Registration failed. Please try again.');
  }
});

document.getElementById('btn-claim').addEventListener('click', async () => {
  const btn = document.getElementById('btn-claim');
  btn.disabled = true;
  btn.textContent = 'Verifying…';

  const res = await fetch('/api/claim-physical', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ card_id: cardId, c: encodedGrid }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.ok && data.valid) {
    btn.textContent      = 'BINGO CONFIRMED! 🏆';
    btn.style.background = 'linear-gradient(135deg, #ffe100, #ff9500)';
    btn.style.color      = '#111';
    const statusEl = document.getElementById('bingo-status');
    statusEl.textContent = 'BINGO WINNER!';
    statusEl.className   = 'bingo-status win';
  } else if (res.status === 409) {
    btn.textContent = 'Game already won';
    showError('The game has already been won.');
  } else {
    btn.disabled     = false;
    btn.textContent  = 'CLAIM BINGO! 🎉';
    showError(data.error || 'Claim failed — please try again.');
  }
});

init();
