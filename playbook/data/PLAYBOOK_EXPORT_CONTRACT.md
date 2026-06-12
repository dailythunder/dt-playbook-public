# Playbook public data contract

These files are imported public-safe exports from `dailythunder/dt-archive-private`.

Authoritative private source path:

```text
archive/event_registry/reviewed/playbook_days/
```

Private export path:

```text
archive/event_registry/dist-public/
```

Public import path in this repo:

```text
playbook/data/playbook_manifest.json
playbook/data/playbook_days/YYYY-MM-DD.json
```

Do not hand-author or manually patch these JSON files as source content. If a day, puzzle, lookback, or article needs editing, change the reviewed source in `dt-archive-private`, validate/export there, then re-import the public-safe JSON here.

Patch 02A imports the June 14, June 15, and June 17 public-safe Playbook days. June 16 remains skipped because its ShaiSweeper puzzle is `source_pending` in the private source contract.
