"""Rebuild the downloadable Napoli Run HTML from the playable dist directory."""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
MIME = {".js": "text/javascript", ".jpg": "image/jpeg", ".webp": "image/webp",
        ".mp3": "audio/mpeg", ".wav": "audio/wav"}


def embed(match):
    asset = DIST / match["path"]
    data = base64.b64encode(asset.read_bytes()).decode("ascii")
    return f'{match["quote"]}data:{MIME[asset.suffix]};base64,{data}{match["quote"]}'


def build():
    html = (DIST / "index.html").read_text(encoding="utf-8")
    css = (DIST / "style.css").read_text(encoding="utf-8")
    game = (DIST / "game.js").read_bytes().decode("utf-8")
    game = re.sub(r"""(?P<quote>['"])\./(?P<path>(?:assets|vendor)/[^'"]+)(?P=quote)""", embed, game)
    html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>{css}</style>")
    html = html.replace('<script type="module" src="game.js"></script>',
                        f'<script type="module">{game}</script>')
    (ROOT / "NAPOLI-RUN.html").write_bytes(html.encode("utf-8"))


if __name__ == "__main__":
    build()
