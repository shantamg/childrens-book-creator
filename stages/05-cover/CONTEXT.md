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
# Generate one cover at a time, iterate with user
nano-banana "[cover prompt]" -r [character-refs] -a 21:9 -s 1K
```

Generate one cover at a time at 1K. Show the result and ask the user how they like it. Iterate until approved, then upscale to 4K.

Cover canvas: 19.026" x 10.0" (1.9:1) for OnPress Square Hard Cover (8.5x8.5 trim).
Use **21:9** (2.33:1) — intentionally wider than the 1.9:1 canvas. After approval, crop to exact canvas ratio before final print export. This gives headroom on both sides and avoids cramping the composition.

### Prompt rules — CRITICAL

The image generator will add book-like artifacts (spines, creases, page edges, binding) if the prompt mentions books or covers. **Never use these words in cover prompts:**
- "book cover", "cover illustration", "wrap-around"
- "spine", "binding", "front cover", "back cover"
- "panoramic illustration for a book"

**Instead**, describe it as a **wide scene** with compositional direction:

> A wide [style] scene. On the right side: [main subject and action]. On the left side: [complementary scene]. [Style and mood].

### Safe zones for prompt composition

The generated image maps to the physical cover like this:

```
|  4%  |     BACK COVER      |  | 2% |  |     FRONT COVER      |  4%  |
|bleed |   safe: 4% – 48%    |  |dead|  |   safe: 52% – 96%    |bleed |
|      |                     |spine|  |                     |      |
```

Height safe area: 8% – 92% (top/bottom bleed + safety inset)

**Prompt guidance:**
- Place the hero subject (main character) in the **right ~25%** of the image (roughly 70–90% from left). This centers it on the front cover safe area.
- The **center strip (~48–52%)** is the spine fold — avoid placing important details here.
- The **left half** is the back cover — use for complementary scenery, secondary elements.
- Leave room at the **top-right** for title text and **bottom-right** for author name (these get overlaid later).
- All important content must be within safe zones — anything in the outer 4–8% may be trimmed.

### Verify placement (before upscaling)

Use the web tool's cover view to check the image against print zones:
- Open the project in the web tool → Cover tab
- Toggle the print guide overlay on/off
- Verify the hero subject lands in the front cover safe area (right side)
- Verify no important content falls in the spine or bleed zones
- Iterate at 1K until placement is correct, THEN upscale

The legacy CLI guide is also available for quick checks:
```bash
python3 scripts/cover-guide.py --project projects/{slug}
```

Zones: PINK=bleed, RED=trim, GREEN=safety, BLUE=spine folds, YELLOW=spine center

### Upscale and crop

Only after placement is verified:
```bash
# Upscale with the approved 1K as reference
nano-banana "same prompt" -r [character-refs] -r [approved-1k.png] -a 21:9 -s 4K

# Crop to exact canvas ratio (1.9:1) and resize to print dimensions
python3 -c "
from PIL import Image
img = Image.open('cover_4k.png')
target_ratio = 19.026 / 10.0
w, h = img.size
new_w = int(h * target_ratio)
left = (w - new_w) // 2
img.crop((left, 0, left + new_w, h)).resize((5708, 3000), Image.LANCZOS).save('cover_print.png')
"
```

### Cover text

Title and author text on the cover can be:
- Baked into the generated image (simpler)
- Overlaid via the text rendering pipeline (more control)
- Added manually in an image editor (most control)

## Checkpoints

| After | Present | Human decides |
|-------|---------|---------------|
| Cover concept | Description + reference images | Direction and composition |
| Cover image | Generated image | Approve, adjust prompt, or try again |

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Cover image | `../../projects/{slug}/cover/cover.png` | PNG (full wrap) |
| Cover guide | `../../projects/{slug}/cover/cover-guide-preview.jpg` | JPG (annotated) |
| Cover variations | `../../projects/{slug}/cover/variations/` | PNG |
