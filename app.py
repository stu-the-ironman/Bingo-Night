from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from bingo.game import BingoGame
from bingo.card_generator import generate_cards

app = Flask(__name__)
app.config['SECRET_KEY'] = 'bingo-night-secret'
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='threading')

game = BingoGame()


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


# ---------------------------------------------------------------------------
# Card generator API
# ---------------------------------------------------------------------------

@app.route('/api/cards')
def api_cards():
    count = min(int(request.args.get('count', 6)), 30)
    return jsonify(generate_cards(count))


# ---------------------------------------------------------------------------
# SocketIO events
# ---------------------------------------------------------------------------

@socketio.on('connect')
def on_connect():
    emit('state', game.state())


@socketio.on('call_next')
def on_call_next():
    ball = game.call_next()
    if ball is None:
        emit('all_called', {})
        return
    state = game.state()
    socketio.emit('state', state)


@socketio.on('undo')
def on_undo():
    game.undo()
    socketio.emit('state', game.state())


@socketio.on('reset')
def on_reset():
    game.reset()
    socketio.emit('state', game.state())


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
