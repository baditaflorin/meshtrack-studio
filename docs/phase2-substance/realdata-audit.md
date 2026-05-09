# Phase 2 Real-Data Audit

## Fixture Set

The Phase 2 fixture set lives in `test/fixtures/realdata/` and covers:

1. Clean canonical export
2. UTF-8 BOM plus CRLF line endings
3. Trailing-comma JSON from hand edits
4. Spreadsheet-style numeric strings
5. 8-step sequencer data from another tool
6. Duplicate track IDs after manual merge
7. Wrapped project plus extra metadata
8. Large 12-track project
9. Empty input
10. Truncated broken payload

## Pass Rate

| Fixture                            | Phase 1             | Phase 2      |
| ---------------------------------- | ------------------- | ------------ |
| clean-v1-export.json               | pass                | pass         |
| bom-crlf-export.json               | fail                | pass         |
| trailing-comma-project.json        | fail                | pass         |
| numeric-strings-project.json       | fail                | pass         |
| eight-step-sequencer.json          | fail                | pass         |
| duplicate-track-ids.json           | wrong-but-confident | pass         |
| wrapped-project-with-metadata.json | fail or silent loss | pass         |
| huge-12-track-project.json         | fail                | pass         |
| empty-input.txt                    | fail generically    | fail clearly |
| truncated-broken-project.json      | fail generically    | fail clearly |

Phase 1 primary-flow pass rate: 1/10

Phase 2 primary-flow pass rate: 8/10

## Audit Notes

### 1. `clean-v1-export.json`

- v1 did: imported successfully.
- should have done: same.
- failure cause: none.
- failure type: none.
- manual work the app should have done: none.

### 2. `bom-crlf-export.json`

- v1 did: failed at `JSON.parse`.
- should have done: strip BOM, normalize line endings, import successfully, and record that normalization happened.
- failure cause: parser assumed clean UTF-8 JSON without leading BOM.
- failure type: obvious but generic.
- manual work the app should have done: remove the invisible BOM and resave the file.

### 3. `trailing-comma-project.json`

- v1 did: rejected the file with a generic invalid-project toast.
- should have done: tolerate trailing commas, import with a warning, and explain the normalization.
- failure cause: strict JSON parser with no repair path.
- failure type: obvious but unhelpful.
- manual work the app should have done: locate and remove syntax noise introduced by hand edits.

### 4. `numeric-strings-project.json`

- v1 did: rejected the file because numeric values were strings.
- should have done: coerce safe numeric strings, clamp to valid ranges, and tell the user what was inferred.
- failure cause: exact schema matching with no type coercion.
- failure type: obvious but too strict.
- manual work the app should have done: convert spreadsheet-flavored values back into numbers.

### 5. `eight-step-sequencer.json`

- v1 did: rejected the file because each pattern was not exactly 16 booleans.
- should have done: detect 8-step patterns, expand them to the 16-step house format, and mark confidence as medium.
- failure cause: fixed internal grid size with no adaptation layer.
- failure type: obvious.
- manual work the app should have done: resize patterns by hand.

### 6. `duplicate-track-ids.json`

- v1 did: accepted the project but applied edits to multiple tracks sharing the same ID.
- should have done: detect duplicate IDs, rewrite them deterministically, and explain the fix.
- failure cause: IDs were trusted without uniqueness validation.
- failure type: wrong-but-confident.
- manual work the app should have done: inspect raw JSON and hand-edit identifiers.

### 7. `wrapped-project-with-metadata.json`

- v1 did: failed if the project was nested, and silently dropped extra fields if it did parse.
- should have done: unwrap the embedded project, preserve extra metadata, and expose that preservation in provenance.
- failure cause: importer only understood one exact top-level shape.
- failure type: silent data loss or hard failure depending on wrapper shape.
- manual work the app should have done: unwrap project data and keep metadata safe.

### 8. `huge-12-track-project.json`

- v1 did: rejected the file because the schema capped the project at 8 tracks.
- should have done: import all 12 tracks, keep the UI responsive, and report that this is a large project.
- failure cause: arbitrary schema cap disconnected from real usage.
- failure type: obvious.
- manual work the app should have done: delete valid tracks before import.

### 9. `empty-input.txt`

- v1 did: threw a generic parse failure.
- should have done: tell the user the file is empty and suggest importing a Meshtrack export or a project-like JSON object.
- failure cause: no boundary validation before parse.
- failure type: obvious but not actionable.
- manual work the app should have done: figure out whether the file was blank or malformed.

### 10. `truncated-broken-project.json`

- v1 did: failed with a generic invalid-project toast.
- should have done: explicitly identify a truncated JSON payload and tell the user to re-export or resend the file.
- failure cause: no syntax-level diagnosis.
- failure type: obvious but unhelpful.
- manual work the app should have done: infer the file was partial and locate a healthier source copy.

## Top 5 Logic Gaps

1. Import only understands the exact v1 schema and does no safe inference.
2. Syntax, encoding, and boundary failures collapse into the same generic error.
3. IDs, wrappers, and extra metadata are trusted or discarded instead of normalized.
4. The 16-step and 8-track assumptions leak directly into import, making the app hostile to real projects.
5. Export and re-import are not treated as a deterministic canonical contract with provenance.

## Top 3 Intuition Failures

1. A file that is obviously close to valid fails completely instead of being corrected with a warning.
2. Extra metadata disappears without the app telling the user that it was dropped.
3. Generic import errors hide whether the problem was empty input, broken JSON, wrong shape, or an unsupported field.

## Top 3 Feels-Stupid Moments

1. The user has to know the exact internal JSON shape before the app will help.
2. The user has to resize or translate obvious pattern variants by hand.
3. The user has to clean up duplicate IDs and spreadsheet-style numeric strings outside the app.

## Definition Of Smart For Meshtrack Studio

- Import project-like JSON and produce a useful first guess instead of demanding a perfect export.
- Normalize common messes such as BOMs, CRLF, string numbers, wrapped projects, duplicate IDs, and non-16-step patterns.
- Preserve extra metadata and explain every repair the importer made.
- Surface confidence, anomalies, and next steps in domain language.
- Export a canonical, deterministic artifact that re-imports losslessly.

## Substance Success Metrics

- At least 8 of the 10 fixtures import successfully with no manual file editing.
- All 10 fixtures produce actionable diagnostics with a `what`, `why`, and `now what`.
- Identical input fixture bytes produce byte-identical canonical exports.
- Duplicate IDs are rewritten deterministically on every run.
- Large fixture import remains responsive and completes in under 300 ms in local tests.
- Empty and truncated inputs never crash and never masquerade as valid projects.

## Out Of Scope

- No new musical features such as MIDI import, piano roll, arrangement view, or sample editing.
- No backend or architecture change.
- No visual redesign pass.
- No cloud sync, auth, or account model.
