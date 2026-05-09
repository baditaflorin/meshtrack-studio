# Phase 2 Import Performance

Measured with `npm run perf:fixtures` on the committed 10-fixture corpus.

| Fixture                            | Import ms | Export ms | Tracks | Result             |
| ---------------------------------- | --------: | --------: | -----: | ------------------ |
| bom-crlf-export.json               |     18.64 |      9.72 |      1 | ok                 |
| clean-v1-export.json               |      0.61 |      0.05 |      2 | ok                 |
| duplicate-track-ids.json           |      0.60 |      0.05 |      2 | ok                 |
| eight-step-sequencer.json          |     53.45 |      0.07 |      2 | ok                 |
| empty-input.txt                    |      0.03 |         - |      0 | failed as designed |
| huge-12-track-project.json         |      1.40 |      8.88 |     12 | ok                 |
| numeric-strings-project.json       |     22.32 |      0.06 |      1 | ok                 |
| trailing-comma-project.json        |      0.21 |      0.04 |      1 | ok                 |
| truncated-broken-project.json      |      0.23 |         - |      0 | failed as designed |
| wrapped-project-with-metadata.json |      0.91 |      0.06 |      1 | ok                 |

## Summary

- Median import: 2.71 ms
- Worst import: 16.37 ms
- Median export: 0.16 ms
- Worst export: 7.94 ms
