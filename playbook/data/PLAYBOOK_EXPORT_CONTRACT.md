# Daily Thunder app export contract

Private source:

```text
archive/event_registry/reviewed/playbook_days/YYYY-MM-DD/*.reviewed.json
archive/event_registry/reviewed/word_game_clue_bank.json
archive/event_registry/reviewed/hoardle_dictionary.json
```

Private public-safe export:

```text
archive/event_registry/dist-public/playbook_manifest.json
archive/event_registry/dist-public/playbook_days/YYYY-MM-DD.json
archive/event_registry/dist-public/hoardle_dictionary.json
archive/event_registry/dist-public/crosswords/<slug>.json
```

Public renderer import:

```text
playbook/data/playbook_manifest.json
playbook/data/playbook_days/YYYY-MM-DD.json
playbook/data/hoardle_dictionary.json
playbook/data/crosswords/<slug>.json
```

ShaiSweeper launch standard:

```text
shaisweeper_standard_9x12_v4
standard mode = made field goals only
free throws excluded from launch mode
one made three = one mine, not three mines
```

ShaiSweeper chart handling:

```text
chart_image_path is optional
if present, the public popout renders that static image
if missing or broken, the public popout renders a blank 9x12 chart grid
source_url always links to the CourtSketch game page
mine locations are never drawn on the public chart popout before reveal
```

The public repo must never become the authoring source. Import validated public-safe exports only.
