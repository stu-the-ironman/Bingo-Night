import random

COLUMNS = {
    'B': range(1, 16),
    'I': range(16, 31),
    'N': range(31, 46),
    'G': range(46, 61),
    'O': range(61, 76),
}

ALL_BALLS = [f"{letter}{num}" for letter, nums in COLUMNS.items() for num in nums]

BALL_COLORS = {
    'B': '#e74c3c',
    'I': '#e67e22',
    'N': '#27ae60',
    'G': '#2980b9',
    'O': '#8e44ad',
}


class BingoGame:
    def __init__(self):
        self.reset()

    def reset(self):
        self.pool = ALL_BALLS.copy()
        random.shuffle(self.pool)
        self.called: list[str] = []
        self.current: str | None = None

    def call_next(self) -> str | None:
        if not self.pool:
            return None
        ball = self.pool.pop()
        self.called.append(ball)
        self.current = ball
        return ball

    def undo(self) -> str | None:
        if not self.called:
            return None
        ball = self.called.pop()
        self.pool.append(ball)
        self.current = self.called[-1] if self.called else None
        return ball

    def state(self) -> dict:
        return {
            'current': self.current,
            'called': self.called.copy(),
            'remaining': len(self.pool),
            'total': len(ALL_BALLS),
        }

    @staticmethod
    def ball_color(ball: str) -> str:
        return BALL_COLORS.get(ball[0], '#555') if ball else '#555'

    @staticmethod
    def ball_letter(ball: str) -> str:
        return ball[0] if ball else ''

    @staticmethod
    def ball_number(ball: str) -> str:
        return ball[1:] if ball else ''
