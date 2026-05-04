#!/usr/bin/env python3
"""Build a safe static public Playbook site artifact."""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PLAYBOOK_DIR = REPO_ROOT / "playbook"
CROSSWORDS_DIR = REPO_ROOT / "puzzle_archive/crossword_info_import/crosswords_archive"
PUBLIC_ROOT = REPO_ROOT / "public_playbook_site"

# Ensure existing index builder logic runs first.
if str(Path(__file__).resolve().parent) not in sys.path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_playbook_index import main as build_playbook_index_main  # noqa: E402


def write_root_index() -> None:
    index_html = """<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
  <title>Daily Thunder Playbook</title>
  <meta http-equiv=\"refresh\" content=\"0; url=./playbook/\" />
</head>
<body>
  <p>Redirecting to <a href=\"./playbook/\">Daily Thunder Playbook</a>…</p>
</body>
</html>
"""
    (PUBLIC_ROOT / "index.html").write_text(index_html)


def copy_public_content() -> None:
    if PUBLIC_ROOT.exists():
        shutil.rmtree(PUBLIC_ROOT)
    PUBLIC_ROOT.mkdir(parents=True, exist_ok=True)

    shutil.copytree(PLAYBOOK_DIR, PUBLIC_ROOT / "playbook")
    target_crosswords = PUBLIC_ROOT / "puzzle_archive/crossword_info_import/crosswords_archive"
    target_crosswords.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(CROSSWORDS_DIR, target_crosswords)
    write_root_index()


def verify_public_site() -> None:
    required = [
        PUBLIC_ROOT / "playbook/index.html",
        PUBLIC_ROOT / "playbook/data/playbook_index.json",
        PUBLIC_ROOT / "puzzle_archive/crossword_info_import/crosswords_archive/Rap_Around/index.html",
    ]
    forbidden = [
        PUBLIC_ROOT / "archive",
        PUBLIC_ROOT / "archive_sources",
        PUBLIC_ROOT / "yearbook",
        PUBLIC_ROOT / "puzzle",
    ]

    missing = [str(path.relative_to(REPO_ROOT)) for path in required if not path.exists()]
    present_forbidden = [str(path.relative_to(REPO_ROOT)) for path in forbidden if path.exists()]

    if missing:
        raise SystemExit(f"Verification failed; missing required paths: {missing}")
    if present_forbidden:
        raise SystemExit(f"Verification failed; forbidden paths present: {present_forbidden}")

    print("Verification passed.")
    for path in required:
        print(f" - found: {path.relative_to(REPO_ROOT)}")
    for path in forbidden:
        print(f" - absent: {path.relative_to(REPO_ROOT)}")


def main() -> None:
    build_playbook_index_main()
    copy_public_content()
    verify_public_site()
    print(f"Built safe public artifact at {PUBLIC_ROOT}")


if __name__ == "__main__":
    main()
