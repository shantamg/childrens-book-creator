# Print Specifications

Specs for OnPress book printing. Format-specific dimensions are in `_config/formats.yaml`. Paper options are in `_config/paper-stocks.yaml`.

## How to look up specs for a project

1. Read the project's `book.yaml` → `specs.format` (e.g. `square`, `us-trade`)
2. Look up that format key in `_config/formats.yaml` → trim, document, pixels, aspect ratio
3. Look up the paper stock in `_config/paper-stocks.yaml` → PPI for spine calculation

## Universal Specs (all formats)

### Bleed
- **Interior / softcover / dust jacket**: 0.125" on all sides
- **Hardcover cover canvas**: 0.625" from canvas edge to trim

### Safety Margins
- **Top/Bottom**: 0.44" from document edge
- **Outside edge**: 0.44" from document edge
- **Gutter (binding side)**: 1.0" from document edge
- Odd pages (recto): gutter is on the LEFT
- Even pages (verso): gutter is on the RIGHT

### Resolution & Color
- **Print resolution**: 300 DPI
- **Color mode**: CMYK
- **ICC profile**: GRACoL 2006 Coated (GRACoL2006_Coated1v2.icc)
- **Output intent**: PDF/X-1a
- **Conversion**: RGB to CMYK via Ghostscript

### Page Assembly
- Page 1: Blank (title page)
- Pages 2-N: Story pages in order
- Spreads: Split into left/right halves
- Final page count must be a multiple of 4 (pad with blanks)

### PDF/X-1a Requirements
- All fonts embedded or converted to outlines
- No transparency (flattened)
- CMYK + spot colors only (no RGB)
- Output intent declaration present
- Bleed box defined

## Cover Specs

Cover dimensions are **dynamic** — they depend on trim size, page count, and paper stock. OnPress generates a custom cover template for each project when you save a quote.

### Cover canvas formula (hardcover)
```
canvas_width  = back_cover_width + spine_width + front_cover_width + (2 × hardcover_bleed)
canvas_height = trim_height + (2 × hardcover_bleed)
```

Where:
- `back_cover_width` = `front_cover_width` = trim width
- `hardcover_bleed` = 0.625"
- `spine_width` = page_count / paper_PPI (see paper-stocks.yaml)

### Cover layout
```
| hardcover bleed | back cover | spine | front cover | hardcover bleed |
```

### Safety inset
- 0.188" inside the trim line on all sides

### Spine width
- Formula: `page_count / PPI` (PPI from paper stock)
- Minimum 50 pages for spine text on softcovers (spine < 0.1" below this)
- OnPress generates the exact value in their cover templates

## Current Default: Square 8.5×8.5" Hardcover

These are the specs for the original format used in this workspace, preserved here for quick reference:

- **Trim**: 8.5" × 8.5"
- **Document**: 8.75" × 8.75"
- **Pixels**: 2625 × 2625 px
- **Paper**: White 50lb (~0.0025"/page, ~400 PPI)
- **Cover canvas**: 19.026" × 10.0" (5708 × 3000 px)
- **Spine width**: 0.276" (for the specific page count of that project)
- **Spine positions**: left 9.375", right 9.651", center 9.513"
- **nano-banana aspect**: 1:1
