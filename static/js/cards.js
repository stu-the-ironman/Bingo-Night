const COLORS  = { B: '#e74c3c', I: '#e67e22', N: '#27ae60', G: '#2980b9', O: '#8e44ad' };
const HEADERS = ['B', 'I', 'N', 'G', 'O'];

document.getElementById('btn-generate').addEventListener('click', generateCards);
document.getElementById('btn-print').addEventListener('click', () => window.print());

// ── Colour / B&W toggle ──────────────────────────────────────────────────────
let bwMode = localStorage.getItem('bingo-cards-bw') === 'true';
const btnBw = document.getElementById('btn-bw');

function applyBwMode() {
  document.body.classList.toggle('print-bw', bwMode);
  btnBw.textContent = bwMode ? 'Colour' : 'B&W';
  btnBw.classList.toggle('active', bwMode);
  localStorage.setItem('bingo-cards-bw', bwMode);
}

btnBw.addEventListener('click', () => { bwMode = !bwMode; applyBwMode(); });
applyBwMode();

// ── QR toggle ────────────────────────────────────────────────────────────────
let qrMode = localStorage.getItem('bingo-cards-qr') === 'true';
const btnQr = document.getElementById('btn-qr');

function applyQrMode() {
  btnQr.textContent = qrMode ? 'Hide QR' : 'Show QR';
  btnQr.classList.toggle('active', qrMode);
  localStorage.setItem('bingo-cards-qr', qrMode);
}

btnQr.addEventListener('click', () => { qrMode = !qrMode; applyQrMode(); generateCards(); });
applyQrMode();

// ── Generate on page load ────────────────────────────────────────────────────
generateCards();

// ── Encode grid for verify URL ───────────────────────────────────────────────
function encodeGrid(grid) {
  const vals = [];
  for (let col = 0; col < 5; col++)
    for (let row = 0; row < 5; row++)
      vals.push(grid[row][col] ?? 0);
  return vals.join(',');
}

// ── Fetch + render ───────────────────────────────────────────────────────────
async function generateCards() {
  const count   = Math.max(1, Math.min(200, parseInt(document.getElementById('card-count').value, 10) || 6));
  const perBook = Math.max(1, Math.min(20,  parseInt(document.getElementById('cards-per-book').value, 10) || 4));
  const res   = await fetch(`/api/cards?count=${count}`);
  const cards = await res.json();
  renderCards(cards, perBook);
}

function renderCards(cards, perBook) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';

  // Split cards into books
  const books = [];
  for (let i = 0; i < cards.length; i += perBook)
    books.push(cards.slice(i, i + perBook));

  books.forEach((book, bookIdx) => {
    const serial = String(bookIdx + 1).padStart(3, '0');

    const bookEl = document.createElement('div');
    bookEl.className = 'book-group';

    // Book header — visible on screen and in print
    const headerEl = document.createElement('div');
    headerEl.className = 'book-print-header';
    headerEl.innerHTML =
      `<span class="book-serial">BOOK ${serial}</span>` +
      `<span class="book-player-line">Player: ___________________________</span>`;
    bookEl.appendChild(headerEl);

    book.forEach((card, cardIdx) => {
      bookEl.appendChild(buildCard(card, serial, cardIdx + 1, book.length));
    });

    container.appendChild(bookEl);
  });
}

function buildCard(card, bookSerial, cardNum, totalInBook) {
  const wrap = document.createElement('div');
  wrap.className = 'bingo-card';

  // Book / card position label
  const idEl = document.createElement('div');
  idEl.className = 'card-id';
  idEl.textContent = `BOOK ${bookSerial} — CARD ${cardNum} OF ${totalInBook}`;
  wrap.appendChild(idEl);

  // Header row (B I N G O)
  const header = document.createElement('div');
  header.className = 'card-header';
  for (const letter of HEADERS) {
    const cell = document.createElement('div');
    cell.className = 'card-header-cell';
    cell.style.background = COLORS[letter];
    cell.textContent = letter;
    header.appendChild(cell);
  }
  wrap.appendChild(header);

  // Number grid
  for (const row of card.grid) {
    const rowEl = document.createElement('div');
    rowEl.className = 'card-row';
    for (const val of row) {
      const cell = document.createElement('div');
      cell.className = 'card-cell' + (val === null ? ' free' : '');
      cell.textContent = val === null ? 'FREE' : val;
      rowEl.appendChild(cell);
    }
    wrap.appendChild(rowEl);
  }

  // Footer: QR code + unique card ID
  const footer = document.createElement('div');
  footer.className = 'card-footer';

  if (qrMode) {
    const encoded   = encodeURIComponent(encodeGrid(card.grid));
    const verifyUrl = `${location.origin}/verify?id=${card.id}&c=${encoded}`;
    const qrWrap    = document.createElement('div');
    qrWrap.className = 'card-qr';
    footer.appendChild(qrWrap);
    new QRCode(qrWrap, {
      text: verifyUrl,
      width: 60, height: 60,
      colorDark:  '#000000',
      colorLight: '#ffffff',
    });
  }

  const uidEl = document.createElement('div');
  uidEl.className = 'card-uid';
  uidEl.textContent = card.id;
  footer.appendChild(uidEl);

  wrap.appendChild(footer);
  return wrap;
}
