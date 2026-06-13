# Patch 05B: Playbook MVP Modular Gameplay

This patch splits the Daily Product runtime into modular browser-loaded chunks for the Playbook MVP gameplay surface.

## Runtime chunks

- `daily-product.js` now acts as the lightweight loader.
- `daily-product-core.js` holds shared state and render helpers.
- `daily-product-hoardle-crossword.js` keeps crossword and Hoardle gameplay.
- `daily-product-connections.js` keeps the Connections-style puzzle.
- `daily-product-shaisweeper.js` keeps reviewed-board ShaiSweeper gameplay.
- `daily-product-lookback.js` keeps scoreboard trivia and Yearbook unlock behavior.
- `daily-product-load.js` keeps manifest/day fetch orchestration.

## Styling chunks

- `daily-product.css` imports split CSS chunks.
- `daily-product-core.css` contains shell and shared game styling.
- `daily-product-games.css` contains heavier gameplay styling.

## Safety

The runtime continues to fetch `../data/playbook_manifest.json`, refuses pending ShaiSweeper source boards, and keeps gameplay client-side only. No Ghost action is included.
