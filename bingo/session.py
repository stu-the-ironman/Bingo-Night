import threading
import uuid as uuid_lib
from bingo.card_generator import generate_card

_LETTERS = 'BINGO'


def _cell_to_ball(col: int, val: int) -> str:
    return f"{_LETTERS[col]}{val}"


def verify_win(grid: list, called_set: set) -> tuple:
    """Check all 12 lines (5 rows, 5 cols, 2 diagonals). Return (valid, winning_line)."""
    lines = []
    for r in range(5):
        lines.append([(r, c) for c in range(5)])       # rows
    for c in range(5):
        lines.append([(r, c) for r in range(5)])       # cols
    lines.append([(i, i) for i in range(5)])            # TL→BR diagonal
    lines.append([(i, 4 - i) for i in range(5)])        # TR→BL diagonal

    for line in lines:
        if all(
            grid[r][c] is None or _cell_to_ball(c, grid[r][c]) in called_set
            for r, c in line
        ):
            return True, line
    return False, None


class PlayerRegistry:
    def __init__(self):
        self._lock = threading.Lock()
        self._players = {}      # uuid → {name, card, socket_id, claimed}
        self._socket_map = {}   # socket_id → uuid

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

    def claim(self, player_id: str, called: list) -> tuple:
        with self._lock:
            player = self._players.get(player_id)
            if not player:
                return False, None
            valid, line = verify_win(player['card']['grid'], set(called))
            if valid:
                player['claimed'] = True
            return valid, line

    def get_by_id(self, player_id: str) -> dict | None:
        with self._lock:
            return self._players.get(player_id)

    def reset_cards(self) -> list:
        """Assign new cards to all players, clear claimed. Returns [(socket_id, card)]."""
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
