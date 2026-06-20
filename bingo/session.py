import threading
import uuid as uuid_lib
from bingo.card_generator import generate_card

_LETTERS = 'BINGO'

PATTERNS = {
    'line':     None,   # special: any of 12 standard lines
    'corners':  [(0,0),(0,4),(4,0),(4,4)],
    'plus':     [(r,c) for r in range(5) for c in range(5) if r==2 or c==2],
    'x':        sorted({(i,i) for i in range(5)} | {(i,4-i) for i in range(5)}),
    'blackout': [(r,c) for r in range(5) for c in range(5)],
}

PATTERN_NAMES = {
    'line':     'Any Line',
    'corners':  'Four Corners',
    'plus':     'Plus',
    'x':        'X Pattern',
    'blackout': 'Blackout',
}


def _cell_to_ball(col: int, val: int) -> str:
    return f"{_LETTERS[col]}{val}"


def verify_win(grid: list, called_set: set, pattern: str = 'line') -> tuple:
    """Check win for the given pattern. Return (valid, winning_cells)."""
    def is_marked(r, c):
        return grid[r][c] is None or _cell_to_ball(c, grid[r][c]) in called_set

    if pattern == 'line' or pattern not in PATTERNS:
        lines = []
        for r in range(5):
            lines.append([(r, c) for c in range(5)])
        for c in range(5):
            lines.append([(r, c) for r in range(5)])
        lines.append([(i, i) for i in range(5)])
        lines.append([(i, 4 - i) for i in range(5)])
        for line in lines:
            if all(is_marked(r, c) for r, c in line):
                return True, line
        return False, None

    cells = PATTERNS[pattern]
    if all(is_marked(r, c) for r, c in cells):
        return True, cells
    return False, None


class PlayerRegistry:
    def __init__(self):
        self._lock = threading.Lock()
        self._players = {}
        self._socket_map = {}

    def join(self, name: str, socket_id: str) -> tuple:
        player_id = str(uuid_lib.uuid4())
        card = {'id': player_id[:8], 'grid': generate_card()}
        with self._lock:
            self._players[player_id] = {
                'name': name,
                'card': card,
                'socket_id': socket_id,
                'claimed': False,
            }
            self._socket_map[socket_id] = player_id
        return player_id, card

    def rejoin(self, player_id: str, socket_id: str) -> dict | None:
        with self._lock:
            player = self._players.get(player_id)
            if not player:
                return None
            old_sid = player['socket_id']
            if old_sid and old_sid in self._socket_map:
                del self._socket_map[old_sid]
            player['socket_id'] = socket_id
            self._socket_map[socket_id] = player_id
            return player

    def disconnect(self, socket_id: str) -> None:
        with self._lock:
            player_id = self._socket_map.pop(socket_id, None)
            if player_id and player_id in self._players:
                self._players[player_id]['socket_id'] = None

    def claim(self, player_id: str, called: list, pattern: str = 'line') -> tuple:
        with self._lock:
            player = self._players.get(player_id)
            if not player:
                return False, None
            valid, line = verify_win(player['card']['grid'], set(called), pattern)
            if valid:
                player['claimed'] = True
            return valid, line

    def get_by_id(self, player_id: str) -> dict | None:
        with self._lock:
            return self._players.get(player_id)

    def reset_cards(self) -> list:
        with self._lock:
            updates = []
            for player in self._players.values():
                new_card = {'id': player['card']['id'], 'grid': generate_card()}
                player['card'] = new_card
                player['claimed'] = False
                if player['socket_id']:
                    updates.append((player['socket_id'], new_card))
            return updates

    def player_list(self) -> list:
        with self._lock:
            return [
                {
                    'name': p['name'],
                    'claimed': p['claimed'],
                    'connected': p['socket_id'] is not None,
                }
                for p in self._players.values()
            ]
