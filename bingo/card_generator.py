import random
import string

COLUMNS = {
    'B': list(range(1, 16)),
    'I': list(range(16, 31)),
    'N': list(range(31, 46)),
    'G': list(range(46, 61)),
    'O': list(range(61, 76)),
}


def _card_id() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


def generate_card() -> list[list]:
    """Return a 5×5 grid. Each cell is an int or None (FREE at centre)."""
    columns = []
    for letter in ('B', 'I', 'N', 'G', 'O'):
        col = random.sample(COLUMNS[letter], 5)
        columns.append(col)

    grid = []
    for row_idx in range(5):
        row = [columns[col_idx][row_idx] for col_idx in range(5)]
        grid.append(row)

    grid[2][2] = None  # FREE space
    return grid


def generate_cards(count: int) -> list[dict]:
    return [{'id': _card_id(), 'grid': generate_card()} for _ in range(count)]
