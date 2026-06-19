import csv
import io
import json
import threading
from datetime import datetime, timezone
from pathlib import Path


class GameAudit:
    def __init__(self, logs_dir: str = 'logs'):
        self._dir = Path(logs_dir)
        self._dir.mkdir(exist_ok=True)
        self._lock = threading.Lock()
        self._session: dict | None = None

    # ── Session lifecycle ────────────────────────────────────────────────────

    def new_session(self) -> str:
        with self._lock:
            session_id = self._next_id()
            self._session = {
                'id': session_id,
                'started_at': _now(),
                'ended_at': None,
                'registrations': [],
                'calls': [],
                'undos': [],
                'winner': None,
            }
            self._save()
            return session_id

    def close_session(self) -> None:
        with self._lock:
            if not self._session:
                return
            self._session['ended_at'] = _now()
            self._save()
            self._session = None

    # ── Event recording ──────────────────────────────────────────────────────

    def record_call(self, ball: str) -> None:
        with self._lock:
            if not self._session:
                self._session = {
                    'id': self._next_id(),
                    'started_at': _now(),
                    'ended_at': None,
                    'registrations': [],
                    'calls': [],
                    'undos': [],
                    'winner': None,
                }
            n = len(self._session['calls']) + 1
            self._session['calls'].append({'n': n, 'ball': ball, 'at': _now()})
            self._save()

    def record_undo(self, ball: str) -> None:
        with self._lock:
            if not self._session:
                return
            self._session['undos'].append({'ball': ball, 'at': _now()})
            self._save()

    def record_registration(self, card_id: str, name: str) -> None:
        with self._lock:
            if not self._session:
                return
            self._session['registrations'].append({
                'card_id': card_id,
                'name': name,
                'at': _now(),
            })
            self._save()

    def record_winner(self, name: str, card_id: str | None = None) -> None:
        with self._lock:
            if not self._session:
                return
            self._session['winner'] = {
                'name': name,
                'card_id': card_id,
                'at': _now(),
            }
            self._save()

    # ── Query ────────────────────────────────────────────────────────────────

    def list_sessions(self) -> list:
        sessions = []
        for path in sorted(self._dir.glob('*.json')):
            try:
                data = json.loads(path.read_text())
                sessions.append({
                    'id':         data.get('id'),
                    'started_at': data.get('started_at'),
                    'ended_at':   data.get('ended_at'),
                    'call_count': len(data.get('calls', [])),
                    'winner':     data.get('winner', {}).get('name') if data.get('winner') else None,
                })
            except Exception:
                pass
        return sessions

    def get_session(self, session_id: str) -> dict | None:
        path = self._dir / f'{session_id}.json'
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text())
        except Exception:
            return None

    def to_csv(self, session_id: str) -> str | None:
        s = self.get_session(session_id)
        if s is None:
            return None
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(['game_id', 'started_at', 'call_n', 'ball', 'timestamp', 'event'])
        for call in s.get('calls', []):
            writer.writerow([s['id'], s.get('started_at', ''), call['n'], call['ball'], call['at'], 'call'])
        for undo in s.get('undos', []):
            writer.writerow([s['id'], s.get('started_at', ''), '', undo['ball'], undo['at'], 'undo'])
        if s.get('winner'):
            w = s['winner']
            writer.writerow([s['id'], s.get('started_at', ''), '', '', w['at'], f"winner:{w['name']}"])
        return buf.getvalue()

    def delete_session(self, session_id: str) -> bool:
        path = self._dir / f'{session_id}.json'
        if path.exists():
            path.unlink()
            return True
        return False

    def clear_all(self) -> int:
        count = 0
        for path in self._dir.glob('*.json'):
            path.unlink()
            count += 1
        return count

    # ── Internal ─────────────────────────────────────────────────────────────

    def _next_id(self) -> str:
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        existing = list(self._dir.glob(f'{today}_*.json'))
        return f'{today}_{len(existing) + 1:03d}'

    def _save(self) -> None:
        if not self._session:
            return
        path = self._dir / f"{self._session['id']}.json"
        path.write_text(json.dumps(self._session, indent=2))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='milliseconds')
