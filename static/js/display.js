const COLORS = { B: '#e74c3c', I: '#e67e22', N: '#27ae60', G: '#2980b9', O: '#8e44ad' };
const RANGES = { B: [1,15], I: [16,30], N: [31,45], G: [46,60], O: [61,75] };

// Build number cells for all 75 balls up front
const cellMap = {};  // 'B7' → DOM element

for (const [letter, [lo, hi]] of Object.entries(RANGES)) {
  const container = document.getElementById(`cells-${letter}`);
  for (let n = lo; n <= hi; n++) {
    const key = `${letter}${n}`;
    const el = document.createElement('div');
    el.className = 'board-cell';
    el.textContent = n;
    el.dataset.key = key;
    container.appendChild(el);
    cellMap[key] = el;
  }
}

function applyState(state) {
  const { current, called } = state;

  // Reset all cells
  for (const el of Object.values(cellMap)) {
    el.className = 'board-cell';
    el.style.background = '';
  }

  // Mark called cells
  for (const ball of called) {
    const el = cellMap[ball];
    if (!el) continue;
    el.classList.add('called');
    el.style.background = `${COLORS[ball[0]]}33`;
  }

  // Highlight latest
  if (current && cellMap[current]) {
    const el = cellMap[current];
    el.classList.add('latest');
    el.style.background = COLORS[current[0]];
  }

  // Update current-ball display
  const ballEl = document.getElementById('current-ball');
  const letterEl = document.getElementById('ball-letter');
  const numberEl = document.getElementById('ball-number');
  const waitMsg = document.getElementById('waiting-msg');

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
}

const socket = io();
socket.on('state', applyState);
socket.on('all_called', () => {
  document.getElementById('waiting-msg').textContent = 'All 75 balls called!';
  document.getElementById('waiting-msg').style.opacity = '1';
});
socket.on('bingo_winner', data => {
  const overlay = document.getElementById('winner-overlay');
  document.getElementById('winner-display-name').textContent = `${data.name} wins!`;
  overlay.style.display = 'flex';
  // Auto-dismiss after 15 seconds
  setTimeout(() => { overlay.style.display = 'none'; }, 15000);
});
