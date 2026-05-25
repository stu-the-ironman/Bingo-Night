const COLORS = { B: '#e74c3c', I: '#e67e22', N: '#27ae60', G: '#2980b9', O: '#8e44ad' };

const btnCall  = document.getElementById('btn-call');
const btnUndo  = document.getElementById('btn-undo');
const btnReset = document.getElementById('btn-reset');
const modal    = document.getElementById('reset-modal');

const socket = io();

socket.on('state', applyState);
socket.on('player_list', applyPlayerList);
socket.on('bingo_winner', applyWinner);
socket.on('all_called', () => {
  btnCall.disabled = true;
  btnCall.textContent = 'All Called!';
});

btnCall.addEventListener('click', () => socket.emit('call_next'));
btnUndo.addEventListener('click', () => socket.emit('undo'));
btnReset.addEventListener('click', () => modal.classList.remove('hidden'));

document.getElementById('confirm-reset').addEventListener('click', () => {
  socket.emit('reset');
  modal.classList.add('hidden');
  // Clear winner banner on new game
  document.getElementById('winner-banner').classList.add('hidden');
});

document.getElementById('cancel-reset').addEventListener('click', () => {
  modal.classList.add('hidden');
});

document.getElementById('btn-dismiss-winner').addEventListener('click', () => {
  document.getElementById('winner-banner').classList.add('hidden');
});

// ── Game state ──────────────────────────────────────────────────────────────

function applyState(state) {
  const { current, called, remaining, total } = state;

  const ballEl   = document.getElementById('current-ball');
  const letterEl = document.getElementById('ball-letter');
  const numberEl = document.getElementById('ball-number');
  const nameEl   = document.getElementById('ball-name');

  if (current) {
    const letter = current[0];
    const number = current.slice(1);
    letterEl.textContent = letter;
    numberEl.textContent = number;
    ballEl.style.background = COLORS[letter];
    ballEl.classList.remove('idle');
    nameEl.textContent = `${letter} — ${number}`;
  } else {
    letterEl.textContent = '?';
    numberEl.textContent = '';
    ballEl.style.background = '#2a2a2a';
    ballEl.classList.add('idle');
    nameEl.textContent = ' ';
  }

  const pct = total ? (called.length / total) * 100 : 0;
  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('called-count').textContent = called.length;
  document.getElementById('remaining-count').textContent = remaining;

  btnCall.disabled = remaining === 0;
  btnCall.textContent = remaining === 0 ? 'All Called!' : 'Call Next';
  btnUndo.disabled = called.length === 0;

  const lists = { B: [], I: [], N: [], G: [], O: [] };
  for (const ball of called) lists[ball[0]].push(ball);

  for (const letter of 'BINGO') {
    const el = document.getElementById(`list-${letter}`);
    el.innerHTML = '';
    for (const ball of lists[letter]) {
      const div = document.createElement('div');
      div.className = 'called-num' + (ball === current ? ' latest' : '');
      div.textContent = ball.slice(1);
      el.appendChild(div);
    }
  }
}

// ── Player roster ───────────────────────────────────────────────────────────

function applyPlayerList(players) {
  const count = players.length;
  document.getElementById('player-count').textContent = count;
  document.getElementById('player-badge').textContent = count;

  const listEl = document.getElementById('player-list');
  if (count === 0) {
    listEl.innerHTML = '<div class="no-players">No players yet — share <strong>/play</strong></div>';
    return;
  }

  listEl.innerHTML = '';
  for (const p of players) {
    const pill = document.createElement('div');
    let cls = 'player-pill';
    if (!p.connected) cls += ' disconnected';
    if (p.claimed)    cls += ' claimed';
    pill.className = cls;

    const dot = document.createElement('span');
    dot.className = 'status-dot';

    const name = document.createElement('span');
    name.textContent = p.claimed ? `${p.name} 🎉` : p.name;

    pill.appendChild(dot);
    pill.appendChild(name);
    listEl.appendChild(pill);
  }
}

// ── BINGO winner ─────────────────────────────────────────────────────────────

function applyWinner(data) {
  document.getElementById('winner-banner-name').textContent = data.name;
  document.getElementById('winner-banner').classList.remove('hidden');
}
