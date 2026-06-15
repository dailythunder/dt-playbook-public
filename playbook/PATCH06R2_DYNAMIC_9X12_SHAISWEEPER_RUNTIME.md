# Patch 06R2: dynamic 9x12 ShaiSweeper runtime

This patch updates the public Playbook runtime so ShaiSweeper can render reviewed 9x12 boards.

## Changes

- Reads `rows`, `cols`, `cell_ids`, `mine_cells`, or board strings from public day JSON.
- Keeps old 9x9 board strings compatible.
- Uses CSS variables for dynamic grid dimensions.
- Widens the ShaiSweeper shell so 12-column boards remain playable.
- Still refuses `source_pending` boards.

## Data dependency

Patch 06B public data uses:

```json
{
  "grid_id": "shaisweeper_standard_9x12_v4",
  "rows": 9,
  "cols": 12,
  "cell_ids": ["F3", "G4"],
  "mine_cells": [[2, 5], [3, 6]]
}
```

No Ghost action is included.
