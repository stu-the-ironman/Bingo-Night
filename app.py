import logging
import os
from pathlib import Path

from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from bingo.game import BingoGame
from bingo.card_generator import generate_cards
from bingo.session import PlayerRegistry

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

APP_VERSION = 'v0.1.0-dev3'

app = Flask(__name__)
app.config['SECRET_KEY'] = 'bingo-night-secret'
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

game     = BingoGame()
registry = PlayerRegistry()
game_won = False   # cleared on reset; prevents duplicate bingo_winner broadcasts

# TTS state — populated by _init_tts() at startup
_tts          = None
tts_available = False
tts_enabled   = False


def _init_tts() -> None:
    global _tts, tts_available
    model_path = os.environ.get('PIPER_MODEL', 'models/en_US-lessac-medium.onnx')
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


# ---------------------------------------------------------------------------
# Card generator API
# ---------------------------------------------------------------------------

@app.route('/api/cards')
def api_cards():
    count = min(int(request.args.get('count', 6)), 30)
    return jsonify(generate_cards(count))


# ---------------------------------------------------------------------------
# SocketIO events — host
# ---------------------------------------------------------------------------

@socketio.on('connect')
def on_connect():
    emit('state', game.state())
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
    socketio.emit('state', game.state())


@socketio.on('undo')
def on_undo():
    game.undo()
    socketio.emit('state', game.state())


@socketio.on('reset')
def on_reset():
    global game_won
    game_won = False
    game.reset()
    # Push new cards to every connected player before broadcasting state
    for sid, card in registry.reset_cards():
        socketio.emit('new_card', {'card': card}, to=sid)
    socketio.emit('state', game.state())
    socketio.emit('player_list', registry.player_list())


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
        'game_state': game.state(),
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
            'game_state': game.state(),
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
    valid, line = registry.claim(player_id, list(game.called))
    emit('claim_result', {'valid': valid, 'line': line})
    if valid:
        game_won = True
        player = registry.get_by_id(player_id)
        name = player['name'] if player else 'Someone'
        socketio.emit('bingo_winner', {'name': name})
    socketio.emit('player_list', registry.player_list())


if __name__ == '__main__':
    _init_tts()
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
