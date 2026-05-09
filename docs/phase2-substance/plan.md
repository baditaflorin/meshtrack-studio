# Phase 2 Substance Plan

Ranked by user impact on the real-data fixture set:

1. Boundary validation with actionable empty and truncated-input errors
2. BOM and line-ending normalization
3. Trailing-comma tolerant parsing
4. Numeric string coercion for BPM and volume
5. Structure inference for wrapped project objects
6. Structure inference for direct track arrays
7. Duplicate ID detection and deterministic rewrite
8. Pattern-length normalization from 8-step to 16-step
9. Pattern-length normalization from longer grids to 16-step
10. Unknown-field preservation on import/export
11. Provenance metadata in exported projects
12. Confidence scoring for every import
13. Import decision log explaining why fixes were applied
14. Large-project support beyond 8 tracks
15. Recoverable import vs fatal import state taxonomy
16. Deterministic canonical export contract
17. Fixture-driven regression suite for all 10 real inputs
18. Debug overlay for provenance, confidence, and anomalies
19. Local-storage recovery path for invalid saved data
20. Collaboration snapshot normalization before apply
21. Error language rewrite into domain terms
22. Performance measurement on the fixture corpus

## Picklist Mapping

This Phase 2 pass targets items from the catalog:

- A1, A2, A3, A4, A5
- B6, B7, B8, B9
- C11, C12, C14, C15
- D16, D18, D19
- E21, E22
- F24, F25
- G28
- H32, H33, H34
- I35, I37, I38
