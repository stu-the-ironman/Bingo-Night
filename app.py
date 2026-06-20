import logging
import os
from pathlib import Path

from flask import Flask, render_template, request, jsonify, Response
from flask_socketio import SocketIO, emit
from bingo.game import BingoGame
from bingo.card_generator import generate_cards
from bingo.session import PlayerRegistry, verify_win, PATTERNS, PATTERN_NAMES
from bingo.audit import GameAudit

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

APP_VERSION = 'v0.1.0-dev5'

app = Flask(__name__)
app.config['SECRET_KEY'] = 'bingo-night-secret'
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

game          = BingoGame()
registry      = PlayerRegistry()
audit         = GameAudit()
physical_cards = {}   # card_id → {'name': str}
game_won        = False  # cleared on reset; prevents duplicate bingo_winner broadcasts
current_pattern = 'line'

# TTS state — populated by _init_tts() at startup
_tts          = None
tts_available = False
tts_enabled   = False


def _init_tts() -> None:
    global _tts, tts_available
    model_path = os.environ.get('PIPER_MODEL', 'models/en_US-hfc_female-medium.onnx')
    if not Path(model_path).exists():
        log.warning("Piper model not found at %s — TTS disabled. "
                    "Run: python scripts/download_voice.py", model_path)
        return
    try:
        from bingo.tts import BingoTTS
        _tts = BingoTTS(model_path)
        count = _tts.generate_all()
        tts_available = True
        log.info("TTS ready — %d audio file(s) generated.", count)
    except Exception as exc:
        log.warning("TTS init failed: %s — TTS disabled.", exc)


def _game_state() -> dict:
    return {**game.state(), 'pattern': current_pattern}


def _decode_grid(c: str) -> list:
    """Decode a column-major comma-separated string (FREE=0) into a 5×5 row-major grid."""
    vals = [int(x) for x in c.split(',')]
    grid = [[None] * 5 for _ in range(5)]
    for col in range(5):
        for row in range(5):
            v = vals[col * 5 + row]
            grid[row][col] = None if v == 0 else v
    return grid


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    return render_template('controller.html')


@app.route('/display')
def display():
    return render_template('display.html')


@app.route('/cards')
def cards():
    return render_template('cards.html')


@app.route('/play')
def play():
    return render_template('play.html')


@app.route('/verify')
def verify():
    return render_template('verify.html')


# ---------------------------------------------------------------------------
# Card generator API
# ---------------------------------------------------------------------------

@app.route('/api/cards')
def api_cards():
    count = min(int(request.args.get('count', 6)), 200)
    return jsonify(generate_cards(count))


# ---------------------------------------------------------------------------
# Game state API (for verify page)
# ---------------------------------------------------------------------------

@app.route('/api/game-state')
def api_game_state():
    state = game.state()
    return jsonify({
        'current':   state.get('current'),
        'called':    state.get('called', []),
        'remaining': state.get('remaining', 75),
        'game_won':  game_won,
        'pattern':   current_pattern,
    })


# ---------------------------------------------------------------------------
# Physical card registration
# ---------------------------------------------------------------------------

@app.route('/api/card-registration/<card_id>')
def api_card_registration(card_id: str):
    entry = physical_cards.get(card_id)
    if entry:
        return jsonify({'registered': True, 'name': entry['name']})
    return jsonify({'registered': False, 'name': None})


@app.route('/api/register-card', methods=['POST'])
def api_register_card():
    data    = request.get_json(silent=True) or {}
    card_id = str(data.get('card_id', '')).strip()
    name    = str(data.get('name', '')).strip()[:30]
    c       = str(data.get('c', '')).strip()

    if not card_id or not name or not c:
        return jsonify({'error': 'Missing card_id, name or c'}), 400

    try:
        _decode_grid(c)  # validate encoding
    except Exception:
        return jsonify({'error': 'Invalid card data'}), 400

    physical_cards[card_id] = {'name': name}
    audit.record_registration(card_id, name)
    return jsonify({'ok': True})


@app.route('/api/claim-physical', methods=['POST'])
def api_claim_physical():
    global game_won
    if game_won:
        return jsonify({'error': 'Game already won'}), 409

    data    = request.get_json(silent=True) or {}
    card_id = str(data.get('card_id', '')).strip()
    c       = str(data.get('c', '')).strip()

    if not card_id or not c:
        return jsonify({'error': 'Missing card_id or c'}), 400

    try:
        grid = _decode_grid(c)
    except Exception:
        return jsonify({'error': 'Invalid card data'}), 400

    valid, _line = verify_win(grid, set(game.called), current_pattern)
    if not valid:
        return jsonify({'valid': False, 'error': 'Not a winning card yet'}), 200

    game_won = True
    name = physical_cards.get(card_id, {}).get('name', 'Unknown Player')
    audit.record_winner(name, card_id)
    socketio.emit('bingo_winner', {'name': name})
    return jsonify({'valid': True, 'name': name})


# ---------------------------------------------------------------------------
# Audit / session log API
# ---------------------------------------------------------------------------

@app.route('/api/sessions', methods=['GET', 'DELETE'])
def api_sessions():
    if request.method == 'DELETE':
        count = audit.clear_all()
        return jsonify({'deleted': count})
    return jsonify(audit.list_sessions())


@app.route('/api/sessions/<session_id>', methods=['GET', 'DELETE'])
def api_session(session_id: str):
    if request.method == 'DELETE':
        ok = audit.delete_session(session_id)
        return jsonify({'ok': ok}), (200 if ok else 404)
    data = audit.get_session(session_id)
    if data is None:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(data)


@app.route('/api/sessions/<session_id>/csv')
def api_session_csv(session_id: str):
    csv_text = audit.to_csv(session_id)
    if csv_text is None:
        return jsonify({'error': 'Not found'}), 404
    return Response(
        csv_text,
        mimetype='text/csv',
        headers={'Content-Disposition': f'attachment; filename="{session_id}.csv"'},
    )


# ---------------------------------------------------------------------------
# SocketIO events — host
# ---------------------------------------------------------------------------

@socketio.on('connect')
def on_connect():
    emit('state', _game_state())
    emit('player_list', registry.player_list())
    emit('tts_state', {'enabled': tts_enabled, 'available': tts_available})


@socketio.on('disconnect')
def on_disconnect():
    registry.disconnect(request.sid)
    socketio.emit('player_list', registry.player_list())


@socketio.on('call_next')
def on_call_next():
    ball = game.call_next()
    if ball is None:
        emit('all_called', {})
        return
    audit.record_call(ball)
    socketio.emit('state', _game_state())


@socketio.on('undo')
def on_undo():
    last_ball = game.state().get('current')
    game.undo()
    if last_ball:
        audit.record_undo(last_ball)
    socketio.emit('state', _game_state())


@socketio.on('reset')
def on_reset():
    global game_won
    game_won = False
    audit.close_session()
    physical_cards.clear()
    game.reset()
    # Push new cards to every connected player before broadcasting state
    for sid, card in registry.reset_cards():
        socketio.emit('new_card', {'card': card}, to=sid)
    socketio.emit('state', _game_state())
    socketio.emit('player_list', registry.player_list())


@socketio.on('set_pattern')
def on_set_pattern(data):
    global current_pattern
    pattern = data.get('pattern', 'line')
    if pattern in PATTERNS:
        current_pattern = pattern
        socketio.emit('state', _game_state())


@socketio.on('tts_toggle')
def on_tts_toggle():
    global tts_enabled
    if not tts_available:
        emit('tts_state', {'enabled': False, 'available': False})
        return
    tts_enabled = not tts_enabled
    socketio.emit('tts_state', {'enabled': tts_enabled, 'available': tts_available})


# ---------------------------------------------------------------------------
# SocketIO events — players
# ---------------------------------------------------------------------------

@socketio.on('join')
def on_join(data):
    name = str(data.get('name', 'Player')).strip()[:30] or 'Player'
    player_id, card = registry.join(name, request.sid)
    emit('joined', {
        'player_id': player_id,
        'name': name,
        'card': card,
        'game_state': _game_state(),
    })
    socketio.emit('player_list', registry.player_list())


@socketio.on('rejoin')
def on_rejoin(data):
    player_id = str(data.get('player_id', ''))
    player = registry.rejoin(player_id, request.sid)
    if player:
        emit('rejoined', {
            'card': player['card'],
            'name': player['name'],
            'game_state': _game_state(),
        })
        socketio.emit('player_list', registry.player_list())
    else:
        emit('rejoin_failed', {})


@socketio.on('claim_bingo')
def on_claim_bingo(data):
    global game_won
    if game_won:
        return
    player_id = str(data.get('player_id', ''))
    valid, line = registry.claim(player_id, list(game.called), current_pattern)
    emit('claim_result', {'valid': valid, 'line': line})
    if valid:
        game_won = True
        player = registry.get_by_id(player_id)
        name = player['name'] if player else 'Someone'
        audit.record_winner(name)
        socketio.emit('bingo_winner', {'name': name})
    socketio.emit('player_list', registry.player_list())


if __name__ == '__main__':
    _init_tts()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
