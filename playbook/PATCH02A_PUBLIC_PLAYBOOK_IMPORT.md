# Patch 02A — public Playbook data import and daily renderer switch

Scope: `dt-playbook-public` only.

This patch imports the public-safe Playbook manifest/day JSON produced by Patch 01A in `dt-archive-private` and updates the daily page script to render from that manifest instead of the legacy `daily_product_public.json` slate.

Imported public-safe days:

- 2026-06-14
- 2026-06-15
- 2026-06-17

Skipped by design:

- 2026-06-16 — ShaiSweeper remains `source_pending` in private reviewed source and appears only in the manifest `skipped` list.

This patch does not touch Ghost, `dt-archive-private`, or `newdtbuild`.

Legacy files such as `playbook/data/daily_product_public.json` are left in place for now but are no longer the daily renderer's source path after `playbook/assets/daily-product.js` is updated.
