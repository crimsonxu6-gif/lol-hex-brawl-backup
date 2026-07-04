# Hex Brawl Data

This directory is the canonical data input for Hex Brawl champion pages.

## Champion File

Each champion uses:

```text
data/hex-brawl/champions/{slug}.json
```

Required top-level fields:

- `schemaVersion`: data shape version.
- `mode`: currently `hex-brawl`.
- `patch`: game patch label shown to users.
- `gameDataVersion`: Data Dragon asset version for champion and item icons.
- `updatedAt`: source curation date.
- `dataStatus`: `prototype`, `curated`, `ocr-reviewed`, or `licensed`.
- `champion`: champion id, slug, and localized display names.
- `localized`: page content and augment names by language.
- `builds`: item builds using Data Dragon item ids.
- `hexes`: augment groups by tier, sorted by pick rate during rendering.

The OCR pipeline should write draft files in this shape, then a human reviewer
should promote them to this directory after checking names, icons, and rates.
