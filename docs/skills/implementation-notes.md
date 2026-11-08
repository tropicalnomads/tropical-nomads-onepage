# Implementation notes

Use this after a Tropical Nomads ticket is implemented. The developer writes the notes before QA. The coordinator keeps them.

## When

A ticket’s code is in its pull request, before QA signs off.

## Result

A short skill for that ticket, plus one skill per new tool or feature the ticket introduced. Future work reads these instead of reconstructing the change from the diff.

## What to write

- One ticket skill. Name it from the ticket. In a few lines: what changed, where it lives, how to run it, and what the next ticket must not break.
- One skill per new tool or feature. Name it from the tool or feature. In a few lines: what it is for, how to use it, and where the code or config lives.
- Put repo copies under `docs/skills/`. Keep the project workflow copies in `workflows/`.
- Do not paste a tour of the diff. Do not add a skill for a change that only edits an existing tool or feature; add a line to that skill instead.

## Checks

- The ticket skill exists before QA starts.
- Every new tool or feature from the ticket has its own skill.
- The notes match the pull request, not the plan.
