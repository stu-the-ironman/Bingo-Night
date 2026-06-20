const COLORS = { B: '#ff2d78', I: '#ff9500', N: '#00e676', G: '#00d4ff', O: '#b44dff' };

const btnCall  = document.getElementById('btn-call');
const btnUndo  = document.getElementById('btn-undo');
const btnReset = document.getElementById('btn-reset');
const btnTts   = document.getElementById('btn-tts');
const modal    = document.getElementById('reset-modal');

const socket = io();

socket.on('state', applyState);
socket.on('player_list', applyPlayerList);
socket.on('bingo_winner', applyWinner);
socket.on('tts_state', applyTtsState);
socket.on('all_called', () => {
  btnCall.disabled = true;
  btnCall.textContent = 'All Called!';
});

btnCall.addEventListener('click', () => socket.emit('call_next'));
btnUndo.addEventListener('click', () => socket.emit('undo'));
btnReset.addEventListener('click', () => modal.classList.remove('hidden'));
btnTts.addEventListener('click', () => socket.emit('tts_toggle'));

document.getElementById('confirm-reset').addEventListener('click', () => {
  socket.emit('reset');
  modal.classList.add('hidden');
  document.getElementById('winner-banner').classList.add('hidden');
});

document.getElementById('cancel-reset').addEventListener('click', () => {
  modal.classList.add('hidden');
});

document.getElementById('btn-dismiss-winner').addEventListener('click', () => {
  document.getElementById('winner-banner').classList.add('hidden');
});

// ── TTS toggle ───────────────────────────────────────────────────────────────

function applyTtsState(data) {
  if (!data.available) {
    btnTts.style.display = 'none';
    return;
  }
  btnTts.style.display = 'inline-flex';
  btnTts.textContent = data.enabled ? '🔊' : '🔇';
  btnTts.title = data.enabled ? 'Voice on — tap to mute' : 'Voice off — tap to enable';
}

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

// ── Share play link ──────────────────────────────────────────────────────────

const playUrl = `${location.origin}/play`;
let _playQrBuilt = false;

document.getElementById('btn-copy-play').addEventListener('click', () => {
  const btn = document.getElementById('btn-copy-play');
  navigator.clipboard.writeText(playUrl).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000);
  }).catch(() => {
    btn.textContent = playUrl;
  });
});

document.getElementById('btn-qr-play').addEventListener('click', () => {
  const qr = document.getElementById('play-qr');
  const nowHidden = qr.classList.toggle('hidden');
  if (!nowHidden && !_playQrBuilt) {
    new QRCode(document.getElementById('play-qr-code'), {
      text: playUrl,
      width: 160,
      height: 160,
      colorDark: '#000000',
      colorLight: '#ffffff',
    });
    _playQrBuilt = true;
  }
});

// ── Cast to TV ───────────────────────────────────────────────────────────────

const displayUrl = `${location.origin}/display`;
const btnCast = document.getElementById('btn-cast');
const castQr  = document.getElementById('cast-qr');
let _qrBuilt  = false;

let presentationReq = null;
if (window.PresentationRequest) {
  try {
    presentationReq = new PresentationRequest([displayUrl]);
    presentationReq.getAvailability().then(avail => {
      updateCastBtn(avail.value);
      avail.onchange = () => updateCastBtn(avail.value);
    }).catch(() => {});
  } catch (_) {}
}

function updateCastBtn(hasDevices) {
  btnCast.textContent = hasDevices ? 'Cast to TV 📺' : 'Cast to TV';
}

btnCast.addEventListener('click', () => {
  if (presentationReq) {
    presentationReq.start().catch(() => toggleQr());
  } else {
    toggleQr();
  }
});

function toggleQr() {
  const hidden = castQr.classList.toggle('hidden');
  if (!hidden && !_qrBuilt) {
    new QRCode(document.getElementById('qr-canvas'), {
      text: displayUrl,
      width: 180,
      height: 180,
      colorDark: '#000',
      colorLight: '#fff',
    });
    _qrBuilt = true;
  }
}

document.getElementById('btn-copy-url').addEventListener('click', () => {
  const btn = document.getElementById('btn-copy-url');
  navigator.clipboard.writeText(displayUrl).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Display URL'; }, 2000);
  }).catch(() => {
    btn.textContent = displayUrl;
  });
});
