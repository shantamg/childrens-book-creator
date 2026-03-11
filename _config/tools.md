# Available Tools

## nb CLI (Nano Banana)

Image generation using Gemini Pro Image.

- **Location**: `~/bin/nb`
- **Purpose**: Generate illustrations, upscale images
- **Key flags**:
  - `--prompt "..."` — Generation prompt
  - `--ref path/to/reference.png` — Reference image (character sheet)
  - `--res 1k|4k` — Output resolution
  - `--ar 1:1|16:9|2:1` — Aspect ratio
  - `--image path.png` — Input image (for upscaling/variation)

## Python Scripts (in scripts/)

### render-text.py

Renders text overlays onto page images using Playwright.
Uses "bait and switch" technique: 1200px viewport with scale factor
producing 2625px output at print resolution.

```bash
python3 scripts/render-text.py --project projects/{slug}
```

### export-interior-pdf.py

Assembles pages into print-ready interior PDF with CMYK conversion.

```bash
python3 scripts/export-interior-pdf.py --project projects/{slug}
```

### draw-safe-zones.py

Generates preview images with trim/safety zone guides overlaid.

```bash
python3 scripts/draw-safe-zones.py --project projects/{slug}
```

### cover-guide.py

Draws cover template guide with bleed/trim/safety/spine zones.

```bash
python3 scripts/cover-guide.py --project projects/{slug}
```

## ImageMagick

Used for image resizing and conforming.

```bash
# Conform 4K to print resolution
magick input.png -resize 2625x2625 -density 300 output.png

# Split spread into left/right
magick spread.png -crop 50%x100% +repage page-%d.png
```

## Ghostscript

RGB to CMYK PDF conversion with ICC profile.

```bash
gs -dPDFA -dBATCH -dNOPAUSE -sDEVICE=pdfwrite \
  -sColorConversionStrategy=CMYK \
  -sOutputICCProfile=GRACoL2006_Coated1v2.icc \
  -o output.pdf input.pdf
```

## Web Tool

Lightweight browser UI for text positioning.

```bash
cd web && npm run dev
```

Provides: WYSIWYG text overlay editor, safe zone preview, page gallery.
Reads/writes `layout.yaml` in the active project.
