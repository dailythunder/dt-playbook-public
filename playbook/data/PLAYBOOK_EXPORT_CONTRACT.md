# Playbook export contract

Private source:

```text
archive/event_registry/reviewed/playbook_days/YYYY-MM-DD/*.reviewed.json
```

Private public-safe export:

```text
archive/event_registry/dist-public/playbook_manifest.json
archive/event_registry/dist-public/playbook_days/YYYY-MM-DD.json
```

Public renderer import:

```text
playbook/data/playbook_manifest.json
playbook/data/playbook_days/YYYY-MM-DD.json
```

ShaiSweeper launch standard:

```text
shaisweeper_standard_9x12_v4
standard mode = made field goals only
free throws excluded from launch mode
one made three = one mine, not three mines
```

The public repo must never become the authoring source. Import validated public-safe exports only.
