const COLORS = { B: '#ff2d78', I: '#ff9500', N: '#00e676', G: '#00d4ff', O: '#b44dff' };
const RANGES = { B: [1,15], I: [16,30], N: [31,45], G: [46,60], O: [61,75] };

const PATTERN_CELLS = {
  line:     null,
  corners:  [[0,0],[0,4],[4,0],[4,4]],
  plus:     [[0,2],[1,2],[2,0],[2,1],[2,2],[2,3],[2,4],[3,2],[4,2]],
  x:        [[0,0],[0,4],[1,1],[1,3],[2,2],[3,1],[3,3],[4,0],[4,4]],
  blackout: Array.from({length:25}, (_,i) => [Math.floor(i/5), i%5]),
};

const PATTERN_NAMES = {
  line: 'Any Line', corners: 'Four Corners', plus: 'Plus', x: 'X Pattern', blackout: 'Blackout',
};

// Build number cells
const cellMap = {};

for (const [letter, [lo, hi]] of Object.entries(RANGES)) {
  const container = document.getElementById(`cells-${letter}`);
  const colour = COLORS[letter];
  for (let n = lo; n <= hi; n++) {
    const key = `${letter}${n}`;
    const el = document.createElement('div');
    el.className = 'board-cell';
    el.textContent = n;
    el.dataset.key = key;
    el.dataset.colour = colour;
    el.style.color = `${colour}80`;
    container.appendChild(el);
    cellMap[key] = el;
  }
}

// TTS
let ttsEnabled = false;
const ttsAudio = document.getElementById('tts-audio');

function playClip(path) {
  if (!ttsEnabled) return;
  ttsAudio.src = path;
  ttsAudio.play().catch(() => {});
}

// ── Pattern indicator ─────────────────────────────────────────────────────────

function renderMiniPattern(pattern) {
  const cells = PATTERN_CELLS[pattern];
  let html = '';
  for (let r = 0; r < 5; r++) {
    html += '<div class="mp-row">';
    for (let c = 0; c < 5; c++) {
      const isFree   = r === 2 && c === 2;
      const isTarget = !cells || cells.some(([pr, pc]) => pr === r && pc === c);
      const cls = isFree ? 'mp-cell mp-free' : isTarget ? 'mp-cell mp-on' : 'mp-cell';
      html += `<div class="${cls}"></div>`;
    }
    html += '</div>';
  }
  return html;
}

function updatePatternIndicator(pattern) {
  const nameEl = document.getElementById('pattern-name');
  const gridEl = document.getElementById('pattern-mini-grid');
  if (nameEl) nameEl.textContent = PATTERN_NAMES[pattern] || pattern;
  if (gridEl) gridEl.innerHTML = renderMiniPattern(pattern);
}

// ── Game state ────────────────────────────────────────────────────────────────

let _lastBall = null;

function applyState(state) {
  const { current, called, pattern } = state;

  if (current && current !== _lastBall) {
    playClip(`/static/audio/balls/${current}.wav`);
  }
  _lastBall = current;

  for (const el of Object.values(cellMap)) {
    el.className = 'board-cell';
    el.style.background = '';
    el.style.color = `${el.dataset.colour}80`;
  }

  for (const ball of called) {
    const el = cellMap[ball];
    if (!el) continue;
    el.classList.add('called');
    el.style.background = `${COLORS[ball[0]]}33`;
    el.style.color = '#fff';
  }

  if (current && cellMap[current]) {
    const el = cellMap[current];
    el.classList.add('latest');
    el.style.background = COLORS[current[0]];
    el.style.color = '#fff';
  }

  const ballEl   = document.getElementById('current-ball');
  const letterEl = document.getElementById('ball-letter');
  const numberEl = document.getElementById('ball-number');
  const waitMsg  = document.getElementById('waiting-msg');

  if (current) {
    const letter = current[0];
    const number = current.slice(1);
    letterEl.textContent = letter;
    numberEl.textContent = number;
    ballEl.style.background = COLORS[letter];
    ballEl.style.boxShadow = `0 0 60px ${COLORS[letter]}88`;
    ballEl.classList.remove('idle');
    waitMsg.style.opacity = '0';
  } else {
    letterEl.textContent = '?';
    numberEl.textContent = '';
    ballEl.style.background = '#1c1c30';
    ballEl.style.boxShadow = 'none';
    ballEl.classList.add('idle');
    waitMsg.style.opacity = '1';
  }

  document.getElementById('called-count').textContent = called.length;
  updateHistory(called, current);

  if (pattern) updatePatternIndicator(pattern);
}

function updateHistory(called, current) {
  const historyEl = document.getElementById('call-history');
  const prev = (current && called.length > 1)
    ? called.slice(0, -1).slice(-5).reverse()
    : [];

  historyEl.innerHTML = '';
  for (const ball of prev) {
    const chip = document.createElement('div');
    chip.className = 'history-chip';
    chip.style.background = `${COLORS[ball[0]]}22`;
    chip.style.color = COLORS[ball[0]];
    chip.style.borderColor = `${COLORS[ball[0]]}55`;
    chip.textContent = ball;
    historyEl.appendChild(chip);
  }
}

// QR — scan to join
new QRCode(document.getElementById('qr-join-code'), {
  text: `${location.origin}/play`,
  width: 180,
  height: 180,
  colorDark: '#000000',
  colorLight: '#ffffff',
});

// Initialise pattern indicator on load
updatePatternIndicator('line');

const socket = io();
socket.on('state', applyState);

socket.on('tts_state', data => {
  ttsEnabled = data.enabled;
  const indicator = document.getElementById('tts-indicator');
  if (data.available) {
    indicator.style.display = 'block';
    indicator.textContent = data.enabled ? '🔊' : '🔇';
  } else {
    indicator.style.display = 'none';
  }
});

socket.on('all_called', () => {
  const waitMsg = document.getElementById('waiting-msg');
  waitMsg.textContent = 'All 75 balls called!';
  waitMsg.style.opacity = '1';
  playClip('/static/audio/all_called.wav');
});

socket.on('bingo_winner', data => {
  const overlay = document.getElementById('winner-overlay');
  document.getElementById('winner-display-name').textContent = `${data.name} wins!`;
  overlay.style.display = 'flex';
  playClip('/static/audio/bingo.wav');
  setTimeout(() => { overlay.style.display = 'none'; }, 15000);
});
