import random

COLUMNS = {
    'B': list(range(1, 16)),
    'I': list(range(16, 31)),
    'N': list(range(31, 46)),
    'G': list(range(46, 61)),
    'O': list(range(61, 76)),
}


def generate_card() -> list[list]:
    """Return a 5x5 grid (list of 5 rows, each row is 5 cells).
    Each cell is either an int or None (FREE space at center).
    """
    columns = []
    for letter in ('B', 'I', 'N', 'G', 'O'):
        col = random.sample(COLUMNS[letter], 5)
        columns.append(col)

    # Transpose columns → rows, place FREE in center (row 2, col 2)
    grid = []
    for row_idx in range(5):
        row = [columns[col_idx][row_idx] for col_idx in range(5)]
        grid.append(row)

    grid[2][2] = None  # FREE space
    return grid


def generate_cards(count: int) -> list[dict]:
    cards = []
    for i in range(count):
        grid = generate_card()
        cards.append({'id': i + 1, 'grid': grid})
    return cards
