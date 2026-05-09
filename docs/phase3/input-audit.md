# Phase 3 Input Audit

Audit date: 2026-05-10

Status legend:

- `green`: works end to end for a real user
- `yellow`: partially works, but missing an expected path or recovery step
- `red`: claimed by the product shape but not truly usable
- `gray`: intentionally out of scope for this product shape

| Input path                          | Status | Notes                                                                                                          |
| ----------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Local file upload (`.json`, `.txt`) | green  | Hidden file input works and Phase 2 fixture coverage is solid.                                                 |
| Local autosave restore              | green  | IndexedDB restore works and now surfaces recovery errors instead of silently falling back.                     |
| Import from messy project-like JSON | green  | BOM, CRLF, trailing commas, numeric strings, wrapper objects, duplicate IDs, and foreign patterns are handled. |
| Drag and drop import                | red    | No drop target exists; users must click through the hidden file picker.                                        |
| Paste project JSON into the app     | red    | No paste surface exists; users have to create a temp file.                                                     |
| Clipboard read import               | red    | No one-click clipboard import exists.                                                                          |
| Deep-link project state             | red    | Room links work for collaboration only; project state itself cannot be loaded from a URL.                      |
| Start fresh from an empty project   | yellow | Reloading defaults works indirectly, but there is no explicit reset/new-project action.                        |
| Clear local autosave                | red    | No UI path exists to delete the saved local project and prove a clean state.                                   |
| Mobile file picker                  | yellow | Native file input should work on mobile browsers, but there is no explicit handling or audit UX.               |
| Multi-file / folder import          | gray   | Out of scope for a single-project browser sketchpad.                                                           |
| URL import from a remote source     | gray   | Out of scope in Mode A because the app has no backend and CORS would make it misleading.                       |
| Imported collaboration snapshot     | yellow | Peer snapshots are normalized, but there is no explicit UI to explain that a room update replaced local state. |

## Immediate Findings

1. Real users can only import via a hidden file input, which makes the app feel narrower than the importer actually is.
2. There is no explicit “new project” or “clear autosave” path, so reload and reset are not coherent states.
3. Collaboration deep links exist, but project-state deep links do not, so “share what I made” is only half implemented.
