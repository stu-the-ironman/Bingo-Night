from pathlib import Path
import wave
import logging

log = logging.getLogger(__name__)

_LETTERS = 'BINGO'
_RANGES  = [(1, 16), (16, 31), (31, 46), (46, 61), (61, 76)]

ALL_BALLS = [
    f"{letter}{n}"
    for letter, (lo, hi) in zip(_LETTERS, _RANGES)
    for n in range(lo, hi)
]

# How each ball is spoken — letter, natural pause (period), then number
BALL_TEXTS = {ball: f"{ball[0]}. {ball[1:]}" for ball in ALL_BALLS}

SPECIAL_CLIPS = {
    'bingo.wav':      "Bingo!",
    'new_game.wav':   "Eyes down. A new game is starting.",
    'all_called.wav': "That's all seventy five numbers!",
}


class BingoTTS:
    def __init__(self, model_path: str):
        from piper.voice import PiperVoice
        log.info("Loading Piper voice model…")
        self.voice = PiperVoice.load(model_path)
        self.audio_dir = Path('static/audio')

    def generate_all(self, force: bool = False) -> int:
        """Generate WAV clips for all balls + special announcements.
        Skips files that already exist unless force=True.
        Returns the number of files generated."""
        balls_dir = self.audio_dir / 'balls'
        balls_dir.mkdir(parents=True, exist_ok=True)

        count = 0
        for ball, text in BALL_TEXTS.items():
            out = balls_dir / f"{ball}.wav"
            if not force and out.exists():
                continue
            self._synth(text, out)
            count += 1

        for filename, text in SPECIAL_CLIPS.items():
            out = self.audio_dir / filename
            if not force and out.exists():
                continue
            self._synth(text, out)
            count += 1

        return count

    def _synth(self, text: str, out_path: Path) -> None:
        with wave.open(str(out_path), 'w') as wf:
            self.voice.synthesize(text, wf)
