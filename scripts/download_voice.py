#!/usr/bin/env python3
"""Download a Piper TTS voice model into models/.

Usage:
    python scripts/download_voice.py
    python scripts/download_voice.py en/en_US/hfc_female/medium en_US-hfc_female-medium
"""
import sys
import urllib.request
from pathlib import Path

MODEL_BASE   = "https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0"
DEFAULT_PATH = "en/en_US/hfc_female/medium"
DEFAULT_STEM = "en_US-hfc_female-medium"


def download(voice_path: str = DEFAULT_PATH, stem: str = DEFAULT_STEM) -> None:
    dest = Path("models")
    dest.mkdir(exist_ok=True)

    for ext in (".onnx", ".onnx.json"):
        filename = f"{stem}{ext}"
        url = f"{MODEL_BASE}/{voice_path}/{filename}"
        out = dest / filename
        if out.exists():
            print(f"  {filename} already exists, skipping.")
            continue
        print(f"  Downloading {filename}...", end=" ", flush=True)
        urllib.request.urlretrieve(url, out)
        print("done.")

    print(f"\nModel ready at models/{stem}.onnx")
    print(f"Start the app with:  PIPER_MODEL=models/{stem}.onnx python app.py")


if __name__ == "__main__":
    vpath = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PATH
    stem  = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_STEM
    download(vpath, stem)
