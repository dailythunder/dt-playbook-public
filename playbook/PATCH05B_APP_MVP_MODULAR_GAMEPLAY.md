# Patch 05B — app MVP modular gameplay polish

Scope: `dt-playbook-public` only.

This patch replaces the single large Daily Product runtime with a small loader and split runtime chunks.

## What changed

- `daily-product.js` now loads the split JS/CSS chunks.
- Hoardle has a six-guess five-letter game loop.
- Connections remains playable.
- Lookback/scoreboard has field-by-field guess, check, and reveal behavior.
- ShaiSweeper is gated: it renders only when public data has reviewed board coordinates (`board.rows`, `board.cols`, and `board.mine_cells`, or equivalent top-level values).
- Source-pending or missing-board ShaiSweeper files refuse to fake a board.
- Crossword remains an archive-source link until the full crossword runtime is re-integrated.

## Files

```text
playbook/assets/daily-product.js
playbook/assets/daily-product-core.js
playbook/assets/daily-product-hoardle-crossword.js
playbook/assets/daily-product-connections.js
playbook/assets/daily-product-shaisweeper.js
playbook/assets/daily-product-lookback.js
playbook/assets/daily-product-load.js
playbook/assets/daily-product.css
playbook/assets/daily-product-core.css
playbook/assets/daily-product-games.css
```

No Ghost API calls, publishing, or workflow runs are involved.
