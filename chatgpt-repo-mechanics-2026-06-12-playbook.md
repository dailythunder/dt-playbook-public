# ChatGPT repo connector mechanics test — Playbook public

This file verifies that ChatGPT can create a committed file in this repository through the GitHub connector.

Repository target: `dailythunder/dt-playbook-public`
Branch: `main`
Date: 2026-06-12

## What this proves

This proves the GitHub connector can write to the explicitly named repository through the GitHub contents API. It does not prove that Codex, a fresh chat, or any hidden mount layer will automatically select the correct repository.

## User-side mechanics

1. Name the exact repository in `owner/name` form.
2. Name the branch, usually `main`.
3. Name the file path to create or edit.
4. Say whether the change should be a direct commit or a PR.
5. Add a repo boundary instruction, for example: `Only use dailythunder/dt-playbook-public for this task.`
6. Ask for the resulting path and commit SHA after the write.

## GPT-side mechanics

1. Treat repo selection as explicit, not implied.
2. Verify repository access with the GitHub connector before writing.
3. Use `create_file` for a new file.
4. Use `fetch_file` first, then `update_file`, when editing an existing file because GitHub requires the file SHA.
5. Pass the exact `repository_full_name` on every tool call.
6. Report the committed path and commit SHA.
7. If a write is blocked by the platform layer, simplify the file text and retry once with the same explicit repository target.

## Working pattern

Prompt pattern:

```text
Target repo: dailythunder/dt-playbook-public
Branch: main
Create or update: path/to/file.md
Use only this repo for this task.
Return the commit SHA when done.
```
