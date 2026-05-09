# 0062 Output Pathway Coverage Policy

- Status: accepted

## Context

The app could export JSON files but had no direct copy or project-share path.

## Decision

Support three first-class project output pathways:

1. downloadable canonical JSON
2. clipboard copy of canonical JSON
3. project-state share URL encoded entirely client-side

Collaboration-room links remain separate from project-state sharing.

## Consequences

- Users can move state between browsers without creating temp files.
- The app must own a stable client-side share encoding.

## Alternatives Considered

- Add a backend short-link service: rejected because Mode A remains sufficient.
