# 0061 Input Pathway Coverage Policy

- Status: accepted

## Context

The importer can normalize messy project data, but the UI only exposed file upload and autosave restore.

## Decision

Support four first-class project input pathways in the static app:

1. file picker
2. drag and drop
3. pasted JSON text
4. clipboard text import

Project-state deep links are also allowed because they are fully client-side.

## Consequences

- All input flows reuse the same tolerant importer instead of ad hoc parsing.
- Multi-file, folder, and remote URL import remain out of scope.

## Alternatives Considered

- Keep only file upload and document it better: rejected because it keeps the strongest logic behind the weakest UX.
