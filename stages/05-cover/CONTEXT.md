# Stage 05 — Cover Design

Design and generate the book cover (wrap-around for hardcover).

## Inputs

| Source | File/Location | Section/Scope | Why |
|--------|--------------|---------------|-----|
| Project config | `../../projects/{slug}/book.yaml` | title, author, style | Cover text and style |
| Character sheets | `../../projects/{slug}/characters/*/approved-model-sheet.png` | Full file | Character reference |
| Art style reference | `../../projects/{slug}/pages/001-page1/approved.png` | Full file | Match interior style |
| Print specs | `../../_config/print-specs.md` | Cover specs | Dimensions, spine, bleed |

## Process

### Cover design

1. Discuss cover concept with user: key scene, mood, composition
2. The cover wraps around: back + spine + front
3. Front cover: title, author name, key illustration
4. Back cover: synopsis or complementary illustration
5. Spine: title and author name

### Cover generation

```bash
# Full wrap-around cover at correct dimensions
nb --prompt "[cover prompt]" --ref [character-refs] --ar 19:10 --res 4k
```

Cover canvas: 19.026" x 10.0" for OnPress Square Hard Cover (8.5x8.5 trim)

### Cover template guide

Generate a guide overlay showing print zones:

```bash
python3 scripts/cover-guide.py --project projects/{slug}
```

Zones: PINK=bleed, RED=trim, GREEN=safety, BLUE=spine folds, YELLOW=spine center

### Cover text

Title and author text on the cover can be:
- Baked into the generated image (simpler)
- Overlaid via the text rendering pipeline (more control)
- Added manually in an image editor (most control)

## Checkpoints

| After | Present | Human decides |
|-------|---------|---------------|
| Cover concept | Description + reference images | Direction and composition |
| Cover variations | 2-3 generated options | Which to approve or iterate |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Cover image | `../../projects/{slug}/cover/cover.png` | PNG (full wrap) |
| Cover guide | `../../projects/{slug}/cover/cover-guide-preview.jpg` | JPG (annotated) |
| Cover variations | `../../projects/{slug}/cover/variations/` | PNG |
