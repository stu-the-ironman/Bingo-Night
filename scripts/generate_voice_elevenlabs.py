#!/usr/bin/env python3
"""
Generate all Bingo Night audio clips via ElevenLabs TTS.

Usage:
    export ELEVENLABS_API_KEY=your_key_here
    python scripts/generate_voice_elevenlabs.py           # skip existing
    python scripts/generate_voice_elevenlabs.py --force   # regenerate all
    python scripts/generate_voice_elevenlabs.py --test    # 6 sample clips only
"""

import os
import sys
import time
import wave
from collections import Counter
from pathlib import Path

VOICE_ID    = '689vF2sAlDRr2uhRTrSh'
MODEL_ID    = 'eleven_turbo_v2_5'
OUTPUT_FMT  = 'pcm_24000'
SAMPLE_RATE = 24000

COLUMNS = {
    'B': range(1, 16),
    'I': range(16, 31),
    'N': range(31, 46),
    'G': range(46, 61),
    'O': range(61, 76),
}

# Test set — one from each column plus the main event clips
TEST_BALLS = ['B7', 'I22', 'N38', 'G53', 'O68']

_ONES = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
    'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen',
]
_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy']


def _num_words(n: int) -> str:
    if n < 20:
        return _ONES[n]
    tens, ones = divmod(n, 10)
    return _TENS[tens] + (f'-{_ONES[ones]}' if ones else '')


def _ball_text(letter: str, n: int) -> str:
    # Em-dash gives ElevenLabs a natural beat between letter and number
    return f"{letter} — {_num_words(n)}."


EVENT_CLIPS = {
    'eyes_down': (
        "Eyes down, look in — here comes your first ball of the night!"
    ),
    'bingo': (
        "We have a BINGO! Congratulations to our winner — what a game!"
    ),
    'all_called': (
        "And that is all seventy-five balls called! "
        "Every single number — what an incredible game tonight."
    ),
    'new_game': (
        "Alright, that's it for that round — let's go again! "
        "New game, new cards, new winner. Eyes down coming up!"
    ),
}


def _save_wav(pcm: bytes, path: Path) -> None:
    with wave.open(str(path), 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)


def _generate(client, text: str, path: Path, force: bool) -> str:
    """Returns 'ok', 'skip', or 'fail'."""
    if path.exists() and not force:
        print(f'  skip  {path.name}')
        return 'skip'
    try:
        chunks = client.text_to_speech.convert(
            voice_id=VOICE_ID,
            text=text,
            model_id=MODEL_ID,
            output_format=OUTPUT_FMT,
        )
        _save_wav(b''.join(chunks), path)
        print(f'  ok    {path.name}  ({len(text)} chars)')
        return 'ok'
    except Exception as exc:
        print(f'  fail  {path.name}: {exc}', file=sys.stderr)
        return 'fail'


def main() -> None:
    api_key = os.environ.get('ELEVENLABS_API_KEY')
    if not api_key:
        print('Error: set the ELEVENLABS_API_KEY environment variable.',
              file=sys.stderr)
        sys.exit(1)

    try:
        from elevenlabs import ElevenLabs
    except ImportError:
        print('Error: run  pip install elevenlabs', file=sys.stderr)
        sys.exit(1)

    force   = '--force' in sys.argv
    test    = '--test'  in sys.argv
    client  = ElevenLabs(api_key=api_key)

    balls_dir = Path('static/audio/balls')
    audio_dir = Path('static/audio')
    balls_dir.mkdir(parents=True, exist_ok=True)

    results: Counter = Counter()

    def run(text: str, path: Path) -> None:
        result = _generate(client, text, path, force)
        results[result] += 1
        if result == 'ok':
            time.sleep(0.35)   # stay well within rate limits

    # ── Ball calls ────────────────────────────────────────────────────────────
    print('\n── Ball calls' + (' (test subset)' if test else '') +
          ' ─────────────────────────')
    for letter, nums in COLUMNS.items():
        for n in nums:
            ball = f'{letter}{n}'
            if test and ball not in TEST_BALLS:
                continue
            run(_ball_text(letter, n), balls_dir / f'{ball}.wav')

    # ── Event clips ───────────────────────────────────────────────────────────
    print('\n── Event clips ───────────────────────────────────────────────────')
    for name, text in EVENT_CLIPS.items():
        run(text, audio_dir / f'{name}.wav')

    # ── Summary ───────────────────────────────────────────────────────────────
    total = sum(results.values())
    print(f'\n{results["ok"]} generated · {results["skip"]} skipped '
          f'· {results["fail"]} failed  (of {total} clips)')
    if test:
        print('\nTest run complete. Listen to the clips in static/audio/ '
              'then run without --test to generate the full set.')
    if results['fail']:
        print('Re-run (with --force if needed) to retry failed clips.')


if __name__ == '__main__':
    main()
