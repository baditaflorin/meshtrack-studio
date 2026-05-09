# Phase 3 Stranger Test

Audit date: 2026-05-10

Mode: me-as-stranger in a fresh browser context against the local Pages preview

Fixture used: `wrapped-project-with-metadata.json` plus the pasted `numeric-strings-project.json` flow

## What Happened

1. I opened the app fresh and tried to understand how to bring in my own data.
2. I used the pasted-JSON path and got an immediate usable project.
3. I copied a project link and opened it in a fresh context.
4. I compared the room-sharing panel with the project-sharing controls.
5. I checked whether “new project” and “clear local save” felt like different actions.

## Top 3 Confusions

1. Room sharing versus project sharing was too easy to conflate.
   - Fix: clarified the room-link button text and added explanatory copy that room links are live sessions while project links are snapshots.

2. “Clear Save” sounded like it might wipe the current project immediately.
   - Fix: renamed it to “Clear Local Save”.

3. The import surface did not say whether importing would merge or replace.
   - Fix: added copy on the drop/paste surface explaining that imports replace the current project.

## Remaining Confusions

1. Motion DJ mode still reports “Motion Blocked” for both unsupported and denied states.
2. The storage panel is now functionally complete, but visually dense.

## Result

The stranger path is now viable: bring in a project, inspect the repairs, save it locally, copy it out as JSON, or share it as a project link without asking for help.
