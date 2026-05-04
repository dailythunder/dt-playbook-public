# Playbook static hub

This `playbook/` folder is a first-pass static hub layer for Daily Thunder Playbook/archive content.

- It indexes archived crosswords and existing published Playbook game posts.
- It is **not** the production posting bot or feed-sync system.
- Data is generated locally via `playbook/scripts/build_playbook_index.py` into `playbook/data/playbook_index.json`.
- `public_playbook_site/` is a generated safe public artifact that contains only the static Playbook hub plus crossword archive wrappers.
- The full repository should **not** be deployed publicly.

- A richer Playbook app shell is intentionally deferred until this static hub is verified in production workflows.

## Public site workflows

- `build-public-playbook-site.yml` is artifact-only and is intended for inspection/validation of the generated output.
- `deploy-public-playbook-site.yml` publishes **only** `public_playbook_site/` to GitHub Pages.
- The full repository must **never** be published to GitHub Pages.

