const COLORS = { B: '#e74c3c', I: '#e67e22', N: '#27ae60', G: '#2980b9', O: '#8e44ad' };
const RANGES = { B: [1,15], I: [16,30], N: [31,45], G: [46,60], O: [61,75] };

// Build number cells — each cell stores its column colour for instant resets
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
    el.style.color = `${colour}80`;   // column colour at ~50% — visible but not called
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

let _lastBall = null;

function applyState(state) {
  const { current, called } = state;

  if (current && current !== _lastBall) {
    playClip(`/static/audio/balls/${current}.wav`);
  }
  _lastBall = current;

  // Reset all cells to uncalled (column colour at ~50%)
  for (const el of Object.values(cellMap)) {
    el.className = 'board-cell';
    el.style.background = '';
    el.style.color = `${el.dataset.colour}80`;
  }

  // Mark called cells (column colour tint background, full white text)
  for (const ball of called) {
    const el = cellMap[ball];
    if (!el) continue;
    el.classList.add('called');
    el.style.background = `${COLORS[ball[0]]}33`;
    el.style.color = '#fff';
  }

  // Latest ball — full column colour, pulse
  if (current && cellMap[current]) {
    const el = cellMap[current];
    el.classList.add('latest');
    el.style.background = COLORS[current[0]];
    el.style.color = '#fff';
  }

  // Current-ball widget
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
    ballEl.style.background = '#2a2a2a';
    ballEl.style.boxShadow = 'none';
    ballEl.classList.add('idle');
    waitMsg.style.opacity = '1';
  }

  document.getElementById('called-count').textContent = called.length;
  updateHistory(called, current);
}

// Last 5 calls before the current ball
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

// QR code — /play URL, rendered once on load
new QRCode(document.getElementById('qr-join-code'), {
  text: `${location.origin}/play`,
  width: 120,
  height: 120,
  colorDark: '#000000',
  colorLight: '#ffffff',
});

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
