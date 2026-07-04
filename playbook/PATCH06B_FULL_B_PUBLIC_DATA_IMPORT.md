# Patch 06B — full B public Playbook data import

Scope:

- `dailythunder/dt-archive-private`: reviewed source, 9x12 ShaiSweeper playfiles/grid, regenerated public-safe exports, regenerated Ghost draft seed artifacts.
- `dailythunder/dt-playbook-public`: imported public manifest/day JSON.
- `dailythunder/newdtbuild`: no code changes.

This patch promotes the full 2026-06-10 through 2026-06-17 Playbook slate.

## ShaiSweeper policy

- Standard launch mode is FGM-only.
- One made field goal equals one mine.
- Made threes remain one mine and are public clue/audit information, not three mines.
- Free throws are excluded from standard launch boards.
- The 9x12 grid replaces the earlier 9x9 source-pending map for these two reviewed Shai days.

## Exported days

- 2026-06-10 — Connections — ’Mo Words
- 2026-06-11 — ShaiSweeper — 40-Piece vs. Minnesota
- 2026-06-12 — Hoardle — DRAFT
- 2026-06-13 — Connections — What Type?
- 2026-06-14 — Connections — Boxed Out
- 2026-06-15 — Hoardle — RINGS
- 2026-06-16 — ShaiSweeper — 2’s Game 2
- 2026-06-17 — Crossword — Tiny Huge Games

## Runtime dependency

Before publishing/sharing ShaiSweeper days publicly, `dt-playbook-public` should also include the dynamic ShaiSweeper runtime patch that supports 9x12 boards.
