const COLORS = { B: '#e74c3c', I: '#e67e22', N: '#27ae60', G: '#2980b9', O: '#8e44ad' };
const HEADERS = ['B', 'I', 'N', 'G', 'O'];

document.getElementById('btn-generate').addEventListener('click', generateCards);
document.getElementById('btn-print').addEventListener('click', () => window.print());

// Generate on page load
generateCards();

async function generateCards() {
  const count = Math.max(1, Math.min(30, parseInt(document.getElementById('card-count').value, 10) || 6));
  const res = await fetch(`/api/cards?count=${count}`);
  const cards = await res.json();
  renderCards(cards);
}

function renderCards(cards) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  for (const card of cards) {
    container.appendChild(buildCard(card));
  }
}

function buildCard(card) {
  const wrap = document.createElement('div');
  wrap.className = 'bingo-card';

  // Card number label
  const idEl = document.createElement('div');
  idEl.className = 'card-id';
  idEl.textContent = `Card #${card.id}`;
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

  return wrap;
}
