#!/usr/bin/env python3
"""Build static Playbook index data from local archive files."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = REPO_ROOT / "puzzle_archive/crossword_info_import/crosswords_archive/manifest.json"
POSTS_ROOT = REPO_ROOT / "archive/posts"
OUTPUT_PATH = REPO_ROOT / "playbook/data/playbook_index.json"

TARGET_GAMES = {
    "From the Logo",
    "Sly",
    "Then and Now",
    "ShaiSweeper",
    "ShaiSweeper+",
}


def load_crosswords() -> list[dict]:
    manifest = json.loads(MANIFEST_PATH.read_text())
    rows = []
    for item in manifest:
        folder = Path("puzzle_archive/crossword_info_import") / item["folder"]
        rows.append(
            {
                "title": item["title"],
                "slug": item["slug"],
                "source_url": item["url"],
                "wrapper_path": str(folder / "index.html"),
                "pdf_path": str(folder / item["pdf"]),
            }
        )
    return rows


def extract_game_name(title: str) -> str | None:
    prefix = "Daily Thunder Playbook:"
    if title.startswith(prefix):
        return title.split(":", 1)[1].strip()
    return None


def load_games() -> list[dict]:
    games = []
    for path in sorted(POSTS_ROOT.rglob("*.jsonl")):
        with path.open() as f:
            for line in f:
                post = json.loads(line)
                title = post.get("title", "")
                tags = post.get("tags") or []
                is_playbook = any("playbook" in t.lower() for t in tags) or "daily thunder playbook" in title.lower()
                if not is_playbook:
                    continue
                game_name = extract_game_name(title)
                if game_name in TARGET_GAMES:
                    games.append(
                        {
                            "game": game_name,
                            "title": title,
                            "url": post.get("url"),
                            "published_at": post.get("published_at"),
                            "tags": tags,
                        }
                    )
    games.sort(key=lambda x: x["published_at"] or "")
    return games


def main() -> None:
    crosswords = load_crosswords()
    games = load_games()
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "crosswords_total": len(crosswords),
        "games_total": len(games),
        "crosswords": crosswords,
        "games": games,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    print(f"Wrote {OUTPUT_PATH} ({len(crosswords)} crosswords, {len(games)} games)")


if __name__ == "__main__":
    main()
