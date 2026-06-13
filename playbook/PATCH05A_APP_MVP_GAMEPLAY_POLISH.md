# Patch 05A — app MVP gameplay polish

Scope: `dt-playbook-public` only.

This patch improves the public Playbook daily runtime without changing source data or publishing behavior.

## What changed

- Replaces the reveal-only Hoardle display with a six-guess five-letter game loop.
- Adds a scoreboard trivia interface for lookback boards with field-by-field guesses, checks, reveal, and archive unlock behavior.
- Restores ShaiSweeper runtime support in a gated way:
  - renders playable ShaiSweeper only when a reviewed 9x9 board or `mine_cells` list exists in public day JSON
  - refuses to fake a board for `source_pending` slates
  - supports flags, reveal, timer, reset, and share text
- Keeps Connections playable.
- Keeps crossword as an archive-source link until the full crossword runtime is re-integrated.

## Boundaries

This patch does not touch:

- `dailythunder/dt-archive-private`
- `dailythunder/newdtbuild`
- Ghost
- source/export JSON
- authored slate content

## Reason

Patch 04A proved Ghost draft previews work, but publishing should wait until the public Playbook runtime can support the authored slate. This patch makes Hoardle and scoreboard trivia app-like enough for the June slate, and makes ShaiSweeper safe to include only after a real reviewed board is present.
