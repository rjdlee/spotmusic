# Task Markdown Format

Use this template whenever you add or edit a task under `docs/tasks/`. Keeping tasks consistent makes it easier to assign, prioritize, and gate work.

```
# Task Title

## Objective
- One or two sentences that describe what the task is trying to achieve.

## Background
- Any context or links that explain why the task exists (spec references, design docs, tickets, etc.).

## Deliverables
- Ordered list of concrete steps or checks that must be completed to consider the task done.

## Acceptance Criteria
- Bullet list that details the observable results and quality gates (e.g., tests added, edge cases handled, docs updated).

## Notes
- Optional section for constraints, TODOs, pairings, or related tasks.
```

### Style reminders

- Keep the tone task-oriented and avoid implementation detail that might change quickly.
- Use bulleted lists for steps and acceptance criteria; prefer `[ ]` checkboxes when useful.
- Reference related files or specs with workspace-relative paths (e.g., `docs/specs/...`).
