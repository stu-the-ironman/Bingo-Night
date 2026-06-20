@echo off
title Bingo Night
echo Starting Bingo Night...

:: Install/verify dependencies
python -m pip install -r requirements.txt --quiet

echo.
echo  Controller : http://localhost:5000
echo  Display    : http://localhost:5000/display
echo  Cards      : http://localhost:5000/cards
echo  Play       : http://localhost:5000/play
echo.
python app.py
pause
